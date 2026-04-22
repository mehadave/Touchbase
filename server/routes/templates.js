import { Router } from 'express'
import { db } from '../db/client.js'
import { templates } from '../db/schema.js'
import { eq, and, isNull, desc, asc, ilike } from 'drizzle-orm'

const router = Router()

// Default templates — written to sound like a real person, not a chatbot.
// Bodies are refreshed on every GET so existing users get the updated wording too.
const DEFAULT_TEMPLATES = [
  {
    title: 'Catch up — been a while',
    categoryTag: 'Personal',
    body: `Hey {name}!\n\nOkay I feel bad it's been this long 😅 Was just thinking about you and realised we haven't properly talked in ages.\n\nWhat's going on with you? Would love to grab a coffee or a quick call soon and actually catch up. What does your schedule look like?`,
  },
  {
    title: 'Conference follow-up',
    categoryTag: 'Conference',
    body: `Hey {name}! Really glad we got to meet at [event] — our chat about [topic] actually stuck with me.\n\nWould you be up for continuing the conversation over a call sometime? No real agenda, just want to keep in touch.`,
  },
  {
    title: 'LinkedIn connection follow-up',
    categoryTag: 'LinkedIn',
    body: `Hi {name}! Thanks for connecting — saw you're at {company} and had to reach out. What you're building there looks genuinely interesting.\n\nWould love to hear more about what you're working on. Open to a quick call sometime?`,
  },
  {
    title: 'Congrats!!',
    categoryTag: 'Personal',
    body: `{name}!! I just saw — congrats!! That's huge and you absolutely deserve it 🎉\n\nSeriously so happy for you. We need to celebrate — when are you free?`,
  },
  {
    title: 'Professional check-in',
    categoryTag: 'Professional',
    body: `Hi {name}, I know it's been a little while but I've been keeping an eye on what {company} has been up to and had to reach out.\n\nWould love to hear what's keeping you busy these days. Grab a quick call?`,
  },
  {
    title: 'Intro ask — warm referral',
    categoryTag: 'Professional',
    body: `Hey {name}! Hope you're doing well. I have a slightly random ask — I've been trying to get in touch with someone at [company] and you immediately came to mind.\n\nAny chance you know anyone there who'd be open to a quick chat? Totally fine if not! Either way, we're overdue for a catch-up.`,
  },
  {
    title: 'Just saying hi',
    categoryTag: 'General',
    body: `Hey {name}! Was just thinking about you out of nowhere and figured I'd actually say hi instead of just thinking it 😄\n\nHow are you? What's been going on? Would love to hear what you've been up to.`,
  },
  {
    title: 'Post-meeting follow-up',
    categoryTag: 'Professional',
    body: `Hey {name}, great talking just now! Really enjoyed the conversation.\n\nI'll take care of [action item] by [date] — ping me if anything else comes up on your end in the meantime. Excited to keep things moving!`,
  },
  {
    title: 'Checking in after a while',
    categoryTag: 'Reconnect',
    body: `Hey {name}, it's been way too long and I've been meaning to reach out for a while now.\n\nHow are things? Life treating you well? Would genuinely love to catch up when you get a chance — even just a quick call.`,
  },
  {
    title: 'Cold outreach — genuine ask',
    categoryTag: 'Cold Outreach',
    body: `Hi {name},\n\nI know we haven't met but I came across your work at {company} and genuinely loved [specific thing].\n\nI'm [brief context about yourself] and I think there could be something interesting to explore here. Would you be open to a 15-minute call? No pitch, just a proper conversation.`,
  },
]

async function ensureDefaultTemplates(userId) {
  const existing = await db
    .select({ title: templates.title, id: templates.id })
    .from(templates)
    .where(and(eq(templates.userId, userId), isNull(templates.deletedAt)))

  const existingByTitle = Object.fromEntries(
    existing.map(t => [t.title.toLowerCase(), t.id])
  )

  // Insert any missing defaults
  const missing = DEFAULT_TEMPLATES.filter(
    t => !existingByTitle[t.title.toLowerCase()]
  )
  if (missing.length > 0) {
    await db.insert(templates).values(missing.map(t => ({ ...t, userId })))
  }

  // Refresh bodies on existing defaults so all users get the updated wording
  for (const tmpl of DEFAULT_TEMPLATES) {
    const existingId = existingByTitle[tmpl.title.toLowerCase()]
    if (existingId) {
      await db.update(templates)
        .set({ body: tmpl.body, categoryTag: tmpl.categoryTag })
        .where(eq(templates.id, existingId))
    }
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
