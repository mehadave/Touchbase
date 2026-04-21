/**
 * One-time Supabase schema setup script.
 * Run: DATABASE_URL=<url> node db/setup-supabase.js
 * Safe to re-run (all statements are idempotent).
 */
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function setup() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    console.log('Creating enums...')
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE category AS ENUM ('Personal', 'Professional', 'Social');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE source AS ENUM ('conference', 'linkedin', 'manual', 'csv');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE TYPE queue_status AS ENUM ('pending', 'done', 'skipped');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)

    console.log('Creating tables...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS conferences (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL,
        name        TEXT NOT NULL,
        date        DATE,
        location    TEXT,
        website_url TEXT,
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id               UUID NOT NULL,
        full_name             TEXT NOT NULL,
        email                 TEXT,
        phone                 TEXT,
        company               TEXT,
        job_title             TEXT,
        category              category NOT NULL DEFAULT 'Personal',
        linkedin_url          TEXT,
        notes                 TEXT,
        relationship_strength INTEGER NOT NULL DEFAULT 3,
        last_contacted        TIMESTAMPTZ,
        follow_up_frequency   INTEGER NOT NULL DEFAULT 30,
        next_follow_up        DATE,
        source                source NOT NULL DEFAULT 'manual',
        photo_path            TEXT,
        conference_id         UUID REFERENCES conferences(id) ON DELETE SET NULL,
        search_vector         TSVECTOR,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at            TIMESTAMPTZ
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name       TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_tags (
        contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        tag_id     UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (contact_id, tag_id)
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID NOT NULL,
        title        TEXT NOT NULL,
        body         TEXT NOT NULL,
        category_tag TEXT,
        use_count    INTEGER NOT NULL DEFAULT 0,
        last_used_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at   TIMESTAMPTZ
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS streak_log (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        UUID NOT NULL,
        completed_date DATE NOT NULL,
        contact_id     UUID REFERENCES contacts(id) ON DELETE SET NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uniq_streak_user_date UNIQUE (user_id, completed_date)
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS touchbase_queue (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        UUID NOT NULL,
        contact_id     UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        scheduled_date DATE NOT NULL,
        status         queue_status NOT NULL DEFAULT 'pending',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        user_id    UUID NOT NULL,
        key        TEXT NOT NULL,
        value      TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, key)
      );
    `)

    console.log('Creating indexes...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conferences_user        ON conferences(user_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_user           ON contacts(user_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_category       ON contacts(category);
      CREATE INDEX IF NOT EXISTS idx_contacts_next_followup  ON contacts(next_follow_up);
      CREATE INDEX IF NOT EXISTS idx_contacts_conference     ON contacts(conference_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_strength       ON contacts(relationship_strength);
      CREATE INDEX IF NOT EXISTS idx_contact_tags_tag        ON contact_tags(tag_id);
      CREATE INDEX IF NOT EXISTS idx_templates_user          ON templates(user_id);
      CREATE INDEX IF NOT EXISTS idx_streak_log_date         ON streak_log(completed_date);
      CREATE INDEX IF NOT EXISTS idx_streak_log_user         ON streak_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_queue_date_status       ON touchbase_queue(scheduled_date, status);
      CREATE INDEX IF NOT EXISTS idx_queue_user              ON touchbase_queue(user_id);
    `)

    console.log('Creating triggers and functions...')
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$;
    `)

    for (const table of ['conferences', 'contacts', 'templates', 'touchbase_queue', 'app_settings']) {
      await client.query(`
        DROP TRIGGER IF EXISTS trg_${table}_updated_at ON ${table};
        CREATE TRIGGER trg_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      `)
    }

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
      DROP TRIGGER IF EXISTS trg_contacts_search_vector ON contacts;
      CREATE TRIGGER trg_contacts_search_vector
        BEFORE INSERT OR UPDATE OF full_name, company, job_title, notes ON contacts
        FOR EACH ROW EXECUTE FUNCTION contacts_search_vector_update();
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_fts ON contacts USING GIN(search_vector);
    `)

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_strength') THEN
          ALTER TABLE contacts ADD CONSTRAINT chk_strength
            CHECK (relationship_strength BETWEEN 1 AND 5);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_frequency') THEN
          ALTER TABLE contacts ADD CONSTRAINT chk_frequency
            CHECK (follow_up_frequency > 0);
        END IF;
      END $$;
    `)

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_unique_pending
        ON touchbase_queue(contact_id, scheduled_date)
        WHERE status = 'pending';
    `)

    await client.query('COMMIT')
    console.log('✅ Supabase schema setup complete!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Setup failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

setup()
