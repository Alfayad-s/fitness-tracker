# Fitness Tracker

Mobile-first PWA for logging workouts, tracking body measurements, and viewing progress analytics. Built with **Next.js**, **Supabase Auth**, **Drizzle ORM**, and **PostgreSQL**.

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (Auth + Postgres + Storage)
- Optional: [Groq](https://groq.com) API keys for the AI assistant

## Quick start

```bash
git clone <repo-url>
cd fitness-tracker
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment variables](#environment-variables)), then:

```bash
npm run db:migrate   # apply SQL migrations
npm run db:seed      # default exercise library
npm run dev          # http://localhost:3000
```

Sign in at `/login` (email OTP, Google, or Apple). You land on `/dashboard`.

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (Auth + Storage) |
| `DATABASE_URL` | Yes | Postgres connection string — use **transaction pooler** port `6543` ([details](docs/supabase-drizzle-database.md)) |
| `NEXT_PUBLIC_SITE_URL` | Yes | App origin for OAuth redirects (`http://localhost:3000` locally) |
| `GROQ_API_KEYS` | No | Comma-separated keys for AI chat |
| `SUPABASE_SERVICE_ROLE_KEY` | E2E only | Playwright smoke tests (Admin API) |

See also [docs/supabase-auth-setup.md](docs/supabase-auth-setup.md) and [docs/supabase-storage-setup.md](docs/supabase-storage-setup.md).

## Database commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate migration SQL from schema changes |
| `npm run db:migrate` | Apply migrations in `drizzle/` |
| `npm run db:push` | Push schema directly (dev only) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed default exercises |

Connection pooling and RLS notes: [docs/supabase-drizzle-database.md](docs/supabase-drizzle-database.md).

## Local development

```bash
npm run dev              # port 3000 (or PORT=3001 npm run dev)
npm run dev:free-port    # kill process on default port, then dev
npm run lint             # ESLint
npm test                 # Vitest unit tests
npm run test:integration # DB integration tests (needs DATABASE_URL)
npm run test:e2e         # Playwright smoke tests (port 3100, needs service role key)
```

### Phone / OAuth testing

Expose localhost with a tunnel:

```bash
npm run dev:tunnel
```

Set `NEXT_PUBLIC_SITE_URL` to the tunnel URL and add it to Supabase redirect URLs. See [docs/cloudflare-tunnel.md](docs/cloudflare-tunnel.md).

### PWA install

Icons and manifest are built in. Install testing guide: [docs/pwa-install-testing.md](docs/pwa-install-testing.md).

## Testing

- **Unit** — Vitest (`lib/workout/session-reducer.test.ts`, analytics utils, etc.)
- **Integration** — `tests/integration/` (requires `DATABASE_URL`)
- **E2E** — Playwright on port **3100** so it does not conflict with other apps on `:3000`

```bash
npx playwright install chromium   # first run only
npm run test:e2e
```

CI setup and secrets: [docs/ci-setup.md](docs/ci-setup.md).

## Documentation

| Doc | Topic |
|-----|-------|
| [workout-logging-flow.md](docs/workout-logging-flow.md) | Manual tester guide for logging workouts |
| [manual-qa-mobile.md](docs/manual-qa-mobile.md) | Mobile QA checklist |
| [accessibility.md](docs/accessibility.md) | Semantic HTML, ARIA, chart contrast |
| [pwa-install-testing.md](docs/pwa-install-testing.md) | Install prompt on iOS / Android |

## Deploy

### Vercel (recommended)

1. Import the repo in [Vercel](https://vercel.com).
2. Set the same env vars as `.env.local` (Production + Preview).
3. Use the **transaction pooler** `DATABASE_URL` for serverless.
4. Preview deployments run automatically on pull requests when the repo is connected.

See [docs/ci-setup.md](docs/ci-setup.md) for GitHub Actions secrets.

## Project structure

```
app/(app)/     Authenticated routes (dashboard, workouts, progress, …)
app/(auth)/    Login and auth callback
components/    UI and feature components
lib/           Analytics, auth, db, workout logic
services/      Server actions
drizzle/       SQL migrations
tests/e2e/     Playwright smoke tests
```

## License

Private — personal project.
