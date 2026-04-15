import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'touchbase_jwt_secret_change_in_production'
const SALT_ROUNDS = 10

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase().trim()))
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const [user] = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      displayName: displayName?.trim() || null,
    }).returning({ id: users.id, email: users.email, displayName: users.displayName, createdAt: users.createdAt })

    const token = signToken(user)
    res.status(201).json({ token, user })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()))
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken(user)
    const { passwordHash: _, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, displayName: users.displayName, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, req.userId))
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
})

export default router
