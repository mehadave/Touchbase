import { Router } from 'express'
import { db, pool } from '../db/client.js'
import { contacts, tags, contactTags } from '../db/schema.js'
import { eq, and, isNull, ilike, inArray, lte, sql, desc, asc } from 'drizzle-orm'
import { upload } from '../middleware/upload.js'
import { addDays, format } from 'date-fns'
import path from 'path'
import fs from 'fs'

const router = Router()

function computeNextFollowUp(lastContacted, frequencyDays) {
  const base = lastContacted ? new Date(lastContacted) : new Date()
  return format(addDays(base, frequencyDays), 'yyyy-MM-dd')
}

async function enrichContact(contact) {
  const tagRows = await db
    .select({ name: tags.name, id: tags.id })
    .from(tags)
    .innerJoin(contactTags, eq(contactTags.tagId, tags.id))
    .where(eq(contactTags.contactId, contact.id))
    .orderBy(tags.name)
  return { ...contact, tags: tagRows }
}

async function enrichContacts(contactList) {
  if (!contactList.length) return []
  const ids = contactList.map(c => c.id)
  const tagRows = await db
    .select({ contactId: contactTags.contactId, name: tags.name, id: tags.id })
    .from(contactTags)
    .innerJoin(tags, eq(tags.id, contactTags.tagId))
    .where(inArray(contactTags.contactId, ids))
  const tagsByContact = {}
  for (const row of tagRows) {
    if (!tagsByContact[row.contactId]) tagsByContact[row.contactId] = []
    tagsByContact[row.contactId].push({ id: row.id, name: row.name })
  }
  return contactList.map(c => ({ ...c, tags: tagsByContact[c.id] || [] }))
}

async function upsertTags(contactId, tagNames) {
  await db.delete(contactTags).where(eq(contactTags.contactId, contactId))
  if (!tagNames || tagNames.length === 0) return
  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase().replace(/^#/, '')
    if (!trimmed) continue
    let [tag] = await db.select().from(tags).where(ilike(tags.name, trimmed))
    if (!tag) {
      ;[tag] = await db.insert(tags).values({ name: trimmed }).returning()
    }
    await db.insert(contactTags).values({ contactId, tagId: tag.id }).onConflictDoNothing()
  }
}

// GET /api/contacts
router.get('/', async (req, res, next) => {
  try {
    const {
      search, category, strength, overdue, conference_id,
      tag, sort = 'name', limit = '200', offset = '0',
    } = req.query
    const userId = req.userId

    if (search && search.trim()) {
      const ftsQuery = search.trim().split(/\s+/)
        .map(w => w.replace(/[^a-zA-Z0-9]/g, '') + ':*')
        .filter(Boolean)
        .join(' & ')
      const client = await pool.connect()
      try {
        const { rows } = await client.query(`
          SELECT c.*,
            ts_rank(c.search_vector, to_tsquery('english', $1)) AS rank
          FROM contacts c
          WHERE c.search_vector @@ to_tsquery('english', $1)
            AND c.deleted_at IS NULL
            AND c.user_id = $4
          ORDER BY rank DESC
          LIMIT $2 OFFSET $3
        `, [ftsQuery, parseInt(limit), parseInt(offset), userId])
        return res.json(await enrichContacts(rows))
      } finally { client.release() }
    }

    if (tag) {
      const client = await pool.connect()
      try {
        const { rows } = await client.query(`
          SELECT DISTINCT c.* FROM contacts c
          JOIN contact_tags ct ON ct.contact_id = c.id
          JOIN tags t ON t.id = ct.tag_id
          WHERE LOWER(t.name) = LOWER($1)
            AND c.deleted_at IS NULL
            AND c.user_id = $4
          ORDER BY c.full_name ASC
          LIMIT $2 OFFSET $3
        `, [tag, parseInt(limit), parseInt(offset), userId])
        return res.json(await enrichContacts(rows))
      } finally { client.release() }
    }

    const conditions = [isNull(contacts.deletedAt), eq(contacts.userId, userId)]
    if (category)      conditions.push(eq(contacts.category, category))
    if (strength)      conditions.push(eq(contacts.relationshipStrength, parseInt(strength)))
    if (conference_id) conditions.push(eq(contacts.conferenceId, conference_id))
    if (overdue === 'true') {
      conditions.push(lte(contacts.nextFollowUp, format(new Date(), 'yyyy-MM-dd')))
    }

    const orderMap = {
      name:           asc(contacts.fullName),
      last_contacted: asc(contacts.lastContacted),
      next_follow_up: asc(contacts.nextFollowUp),
      strength:       desc(contacts.relationshipStrength),
    }
    const orderBy = orderMap[sort] || asc(contacts.fullName)

    const results = await db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(parseInt(limit))
      .offset(parseInt(offset))

    res.json(await enrichContacts(results))
  } catch (err) { next(err) }
})

