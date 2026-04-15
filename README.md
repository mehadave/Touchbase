# Touchbase — Personal Networking CRM

A warm, snappy personal CRM that helps you stay meaningfully connected with the people who matter. Runs 100% locally and offline — no cloud, no subscriptions, no API keys.

---

## Features

- **Daily Touchbase** — A smart daily contact suggestion with a template-matched message, Done/Skip actions, and streak tracking
- **360° Contact Profiles** — Photo upload, relationship stars (1–5), tags, notes, LinkedIn URL, follow-up frequency
- **LinkedIn OCR** — Upload a screenshot of any LinkedIn profile; Tesseract.js extracts the URL client-side with zero server calls
- **Follow-up Calendar** — Monthly calendar view with colour-coded dots showing who's due, overdue, or on track
- **Streak System** — Consecutive-day tracking with milestone celebrations (7 / 14 / 30 / 60 / 90 days) and confetti
- **Message Templates** — Reusable templates with `{name}`, `{company}`, `{title}` placeholders, auto-matched to each day's contact
- **Conference Tracking** — Log conferences, link contacts met there, see conference badges on cards
- **CSV Import** — Bulk import with column auto-mapping, preview, and duplicate handling (skip / update / import all)
- **Global Search** — `Cmd+K` searches across contacts, templates, and conferences simultaneously using PostgreSQL FTS5
- **Network View** — Browse by Personal / Professional / Social, with dedicated LinkedIn and Conferences sections
- **Dark Mode** — Persisted to localStorage, respects `prefers-color-scheme` on first load
- **PWA / Mobile App** — Install to your iPhone or Android home screen for a native-app feel

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18 + | Required for `--watch` flag |
| npm | 9 + | Bundled with Node |
| Docker | Any | For the local PostgreSQL instance |
| Docker Compose | v2 + | `docker compose` (no hyphen) |

---

## Setup

### 1. Clone / download the project

```bash
cd ~/Desktop/myapps/Touchbase
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

This spins up a PostgreSQL 16 container on port `5432` with:
- Database: `touchbase`
- User: `touchbase`
- Password: `touchbase_dev`

Data is persisted in a Docker volume (`postgres_data`) — it survives container restarts.

### 3. Install dependencies

```bash
npm install          # root (installs concurrently)
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 4. Start the dev server

```bash
npm run dev
```

This concurrently starts:
- **API server** → `http://localhost:3001` (Express + Drizzle + PostgreSQL)
- **UI dev server** → `http://localhost:5173` (Vite + React)

On first run the server automatically:
1. Creates all tables and PostgreSQL triggers/indexes
2. Seeds 5 example contacts, 4 message templates, and 1 conference

Open **http://localhost:5173** — you'll see the Dashboard with a pre-populated contact ready for today's touchbase.

---

## Project Structure

```
Touchbase/
├── docker-compose.yml      PostgreSQL 16 container
├── .env                    DATABASE_URL and PORT (gitignored)
├── .env.example            Template for .env
│
├── client/                 Vite + React 18
│   ├── src/
│   │   ├── pages/          Dashboard, Contacts, Network, Calendar, Templates, Streak
│   │   ├── components/     UI primitives, contact cards, conference panels, etc.
│   │   ├── store/          Zustand state (contacts, streak, settings, UI)
│   │   ├── api/            Thin fetch wrappers for each backend endpoint
│   │   └── hooks/          useKeyboardShortcut, usePWAInstall, useDebounce
│   └── public/
│       ├── manifest.json   PWA manifest
│       ├── sw.js           Service worker (cache-first shell, network-first API)
│       └── favicon.svg     Amber-gradient logo icon
│
└── server/                 Express.js API
    ├── db/
    │   ├── schema.js       Drizzle ORM schema (single source of truth)
    │   ├── client.js       pg pool + Drizzle instance
    │   ├── migrate.js      PostgreSQL triggers, FTS, CHECK constraints
    │   └── seed.js         First-run sample data
    ├── routes/             contacts, conferences, templates, touchbase, settings
    ├── middleware/         multer photo upload, error handler
    └── uploads/            Contact photos (gitignored)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, React Router v6, Zustand |
| Backend | Express.js, Drizzle ORM |
| Database | PostgreSQL 16 (Docker) |
| OCR | Tesseract.js (100% client-side) |
| Icons | Lucide React |
| Dates | date-fns |
| CSV parsing | PapaParse |
| Confetti | canvas-confetti |
| Build | Vite 6 |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in watch mode |
| `npm run dev:client` | Start Vite dev server only |
| `npm run dev:server` | Start Express server only (with `--watch`) |
| `npm run build` | Build the client into `server/public/` |
| `npm start` | Serve the built app on port 3001 (production) |
| `npm run db:push` | Push Drizzle schema changes to the database |
| `npm run db:studio` | Open Drizzle Studio (visual DB explorer) |

---

## Installing as a Mobile App (PWA)

### Android / Chrome
1. Open `http://localhost:5173` in Chrome
2. Tap the **⋮ menu → "Add to Home Screen"**
3. Or click the **Install** banner that appears at the bottom of the page

### iPhone / Safari
1. Open `http://localhost:5173` in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Name it "Touchbase" and tap **Add**

The app will open in standalone mode (no browser chrome) with full offline support for the UI shell.

> **Note:** For PWA installation to work on your phone, the server must be accessible from the device. You can expose it on your local network by changing `server: { host: true }` in `client/vite.config.js`.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open global search |
| `Escape` | Close modals / drawers / search |

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```env
DATABASE_URL=postgresql://touchbase:touchbase_dev@localhost:5432/touchbase
PORT=3001
NODE_ENV=development
UPLOADS_DIR=./uploads
```

---

## Backup

Your data lives in a Docker volume. To back it up:

```bash
# Dump the database
docker exec touchbase-db-1 pg_dump -U touchbase touchbase > backup.sql

# Restore
cat backup.sql | docker exec -i touchbase-db-1 psql -U touchbase touchbase
```

Contact photos are stored in `server/uploads/` — back up that folder too.
