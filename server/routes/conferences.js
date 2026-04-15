import { Router } from 'express'
import { db } from '../db/client.js'
import { conferences, contacts } from '../db/schema.js'
import { eq, and, isNull, asc } from 'drizzle-orm'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const results = await db
      .select()
      .from(conferences)
      .where(and(eq(conferences.userId, req.userId), isNull(conferences.deletedAt)))
      .orderBy(asc(conferences.date))
    res.json(results)
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const [conf] = await db
      .select()
      .from(conferences)
      .where(and(eq(conferences.id, req.params.id), eq(conferences.userId, req.userId), isNull(conferences.deletedAt)))
    if (!conf) return res.status(404).json({ error: 'Conference not found' })

    const linkedContacts = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.conferenceId, req.params.id), eq(contacts.userId, req.userId), isNull(contacts.deletedAt)))
      .orderBy(asc(contacts.fullName))

    res.json({ ...conf, contacts: linkedContacts })
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, date, location, websiteUrl, notes } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Conference name is required' })
    const [conf] = await db.insert(conferences).values({
      userId:     req.userId,
      name:       name.trim(),
      date:       date || null,
      location:   location?.trim() || null,
      websiteUrl: websiteUrl?.trim() || null,
      notes:      notes?.trim() || null,
    }).returning()
    res.status(201).json(conf)
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const [existing] = await db
      .select()
      .from(conferences)
      .where(and(eq(conferences.id, req.params.id), eq(conferences.userId, req.userId), isNull(conferences.deletedAt)))
    if (!existing) return res.status(404).json({ error: 'Conference not found' })

    const { name, date, location, websiteUrl, notes } = req.body
    const [updated] = await db
      .update(conferences)
      .set({
        name:       name?.trim()       ?? existing.name,
        date:       date               ?? existing.date,
        location:   location?.trim()   ?? existing.location,
        websiteUrl: websiteUrl?.trim() ?? existing.websiteUrl,
        notes:      notes?.trim()      ?? existing.notes,
      })
      .where(and(eq(conferences.id, req.params.id), eq(conferences.userId, req.userId)))
      .returning()
    res.json(updated)
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const [existing] = await db
      .select()
      .from(conferences)
      .where(and(eq(conferences.id, req.params.id), eq(conferences.userId, req.userId), isNull(conferences.deletedAt)))
    if (!existing) return res.status(404).json({ error: 'Conference not found' })

    await db.update(conferences)
      .set({ deletedAt: new Date() })
      .where(and(eq(conferences.id, req.params.id), eq(conferences.userId, req.userId)))
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
