import { Router } from 'express'
import { db, pool } from '../db/client.js'
import { contacts, templates, touchbaseQueue, streakLog } from '../db/schema.js'
import { eq, and, isNull } from 'drizzle-orm'
import { format, addDays, differenceInDays } from 'date-fns'
import { seedDemoData } from '../db/seed.js'

const router = Router()
const today = () => format(new Date(), 'yyyy-MM-dd')

// ── Template matching ──────────────────────────────────────────────────────────
function matchTemplate(contact, contactTagNames, templateList) {
  if (!templateList.length) return null
  const scores = templateList.map(t => {
    let score = 0
    if (t.categoryTag === contact.category) score += 40
    if (t.categoryTag === 'General') score += 10
    if (contact.source === 'conference' && t.categoryTag === 'Conference') score += 20
    if (contact.source === 'linkedin'   && t.categoryTag === 'LinkedIn')   score += 20
    if (t.lastUsedAt) {
      const daysSince = differenceInDays(new Date(), new Date(t.lastUsedAt))
      score -= Math.max(0, 15 - daysSince)
    } else {
      score += 5
    }
    const body = t.body.toLowerCase()
    if (contact.relationshipStrength >= 4 && /catch up|been a while|miss|thinking of you/.test(body)) score += 10
    if (contact.relationshipStrength <= 2 && /hope this finds|reaching out/.test(body)) score += 10
    return { template: t, score }
  })
  scores.sort((a, b) => b.score - a.score)
  return scores[0].template
}

// ── Generate queue entries for upcoming contacts (scoped to userId) ────────────
async function generateQueue(client, userId) {
  await client.query(`
    INSERT INTO touchbase_queue (user_id, contact_id, scheduled_date, status)
    SELECT $1, c.id, COALESCE(c.next_follow_up, CURRENT_DATE), 'pending'
    FROM contacts c
    WHERE c.deleted_at IS NULL
      AND c.user_id = $1
      AND (
        c.next_follow_up <= CURRENT_DATE + INTERVAL '7 days'
        OR c.next_follow_up IS NULL
        OR c.last_contacted IS NULL
      )
      AND NOT EXISTS (
        SELECT 1 FROM touchbase_queue tq
        WHERE tq.contact_id = c.id
          AND tq.user_id = $1
          AND tq.status = 'pending'
          AND tq.scheduled_date >= CURRENT_DATE
      )
    ON CONFLICT DO NOTHING
  `, [userId])
}

// GET /api/touchbase/today
router.get('/today', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const userId = req.userId
    await generateQueue(client, userId)

    const { rows: [topEntry] } = await client.query(`
      SELECT
        tq.id AS queue_id,
        c.*,
        LEAST(
          EXTRACT(EPOCH FROM (NOW() - COALESCE(c.last_contacted, c.created_at)))
          / 86400.0 / NULLIF(c.follow_up_frequency, 0),
          3.0
        ) + (c.relationship_strength * 0.2) AS priority_score
      FROM touchbase_queue tq
      JOIN contacts c ON c.id = tq.contact_id
      WHERE tq.status = 'pending'
        AND tq.scheduled_date <= CURRENT_DATE
        AND tq.user_id = $1
        AND c.deleted_at IS NULL
      ORDER BY priority_score DESC
      LIMIT 1
    `, [userId])

    if (!topEntry) {
      return res.json({ contact: null, template: null, queueId: null, message: 'all_done' })
    }

    const { rows: tagRows } = await client.query(`
      SELECT t.name FROM tags t
      JOIN contact_tags ct ON ct.tag_id = t.id
      WHERE ct.contact_id = $1
    `, [topEntry.id])
    const contactTagNames = tagRows.map(r => r.name)

    const allTemplates = await db
      .select()
      .from(templates)
      .where(and(eq(templates.userId, userId), isNull(templates.deletedAt)))

    const contact = {
      id: topEntry.id,
      fullName: topEntry.full_name,
      email: topEntry.email,
      phone: topEntry.phone,
      company: topEntry.company,
      jobTitle: topEntry.job_title,
      category: topEntry.category,
      linkedinUrl: topEntry.linkedin_url,
      notes: topEntry.notes,
      relationshipStrength: topEntry.relationship_strength,
      lastContacted: topEntry.last_contacted,
      followUpFrequency: topEntry.follow_up_frequency,
      nextFollowUp: topEntry.next_follow_up,
      source: topEntry.source,
      photoPath: topEntry.photo_path,
      conferenceId: topEntry.conference_id,
      createdAt: topEntry.created_at,
      tags: contactTagNames.map(name => ({ name })),
    }

    const bestTemplate = matchTemplate(contact, contactTagNames, allTemplates)

    if (bestTemplate) {
      await db.update(templates)
        .set({ lastUsedAt: new Date(), useCount: bestTemplate.useCount + 1 })
        .where(eq(templates.id, bestTemplate.id))
    }

    res.json({ contact, template: bestTemplate, queueId: topEntry.queue_id, allTemplates })
  } catch (err) {
    next(err)
  } finally {
    client.release()
  }
})

