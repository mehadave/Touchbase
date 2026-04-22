import { Router } from 'express'
import webpush from 'web-push'
import { pool } from '../db/client.js'

const router = Router()

// Configure VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:support@touchbase.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

// POST /api/push/subscribe
router.post('/subscribe', async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription' })
    }
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth_key)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = $1`,
      [req.userId, endpoint, keys.p256dh, keys.auth]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// DELETE /api/push/unsubscribe?endpoint=...
router.delete('/unsubscribe', async (req, res, next) => {
  try {
    const endpoint = req.query.endpoint || req.body?.endpoint
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' })
    await pool.query(
      `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
      [req.userId, endpoint]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// POST /api/push/send-daily (called by server internally or cron)
// Sends daily touchbase reminder to all users who enabled it
export async function sendDailyReminders() {
  if (!process.env.VAPID_PUBLIC_KEY) return
  try {
    const { rows: subs } = await pool.query(`
      SELECT ps.endpoint, ps.p256dh, ps.auth_key
      FROM push_subscriptions ps
      INNER JOIN app_settings s ON s.user_id = ps.user_id AND s.key = 'streak_reminder_enabled'
      WHERE s.value = 'true'
    `)
    const payload = JSON.stringify({
      title: 'Time for your Touchbase! 🔥',
      body: 'Keep your streak going — reach out to someone today.',
      icon: '/icon-192.png',
      url: '/',
    })
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload
        )
      } catch (e) {
        if (e.statusCode === 410) {
          await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [sub.endpoint])
        }
      }
    }
    console.log(`Sent reminders to ${subs.length} subscribers`)
  } catch (e) {
    console.error('Push reminder error:', e)
  }
}

export default router
