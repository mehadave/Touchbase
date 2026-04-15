import jwt from 'jsonwebtoken'

// Supabase signs JWTs with the project's JWT secret (Settings → API → JWT Secret).
// Set SUPABASE_JWT_SECRET in your environment.
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = header.slice(7)

  if (!JWT_SECRET) {
    // Dev fallback: trust the sub claim without verification when secret not set
    try {
      const payload = jwt.decode(token)
      if (!payload?.sub) return res.status(401).json({ error: 'Invalid token' })
      req.userId = payload.sub
      return next()
    } catch {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.sub   // Supabase puts the user UUID in `sub`
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