// POST /api/touchbase/done
router.post('/done', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { queueId, contactId } = req.body
    const userId = req.userId
    if (!queueId || !contactId) return res.status(400).json({ error: 'queueId and contactId required' })

    await client.query('BEGIN')

    await client.query(
      `UPDATE touchbase_queue SET status = 'done', updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [queueId, userId]
    )

    const { rows: [contact] } = await client.query(
      `UPDATE contacts
       SET last_contacted = NOW(),
           next_follow_up = (CURRENT_DATE + follow_up_frequency * INTERVAL '1 day')::date,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [contactId, userId]
    )

    await client.query(
      `INSERT INTO streak_log (user_id, completed_date, contact_id)
       VALUES ($1, CURRENT_DATE, $2)
       ON CONFLICT (user_id, completed_date) DO NOTHING`,
      [userId, contactId]
    )

    await client.query('COMMIT')

    const streak = await getStreakStats(client, userId)
    res.json({ success: true, contact, streak })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
})

// POST /api/touchbase/skip
router.post('/skip', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { queueId } = req.body
    const userId = req.userId
    if (!queueId) return res.status(400).json({ error: 'queueId required' })

    await client.query(
      `UPDATE touchbase_queue SET status = 'skipped', updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [queueId, userId]
    )

    const { rows: [next] } = await client.query(`
      SELECT tq.id AS queue_id, c.*
      FROM touchbase_queue tq
      JOIN contacts c ON c.id = tq.contact_id
      WHERE tq.status = 'pending'
        AND tq.scheduled_date <= CURRENT_DATE
        AND tq.user_id = $1
        AND c.deleted_at IS NULL
      ORDER BY
        LEAST(
          EXTRACT(EPOCH FROM (NOW() - COALESCE(c.last_contacted, c.created_at)))
          / 86400.0 / NULLIF(c.follow_up_frequency, 0),
          3.0
        ) + (c.relationship_strength * 0.2) DESC
      LIMIT 1
    `, [userId])

    if (!next) return res.json({ contact: null, queueId: null, message: 'all_done' })

    const { rows: tagRows } = await client.query(
      `SELECT t.name FROM tags t JOIN contact_tags ct ON ct.tag_id = t.id WHERE ct.contact_id = $1`,
      [next.id]
    )

    const allTemplates = await db
      .select()
      .from(templates)
      .where(and(eq(templates.userId, userId), isNull(templates.deletedAt)))

    const contact = {
      id: next.id,
      fullName: next.full_name,
      company: next.company,
      jobTitle: next.job_title,
      category: next.category,
      relationshipStrength: next.relationship_strength,
      lastContacted: next.last_contacted,
      followUpFrequency: next.follow_up_frequency,
      source: next.source,
      photoPath: next.photo_path,
      tags: tagRows.map(r => ({ name: r.name })),
    }

    const bestTemplate = matchTemplate(contact, tagRows.map(r => r.name), allTemplates)
    res.json({ contact, template: bestTemplate, queueId: next.queue_id, allTemplates })
  } catch (err) {
    next(err)
  } finally {
    client.release()
  }
})

// GET /api/touchbase/streak
router.get('/streak', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const stats = await getStreakStats(client, req.userId)
    res.json(stats)
  } catch (err) {
    next(err)
  } finally {
    client.release()
  }
})

async function getStreakStats(client, userId) {
  const { rows: [{ current_streak }] } = await client.query(`
    WITH ordered AS (
      SELECT completed_date,
             completed_date - (ROW_NUMBER() OVER (ORDER BY completed_date))::int AS grp
      FROM streak_log
      WHERE completed_date <= CURRENT_DATE AND user_id = $1
    ),
    groups AS (
      SELECT grp, MAX(completed_date) AS last_day, COUNT(*)::int AS run
      FROM ordered GROUP BY grp
    )
    SELECT COALESCE(
      (SELECT run FROM groups WHERE last_day >= CURRENT_DATE - 1 ORDER BY last_day DESC LIMIT 1),
      0
    ) AS current_streak
  `, [userId])

  const { rows: [{ longest_streak }] } = await client.query(`
    WITH ordered AS (
      SELECT completed_date,
             completed_date - (ROW_NUMBER() OVER (ORDER BY completed_date))::int AS grp
      FROM streak_log WHERE user_id = $1
    ),
    groups AS (SELECT COUNT(*)::int AS run FROM ordered GROUP BY grp)
    SELECT COALESCE(MAX(run), 0) AS longest_streak FROM groups
  `, [userId])

  const { rows: [{ total }] } = await client.query(
    `SELECT COUNT(*)::int AS total FROM streak_log WHERE user_id = $1`,
    [userId]
  )

  const { rows: weekRows } = await client.query(`
    SELECT completed_date::text FROM streak_log
    WHERE completed_date >= CURRENT_DATE - 6 AND user_id = $1
    ORDER BY completed_date ASC
  `, [userId])

  const milestones = [7, 14, 30, 60, 90, 180, 365]
  const nextMilestone = milestones.find(m => m > current_streak) || null

  return {
    currentStreak: current_streak,
    longestStreak: longest_streak,
    total,
    weeklyDates: weekRows.map(r => r.completed_date),
    nextMilestone,
  }
}

// POST /api/touchbase/seed-demo  — loads sample contacts for first-time users
router.post('/seed-demo', async (req, res, next) => {
  try {
    const userId = req.userId
    // Only seed if the user has no contacts yet
    const existing = await db.select({ id: contacts.id }).from(contacts)
      .where(and(eq(contacts.userId, userId), isNull(contacts.deletedAt)))
      .limit(1)
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You already have contacts — demo data not loaded.' })
    }
    const result = await seedDemoData(userId)
    res.json({ success: true, ...result })
  } catch (err) { next(err) }
})

export default router
