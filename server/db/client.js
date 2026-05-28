import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema.js'

const { Pool } = pg

const isSupabase = (process.env.DATABASE_URL || '').includes('supabase.co')

// Support individual param overrides so special chars in passwords (@, !)
// don't get mangled by URL-encoding in hosting dashboards like Render.
const poolConfig = process.env.DB_HOST ? {
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'postgres',
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  family: 4,
} : {
  connectionString: process.env.DATABASE_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  family: 4,
}

const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err)
})

export const db = drizzle(pool, { schema })
export { pool }