// GET /api/contacts/tags/all
router.get('/tags/all', async (req, res, next) => {
  try {
    const client = await pool.connect()
    try {
      const { rows } = await client.query(`
        SELECT t.name, COUNT(ct.contact_id)::int AS usage_count
        FROM tags t
        LEFT JOIN contact_tags ct ON ct.tag_id = t.id
        LEFT JOIN contacts c ON c.id = ct.contact_id AND c.deleted_at IS NULL AND c.user_id = $1
        GROUP BY t.id, t.name
        HAVING COUNT(ct.contact_id) > 0
        ORDER BY usage_count DESC, t.name ASC
      `, [req.userId])
      res.json(rows)
    } finally { client.release() }
  } catch (err) { next(err) }
})

// GET /api/contacts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, req.params.id), eq(contacts.userId, req.userId), isNull(contacts.deletedAt)))
    if (!contact) return res.status(404).json({ error: 'Contact not found' })
    res.json(await enrichContact(contact))
  } catch (err) { next(err) }
})

// POST /api/contacts
router.post('/', async (req, res, next) => {
  try {
    const {
      fullName, email, phone, company, jobTitle, category,
      linkedinUrl, notes, relationshipStrength, lastContacted,
      followUpFrequency, source, conferenceId, tags: tagNames,
    } = req.body
    if (!fullName?.trim()) return res.status(400).json({ error: 'Full name is required' })

    const freq = followUpFrequency || 30
    const nextFollowUp = computeNextFollowUp(lastContacted, freq)

    const [contact] = await db.insert(contacts).values({
      userId:               req.userId,
      fullName:             fullName.trim(),
      email:                email?.trim() || null,
      phone:                phone?.trim() || null,
      company:              company?.trim() || null,
      jobTitle:             jobTitle?.trim() || null,
      category:             category || 'Personal',
      linkedinUrl:          linkedinUrl?.trim() || null,
      notes:                notes?.trim() || null,
      relationshipStrength: relationshipStrength || 3,
      lastContacted:        lastContacted ? new Date(lastContacted) : null,
      followUpFrequency:    freq,
      nextFollowUp,
      source:               source || 'manual',
      conferenceId:         conferenceId || null,
    }).returning()

    if (tagNames?.length) await upsertTags(contact.id, tagNames)

    // Auto-create a note if notes were provided
    if (notes?.trim()) {
      await pool.query(
        `INSERT INTO notes (user_id, title, body, category, contact_id)
         VALUES ($1, $2, $3, 'Contact Notes', $4)`,
        [req.userId, `Notes — ${fullName.trim()}`, notes.trim(), contact.id]
      )
    }

    res.status(201).json(await enrichContact(contact))
  } catch (err) { next(err) }
})

// PUT /api/contacts/:id
router.put('/:id', async (req, res, next) => {
  try {
    const [existing] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, req.params.id), eq(contacts.userId, req.userId), isNull(contacts.deletedAt)))
    if (!existing) return res.status(404).json({ error: 'Contact not found' })

    const {
      fullName, email, phone, company, jobTitle, category,
      linkedinUrl, notes, relationshipStrength, lastContacted,
      followUpFrequency, source, conferenceId, tags: tagNames,
    } = req.body

    const freq = followUpFrequency ?? existing.followUpFrequency
    const lc = lastContacted !== undefined
      ? (lastContacted ? new Date(lastContacted) : null)
      : existing.lastContacted
    const nextFollowUp = computeNextFollowUp(lc, freq)

    const [updated] = await db
      .update(contacts)
      .set({
        fullName:             fullName?.trim()    ?? existing.fullName,
        email:                email?.trim()       ?? existing.email,
        phone:                phone?.trim()       ?? existing.phone,
        company:              company?.trim()     ?? existing.company,
        jobTitle:             jobTitle?.trim()    ?? existing.jobTitle,
        category:             category            ?? existing.category,
        linkedinUrl:          linkedinUrl?.trim() ?? existing.linkedinUrl,
        notes:                notes?.trim()       ?? existing.notes,
        relationshipStrength: relationshipStrength ?? existing.relationshipStrength,
        lastContacted:        lc,
        followUpFrequency:    freq,
        nextFollowUp,
        source:               source ?? existing.source,
        conferenceId:         conferenceId !== undefined ? (conferenceId || null) : existing.conferenceId,
      })
      .where(and(eq(contacts.id, req.params.id), eq(contacts.userId, req.userId)))
      .returning()

    if (tagNames !== undefined) await upsertTags(updated.id, tagNames)

    // Sync the linked "Contact Notes" note if the notes field changed
    if (notes !== undefined) {
      const newNotes = notes?.trim() || ''
      if (newNotes) {
        // Upsert: update existing Contact Notes note, or create one
        const { rows: existingNotes } = await pool.query(
          `SELECT id FROM notes WHERE contact_id = $1 AND user_id = $2 AND category = 'Contact Notes' AND deleted_at IS NULL LIMIT 1`,
          [updated.id, req.userId]
        )
        if (existingNotes.length > 0) {
          await pool.query(
            `UPDATE notes SET body = $1, updated_at = NOW() WHERE id = $2`,
            [newNotes, existingNotes[0].id]
          )
        } else {
          await pool.query(
            `INSERT INTO notes (user_id, title, body, category, contact_id) VALUES ($1, $2, $3, 'Contact Notes', $4)`,
            [req.userId, `Notes — ${updated.fullName}`, newNotes, updated.id]
          )
        }
      }
    }

    res.json(await enrichContact(updated))
  } catch (err) { next(err) }
})

