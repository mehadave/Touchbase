# Touchbase — Personal Networking CRM

> Personal CRM for people who care about relationships but keep forgetting to reach out. Daily touchbase reminders, streak tracking, smart message templates, LinkedIn OCR auto-fill, and a priority algorithm to surface who needs your attention most. Built with React 18, Express, PostgreSQL (Drizzle ORM), Supabase Auth, and deployed as a PWA on Vercel + Railway.

**Live → [touchbase-three.vercel.app](https://touchbase-three.vercel.app)**

---

## Features

- **Daily Touchbase** — A priority algorithm scores every contact by how overdue they are and relationship strength, then picks the one you should reach out to today
- **Streak System** — Consecutive-day tracking with milestone celebrations (7 / 14 / 30 / 60 / 90 days) and confetti
- **Smart Templates** — 10 human-sounding message templates with `{name}`, `{company}`, `{title}` placeholders, auto-matched to each contact's category and your relationship strength
- **LinkedIn OCR** — Upload a screenshot of any LinkedIn profile; Tesseract.js reads it client-side and auto-fills the contact form
- **Notes** — Freeform notes linked to contacts, auto-created from the contact form under "Contact Notes"
- **Follow-up Calendar** — Monthly calendar view with colour-coded dots showing who's due, overdue, or on track
- **360° Contact Profiles** — Photo upload, relationship stars (1–5), tags, notes, LinkedIn URL, follow-up frequency
- **Conference Tracking** — Log conferences, link contacts met there, see conference badges on cards
- **CSV Import** — Bulk import with column auto-mapping, preview, and duplicate handling (skip / update / import all)
- **Global Search** — `Cmd+K` searches contacts using PostgreSQL full-text search (tsvector + GIN index)
- **Dark Mode** — Persisted to localStorage, respects `prefers-color-scheme` on first load, no flash
- **PWA** — Installable on iPhone and Android home screen, works offline via Workbox service worker
- **Push Notifications** — Optional daily streak reminders via Web Push / VAPID

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Zustand |
| Backend | Node.js, Express, Drizzle ORM |
| Database | PostgreSQL 16 (Supabase managed) |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| OCR | Tesseract.js (lazy-loaded WASM, client-side) |
| CSV | PapaParse |
| Dates | date-fns |
| Icons | Lucide React |
| Push | web-push (VAPID) |
| PWA | vite-plugin-pwa + Workbox |
| Hosting | Vercel (frontend) + Railway (backend) |

---

## Architecture

```
Browser (Vercel CDN)          Railway (Express API)         Supabase
┌─────────────────────┐       ┌─────────────────────┐       ┌──────────────┐
│  React 18 SPA       │─────► │  Express REST API   │─────► │  PostgreSQL  │
│  Zustand state      │ HTTPS │  Drizzle ORM        │  pg   │  Auth (JWT)  │
│  Workbox PWA        │  JWT  │  Multer uploads     │       └──────────────┘
└─────────────────────┘       └─────────────────────┘
```

Every API request carries a Supabase JWT. The server decodes it to get the user's UUID and scopes every DB query to that user.

---

## Running Locally

### 1. Clone

```bash
git clone https://github.com/mehadave/Touchbase.git
cd Touchbase
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL=postgresql://...        # Supabase connection string
PORT=3001
NODE_ENV=development
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:3001/api
```

### 3. Install & run

```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
npm run dev
```

Opens:
- **Frontend** → `http://localhost:5173`
- **API** → `http://localhost:3001`

---

## Project Structure

```
Touchbase/
├── client/                 Vite + React 18
│   └── src/
│       ├── api/            Fetch wrappers (auth token injected automatically)
│       ├── components/     UI primitives, contact cards, layout shell
│       ├── pages/          Dashboard, Contacts, Notes, Templates, Calendar, Streak
│       ├── store/          Zustand: auth, contacts, streak, settings, UI
│       └── hooks/          useDebounce, useKeyboardShortcut, usePWAInstall
│
└── server/
    ├── db/
    │   ├── schema.js       Drizzle schema — single source of truth
    │   ├── migrate.js      Raw SQL: triggers, FTS (tsvector + GIN), constraints
    │   └── seed.js         Sample data on first run
    ├── middleware/         authenticate (JWT), multer (photos), errorHandler
    └── routes/             contacts, notes, templates, touchbase, settings, push
```

---

## Key Technical Details

- **Full-text search** — PostgreSQL `tsvector` column maintained by a trigger, queried with `tsquery` prefix matching and ranked by `ts_rank`
- **Streak SQL** — Uses the consecutive-dates window function trick: `date - ROW_NUMBER() OVER (ORDER BY date)` groups consecutive days into a constant
- **Priority algorithm** — `LEAST(days_overdue / frequency, 3.0) + (strength × 0.2)` — overdue ratio capped at 3× to prevent monopolisation
- **Lazy OCR** — Tesseract.js (~10MB WASM) is dynamically imported only when the user clicks "Scan photo"
- **Soft deletes** — All tables have `deleted_at TIMESTAMPTZ`; nothing is ever hard-deleted
- **Auto token refresh** — On 401, the API client calls `supabase.auth.refreshSession()` and retries once

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open global search |
| `Escape` | Close modals / search |

---

## Deploying

| Service | Config |
|---------|--------|
| **Vercel** | `vercel.json` in root — builds `client/`, outputs to `server/public/` |
| **Railway** | `server/` runs `node index.js` — set `DATABASE_URL`, `SUPABASE_JWT_SECRET`, `VAPID_*` env vars |
| **Supabase** | Create a project, copy the connection string and anon key into env vars |
