import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.co') ? { rejectUnauthorized: false } : false,
})

export async function addNotesTable() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL,
        title        TEXT NOT NULL DEFAULT '',
        body         TEXT NOT NULL DEFAULT '',
        category     TEXT NOT NULL DEFAULT 'General',
        contact_id   UUID REFERENCES contacts(id) ON DELETE SET NULL,
        photo_paths  JSONB NOT NULL DEFAULT '[]',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at   TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_notes_user    ON notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_notes_contact ON notes(contact_id);
      CREATE OR REPLACE TRIGGER trg_notes_updated_at
        BEFORE UPDATE ON notes
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `)
    console.log('✓ Notes table ready')
  } finally {
    client.release()
    await pool.end()
  }
}

// Run standalone: DATABASE_URL=... node migrations/add-notes.js
if (process.argv[1].includes('add-notes')) {
  addNotesTable().catch(console.error)
}