// DELETE /api/contacts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, req.params.id), eq(contacts.userId, req.userId), isNull(contacts.deletedAt)))
    if (!contact) return res.status(404).json({ error: 'Contact not found' })

    await db.update(contacts)
      .set({ deletedAt: new Date() })
      .where(and(eq(contacts.id, req.params.id), eq(contacts.userId, req.userId)))

    if (contact.photoPath) {
      const filePath = path.join(process.cwd(), contact.photoPath.replace('/uploads/', 'uploads/'))
      fs.unlink(filePath, () => {})
    }
    res.json({ success: true })
  } catch (err) { next(err) }
})

// POST /api/contacts/:id/photo
router.post('/:id/photo', upload.single('photo'), async (req, res, next) => {
  try {
    const [existing] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, req.params.id), eq(contacts.userId, req.userId), isNull(contacts.deletedAt)))
    if (!existing) return res.status(404).json({ error: 'Contact not found' })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    if (existing.photoPath) {
      const old = path.join(process.cwd(), existing.photoPath.replace('/uploads/', 'uploads/'))
      fs.unlink(old, () => {})
    }

    const photoPath = `/uploads/${req.file.filename}`
    const [updated] = await db
      .update(contacts)
      .set({ photoPath })
      .where(and(eq(contacts.id, req.params.id), eq(contacts.userId, req.userId)))
      .returning()

    res.json({ photoPath, contact: await enrichContact(updated) })
  } catch (err) { next(err) }
})

// POST /api/contacts/import
router.post('/import', async (req, res, next) => {
  try {
    const { contacts: rows, duplicateStrategy = 'skip' } = req.body
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'contacts must be an array' })

    let imported = 0, skipped = 0, updated = 0

    for (const row of rows) {
      if (!row.fullName?.trim()) { skipped++; continue }

      let existing = null
      if (row.email?.trim()) {
        ;[existing] = await db
          .select()
          .from(contacts)
          .where(and(ilike(contacts.email, row.email.trim()), eq(contacts.userId, req.userId), isNull(contacts.deletedAt)))
      }

      if (existing) {
        if (duplicateStrategy === 'skip') { skipped++; continue }
        if (duplicateStrategy === 'update') {
          const freq = row.followUpFrequency || existing.followUpFrequency
          await db.update(contacts).set({
            fullName:          row.fullName?.trim()    || existing.fullName,
            phone:             row.phone?.trim()       || existing.phone,
            company:           row.company?.trim()     || existing.company,
            jobTitle:          row.jobTitle?.trim()    || existing.jobTitle,
            category:          row.category            || existing.category,
            linkedinUrl:       row.linkedinUrl?.trim() || existing.linkedinUrl,
            notes:             row.notes?.trim()       || existing.notes,
            followUpFrequency: freq,
            nextFollowUp:      computeNextFollowUp(existing.lastContacted, freq),
            source:            'csv',
          }).where(and(eq(contacts.id, existing.id), eq(contacts.userId, req.userId)))
          if (row.tags?.length) await upsertTags(existing.id, row.tags)
          updated++
          continue
        }
      }

      const freq = row.followUpFrequency || 30
      const [contact] = await db.insert(contacts).values({
        userId:            req.userId,
        fullName:          row.fullName.trim(),
        email:             row.email?.trim() || null,
        phone:             row.phone?.trim() || null,
        company:           row.company?.trim() || null,
        jobTitle:          row.jobTitle?.trim() || null,
        category:          row.category || 'Professional',
        linkedinUrl:       row.linkedinUrl?.trim() || null,
        notes:             row.notes?.trim() || null,
        relationshipStrength: row.relationshipStrength || 3,
        followUpFrequency: freq,
        nextFollowUp:      computeNextFollowUp(null, freq),
        source:            'csv',
      }).returning()

      if (row.tags?.length) await upsertTags(contact.id, row.tags)
      imported++
    }

    res.json({ imported, skipped, updated })
  } catch (err) { next(err) }
})

export default router
