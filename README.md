# Cambliss Studio — Phase 1 MVP

A runnable scaffold for an independent-artist music platform (streaming, artist
profiles, albums, search, admin) inspired by the Rauversion feature audit.
Stack: **React (Vite) + Node/Express + PostgreSQL (Prisma)**.

This covers Phase 1 only: auth, artist profiles, upload/stream, albums, search,
audio player, admin dashboard. Marketplace, events, podcasts, messaging, etc. are
not built yet — see "Next phases" below.

## Project layout

```
cambliss-mvp/
  backend/     Express API, Prisma schema, file uploads
  frontend/    React app (Vite + Tailwind v4)
```

## Prerequisites

- Node.js 18+
- A PostgreSQL database (local install, Docker, or a hosted instance like
  Supabase / Railway / Neon)

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string,
# and set JWT_SECRET to a long random string

npx prisma migrate dev --name init   # creates tables
npm run seed                         # creates an admin + sample artist login
npm run dev                          # starts the API on http://localhost:4000
```

Seeded logins (from `npm run seed`):
- Admin: `admin@cambliss.studio` / `Admin1234!`
- Artist: `artist@cambliss.studio` / `Artist1234!`

> Note: `npx prisma generate` / `migrate` download a small binary from
> Prisma's servers on first run — this requires normal internet access (it
> was blocked in the sandbox this was built in, but will work on your
> machine).

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL should match your backend URL
npm run dev                # starts on http://localhost:5173
```

Open http://localhost:5173. Register as an Artist to upload tracks and
albums, or use the seeded artist/admin logins above.

## What's implemented

- **Auth** — email/password registration and login (JWT), role-based access
  (`ARTIST`, `LISTENER`, `ADMIN`)
- **Artist profiles** — bio, profile/cover image upload, social links,
  follower counts, discography
- **Music upload & streaming** — multipart audio upload, HTTP range-request
  streaming (seekable), play counts
- **Albums** — create albums with cover art, attach tracks, or upload
  standalone singles
- **Search** — combined search across artists, tracks, and albums
- **Audio player** — persistent bottom player, plays across page navigation
- **Admin dashboard** — platform stats, user list, role changes, suspend/
  reactivate accounts

## Design notes

The UI uses a "recording studio" visual system: warm ink-black background,
amber accent, condensed display type for headings (Oswald), monospace for
metadata like durations and counts (IBM Plex Mono), and a waveform motif used
for loading states and the play/pause control. Track lists are numbered like
a tape reel counter since track order is meaningful.

## Next phases (not built yet)

Based on the original feature audit, in rough priority order:

- **Phase 2 — Monetization:** Marketplace, cart/checkout, Stripe Connect
  payouts, merch with shipping, coupons/orders
- **Phase 3 — Community & growth:** Events + ticketing, live-stream
  integrations, private messaging, artist link pages, press kits, analytics
- **Phase 4 — Advanced platform:** Multi-label management, courses/LMS,
  magazine/editorial, AI-assisted tools, recommendations

Each of those is a substantial module in its own right (the reference app
spreads them across dozens of models and controllers) — happy to scaffold
any of them the same way once Phase 1 is running for you.

## Known limitations of this scaffold

- File storage is local disk (`backend/uploads/`) — swap for S3/R2 before
  deploying anywhere with ephemeral storage
- No audio waveform generation, transcoding, or duration extraction yet
  (`durationMs` is stored but never populated — wire up `ffprobe` or similar
  on upload)
- No email verification or password reset flow
- No automated tests yet
