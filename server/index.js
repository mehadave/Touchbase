import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from './db/client.js'
import { applyMigrations } from './db/migrate.js'
import { seedIfEmpty } from './db/seed.js'
import { authenticate } from './middleware/authenticate.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

import contactsRouter    from './routes/contacts.js'
import conferencesRouter from './routes/conferences.js'
import templatesRouter   from './routes/templates.js'
import touchbaseRouter   from './routes/touchbase.js'
import settingsRouter    from './routes/settings.js'
import notesRouter       from './routes/notes.js'
import pushRouter, { sendDailyReminders } from './routes/push.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT      = process.env.PORT || 3001
const UPLOADS   = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads')
const PUBLIC    = path.join(__dirname, 'public')

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true })

const app = express()

app.use(cors({ origin: process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(UPLOADS))

// Health check (Railway + uptime monitors)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Protected routes — require valid Supabase JWT
app.use('/api/contacts',    authenticate, contactsRouter)
app.use('/api/conferences', authenticate, conferencesRouter)
app.use('/api/templates',   authenticate, templatesRouter)
app.use('/api/touchbase',   authenticate, touchbaseRouter)
app.use('/api/settings',    authenticate, settingsRouter)
app.use('/api/notes',       authenticate, notesRouter)
app.use('/api/push',        authenticate, pushRouter)

// Serve built client in production
if (fs.existsSync(PUBLIC)) {
  app.use(express.static(PUBLIC))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(PUBLIC, 'index.html'))
    }
  })
}

app.use(notFound)
app.use(errorHandler)

function scheduleDailyReminder() {
  const now = new Date()
  const next9am = new Date(now)
  next9am.setHours(9, 0, 0, 0)
  if (next9am <= now) next9am.setDate(next9am.getDate() + 1)
  const msUntil = next9am - now
  setTimeout(() => {
    sendDailyReminders()
    setInterval(sendDailyReminders, 24 * 60 * 60 * 1000)
  }, msUntil)
  console.log(`✓ Daily reminders scheduled (next: ${next9am.toLocaleTimeString()})`)
}

async function start() {
  try {
    // Test DB connection
    await pool.query('SELECT 1')
    console.log('✓ Connected to PostgreSQL')

    // Push Drizzle schema (creates tables if not exist)
    await migrate(db, { migrationsFolder: path.join(__dirname, 'drizzle') })
      .catch(() => {
        // Migrations folder may not exist on first run — that's fine,
        // we use drizzle-kit push externally. Tables are created by applyMigrations.
      })

    // Apply raw SQL enhancements (triggers, FTS, constraints)
    await applyMigrations()

    // Seed sample data on first run
    await seedIfEmpty()

    app.listen(PORT, () => {
      console.log(`✓ Touchbase API running at http://localhost:${PORT}`)
      scheduleDailyReminder()
    })
  } catch (err) {
    console.error('Failed to start server:', err.message)
    console.error('Make sure DATABASE_URL is set and PostgreSQL is reachable')
    process.exit(1)
  }
}

start()
