import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.co') ? { rejectUnauthorized: false } : false,
})

export async function addUniversityColumn() {
  const client = await pool.connect()
  try {
    await client.query(`
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS university TEXT;
    `)
    console.log('✓ university column added to contacts')
  } finally {
    client.release()
    await pool.end()
  }
}

// Run standalone: DATABASE_URL=... node migrations/add-university.js
if (process.argv[1].includes('add-university')) {
  addUniversityColumn().catch(console.error)
}
