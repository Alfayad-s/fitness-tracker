# Supabase Postgres + Drizzle

This app uses **Supabase Auth** for sign-in and **Drizzle ORM** over Supabase’s **Postgres** database. Auth sessions use the Supabase JS client; app data (workouts, measurements, profile) uses `DATABASE_URL` and `lib/db/index.ts`.

## Two connections, two roles

| Variable | Used for |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth, Storage, RLS-aware client APIs |
| `DATABASE_URL` | Drizzle / `postgres.js` — server-side queries & migrations |

Do not confuse the anon key with database access. Server code loads `DATABASE_URL` only on the server (`.env.local`, never exposed to the browser).

## `DATABASE_URL`: pooler vs direct

Supabase offers multiple connection strings under **Project Settings → Database**.

| Mode | Host / port | Use when |
|------|-------------|----------|
| **Transaction pooler** (recommended) | `*.pooler.supabase.com:6543` | Next.js dev & production, serverless, many short-lived requests |
| **Session pooler** | `*.pooler.supabase.com:5432` | Long-lived sessions, some tools (not our default) |
| **Direct** | `db.*.supabase.co:5432` | One-off admin tasks, `drizzle-kit` migrations if pooler fails |

### Why we use the transaction pooler (6543)

- Next.js dev (HMR) and server actions open many connections; **direct `:5432` exhausts** Supabase’s connection limit quickly.
- Transaction mode works with `postgres.js` when **`prepare: false`** (already set in `lib/db/index.ts`).
- Pool size is capped via `DATABASE_POOL_MAX` (default **3** in dev, **1** in production).

### `.env.local` example

```env
# Transaction pooler — note port 6543 and pooler host
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Optional: tune pool (see lib/db/index.ts)
# DATABASE_POOL_MAX=3
```

Copy the **URI** from the dashboard and replace `[YOUR-PASSWORD]`. If the password contains special characters, URL-encode them.

### Serverless / Vercel

- Prefer **transaction pooler** + low `DATABASE_POOL_MAX` (1–2).
- Avoid holding connections across requests; this app creates a shared pool in dev and a small pool in production.
- For edge runtimes, Postgres drivers are limited; this project runs Drizzle on the **Node.js server** only (Server Components, server actions, route handlers).

### Migrations (`drizzle-kit`)

```bash
npm run db:migrate   # apply SQL in drizzle/
npm run db:generate  # generate from schema changes
npm run db:push      # push schema (dev only; prefer migrate in prod)
```

`drizzle.config.ts` reads `DATABASE_URL` from `.env.local`. If migrate fails through the pooler, temporarily use the **direct** connection string, run migrate, then switch back to the pooler for the app.

### Dev warning

If `DATABASE_URL` uses direct `db.*.supabase.co:5432`, the app logs a console warning suggesting the transaction pooler.

## App `users` vs `auth.users`

| Table | Schema | Purpose |
|-------|--------|---------|
| `auth.users` | Supabase Auth | Canonical identity (managed by Supabase) |
| `public.users` | Drizzle `lib/db/schema.ts` | App profile (email, username, goals, avatar) |

On sign-in, `lib/auth/sync-user.ts` **upserts** `public.users` with `id = auth.users.id` (same UUID). That keeps foreign keys (`workouts.user_id`, etc.) aligned without querying `auth.users` from Drizzle.

Drizzle does **not** model `auth.users`; only `public.users` and app tables.

## Optional: FK `public.users` → `auth.users`

Enforcing the link at the database level prevents orphan profile rows and cascades deletes when an auth user is removed.

**Before running:**

1. Every `public.users.id` must exist in `auth.users` (no legacy random UUIDs).
2. Back up the database.
3. Run in the [Supabase SQL Editor](https://supabase.com/dashboard) (not required for the app to work).

See **[docs/sql/users-auth-fk.sql](./sql/users-auth-fk.sql)**.

After applying the FK, new inserts must use the auth user’s UUID (already how `syncUserFromAuth` works). Consider removing `defaultRandom()` on `users.id` in a future schema migration if you enforce this everywhere.

## Related docs

- [supabase-auth-setup.md](./supabase-auth-setup.md) — Auth providers & redirects
- [supabase-storage-setup.md](./supabase-storage-setup.md) — Avatar bucket
- `.env.example` — template env vars
