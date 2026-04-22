import { Router } from 'express'
import { db } from '../db/client.js'
import { templates } from '../db/schema.js'
import { eq, and, isNull, desc, asc, ilike } from 'drizzle-orm'

const router = Router()

// Default templates every user should have — checked by title on first load
const DEFAULT_TEMPLATES = [
  {
    title: 'Catch up — been a while',
    categoryTag: 'Personal',
    body: `Hey {name}!\n\nIt's been way too long — hope everything's going well on your end. I was thinking about you the other day and realized we haven't talked in ages.\n\nWould love to grab a coffee or hop on a quick call soon. Are you around in the next couple of weeks?\n\nTalk soon!`,
  },
  {
    title: 'Conference follow-up',
    categoryTag: 'Conference',
    body: `Hey {name},\n\nReally great meeting you at [event] — I loved our conversation about {company} and what you're working on there.\n\nWould love to stay in touch and maybe grab a virtual coffee to dig deeper. What does your schedule look like?\n\nLooking forward to it!`,
  },
  {
    title: 'LinkedIn connection follow-up',
    categoryTag: 'LinkedIn',
    body: `Hi {name},\n\nThanks for connecting! I noticed you're at {company} as {title} — really interesting work. I've been following what you're doing and would love to hear more about it.\n\nOpen to a quick 20-minute intro call sometime?\n\nBest,`,
  },
  {
    title: 'Warm congratulations',
    categoryTag: 'Personal',
    body: `Hey {name}!\n\nJust saw the news about [achievement] — that's genuinely fantastic, you've worked so hard for this and it shows.\n\nWould love to hear all about it when you have a moment. Huge congrats! 🎉`,
  },
  {
    title: 'Professional check-in',
    categoryTag: 'Professional',
    body: `Hi {name},\n\nHope things are going well! I've been keeping an eye on what {company} has been up to — looks like exciting times over there.\n\nWould love to reconnect and hear what you've been working on. Grab a quick call soon?\n\nLooking forward to it!`,
  },
  {
    title: 'Intro ask — warm referral',
    categoryTag: 'Professional',
    body: `Hi {name},\n\nHope all's well! Quick ask — I've been trying to connect with someone at [company/area] and thought of you immediately given your network.\n\nWould you happen to know anyone there who'd be open to a quick chat? Totally understand if not, just figured it was worth asking!\n\nEither way, would love to catch up soon.`,
  },
  {
    title: 'Simple check-in',
    categoryTag: 'General',
    body: `Hey {name}!\n\nJust dropping a quick note to say hi and see how things are going with you. What's new?\n\nHope life's been treating you well — talk soon!`,
  },
  {
    title: 'Post-meeting follow-up',
    categoryTag: 'Professional',
    body: `Hi {name},\n\nReally appreciated the time earlier — great conversation and I walked away with a lot to think about.\n\nI'll follow up on [action item] by [date]. Let me know if there's anything else I can do on my end in the meantime.\n\nTalk soon!`,
  },
]

async function ensureDefaultTemplates(userId) {
  // Fetch existing (non-deleted) template titles for this user
  const existing = await db
    .select({ title: templates.title })
    .from(templates)
    .where(and(eq(templates.userId, userId), isNull(templates.deletedAt)))
  const existingTitles = new Set(existing.map(t => t.title.toLowerCase()))

  const missing = DEFAULT_TEMPLATES.filter(
    t => !existingTitles.has(t.title.toLowerCase())
  )
  if (missing.length > 0) {
    await db.insert(templates).values(
      missing.map(t => ({ ...t, userId }))
    )
  }
}

router.get('/', async (req, res, next) => {
  try {
    // On first visit (or whenever defaults are missing), quietly top-up
    await ensureDefaultTemplates(req.userId)

    const results = await db
      .select()
      .from(templates)
      .where(and(eq(templates.userId, req.userId), isNull(templates.deletedAt)))
      .orderBy(desc(templates.lastUsedAt), asc(templates.createdAt))
    res.json(results)
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const [tmpl] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, req.params.id), eq(templates.userId, req.userId), isNull(templates.deletedAt)))
    if (!tmpl) return res.status(404).json({ error: 'Template not found' })
    res.json(tmpl)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { title, body, categoryTag } = req.body
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' })
    if (!body?.trim())  return res.status(400).json({ error: 'Body is required' })
    const [tmpl] = await db.insert(templates).values({
      userId:      req.userId,
      title:       title.trim(),
      body:        body.trim(),
      categoryTag: categoryTag?.trim() || null,
    }).returning()
    res.status(201).json(tmpl)
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const [existing] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, req.params.id), eq(templates.userId, req.userId), isNull(templates.deletedAt)))
    if (!existing) return res.status(404).json({ error: 'Template not found' })

    const { title, body, categoryTag } = req.body
    const [updated] = await db
      .update(templates)
      .set({
        title:       title?.trim()       ?? existing.title,
        body:        body?.trim()        ?? existing.body,
        categoryTag: categoryTag?.trim() ?? existing.categoryTag,
      })
      .where(and(eq(templates.id, req.params.id), eq(templates.userId, req.userId)))
      .returning()
    res.json(updated)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const [existing] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, req.params.id), eq(templates.userId, req.userId), isNull(templates.deletedAt)))
    if (!existing) return res.status(404).json({ error: 'Template not found' })

    await db.update(templates)
      .set({ deletedAt: new Date() })
      .where(and(eq(templates.id, req.params.id), eq(templates.userId, req.userId)))
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
