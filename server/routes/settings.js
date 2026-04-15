import { Router } from 'express'
import { db } from '../db/client.js'
import { appSettings } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const rows = await db.select().from(appSettings).where(eq(appSettings.userId, req.userId))
    const settings = Object.fromEntries(rows.map(r => [r.key, JSON.parse(r.value)]))
    res.json(settings)
  } catch (err) { next(err) }
})

router.put('/', async (req, res, next) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await db.insert(appSettings)
        .values({ userId: req.userId, key, value: JSON.stringify(value) })
        .onConflictDoUpdate({
          target: [appSettings.userId, appSettings.key],
          set: { value: JSON.stringify(value), updatedAt: new Date() },
        })
    }
    const rows = await db.select().from(appSettings).where(eq(appSettings.userId, req.userId))
    const settings = Object.fromEntries(rows.map(r => [r.key, JSON.parse(r.value)]))
    res.json(settings)
  } catch (err) { next(err) }
})

export default router
