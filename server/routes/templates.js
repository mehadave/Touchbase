import { Router } from 'express'
import { db } from '../db/client.js'
import { templates } from '../db/schema.js'
import { eq, and, isNull, desc, asc } from 'drizzle-orm'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
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
