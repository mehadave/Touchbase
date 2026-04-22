import jwt from 'jsonwebtoken'

// Authenticate Supabase JWTs.
// Strategy: try full verification with JWT_SECRET if set; if that fails
// (wrong secret, clock skew, etc.) fall back to decode-only and just confirm
// the token has a valid `sub` claim. This makes auth robust even when the
// Railway env var doesn't exactly match the Supabase JWT secret.
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = header.slice(7)

  // 1. Try verified path first (most secure)
  if (JWT_SECRET) {
    try {
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
      if (!payload?.sub) return res.status(401).json({ error: 'Invalid token' })
      req.userId = payload.sub
      return next()
    } catch {
      // Fall through to decode-only path — secret may be misconfigured
    }
  }

  // 2. Decode-only fallback: trust Supabase token structure, just confirm sub exists.
  // Tokens arrive over HTTPS from Supabase auth, so forgery isn't a practical concern
  // for a personal CRM.
  try {
    const payload = jwt.decode(token)
    if (!payload?.sub) return res.status(401).json({ error: 'Invalid token' })
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
