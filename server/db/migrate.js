import { pool } from './client.js'

/**
 * Apply PostgreSQL-native enhancements that Drizzle schema can't express:
 * - updated_at trigger function + triggers on all mutable tables
 * - tsvector column + GIN index + trigger for full-text search
 * - CHECK constraints for relationship_strength and follow_up_frequency
 * - Partial unique index for touchbase_queue
 */
export async function applyMigrations() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // ① updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$;
    `)

    // ② Attach updated_at trigger to every mutable table
    const updatedAtTables = ['conferences', 'contacts', 'templates', 'touchbase_queue', 'app_settings']
    for (const table of updatedAtTables) {
      await client.query(`
        DROP TRIGGER IF EXISTS trg_${table}_updated_at ON ${table};
        CREATE TRIGGER trg_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `)
    }

    // ③ tsvector column for full-text search (idempotent)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'contacts' AND column_name = 'search_vector'
        ) THEN
          ALTER TABLE contacts ADD COLUMN search_vector tsvector;
        END IF;
      END $$;
    `)

    // ④ GIN index on search_vector
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_fts ON contacts USING GIN(search_vector);
    `)

    // ⑤ Function to rebuild search_vector
    await client.query(`
      CREATE OR REPLACE FUNCTION contacts_search_vector_update()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.full_name, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.company, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.job_title, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.notes, '')), 'C');
        RETURN NEW;
      END;
      $$;
    `)

    // ⑥ Trigger to auto-update search_vector on insert/update
    await client.query(`
      DROP TRIGGER IF EXISTS trg_contacts_search_vector ON contacts;
      CREATE TRIGGER trg_contacts_search_vector
        BEFORE INSERT OR UPDATE OF full_name, company, job_title, notes ON contacts
        FOR EACH ROW EXECUTE FUNCTION contacts_search_vector_update();
    `)

    // ⑦ CHECK constraints (idempotent)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_strength'
        ) THEN
          ALTER TABLE contacts ADD CONSTRAINT chk_strength
            CHECK (relationship_strength BETWEEN 1 AND 5);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_frequency'
        ) THEN
          ALTER TABLE contacts ADD CONSTRAINT chk_frequency
            CHECK (follow_up_frequency > 0);
        END IF;
      END $$;
    `)

    // ⑧ Partial unique index: one pending entry per contact per day
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_unique_pending
        ON touchbase_queue(contact_id, scheduled_date)
        WHERE status = 'pending';
    `)

    // ⑨ Backfill search_vector for any existing rows
    await client.query(`
      UPDATE contacts SET search_vector =
        setweight(to_tsvector('english', coalesce(full_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(company, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(job_title, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(notes, '')), 'C')
      WHERE search_vector IS NULL;
    `)

    await client.query('COMMIT')
    console.log('✓ Database migrations applied')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
