# CI / CD setup

## GitHub Actions

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

On every push and pull request to `main`:

1. **Lint** — `npm run lint`
2. **Typecheck** — `npx tsc --noEmit`
3. **Unit tests** — `npm test` (Vitest, no secrets required)
4. **Build** — `npm run build` (requires Supabase env vars at build time)

### Required repository secrets

Add these under **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Used for |
|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Build + optional E2E |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build + optional E2E |
| `DATABASE_URL` | Build (use pooler URI; not needed for unit tests) |

For **Playwright E2E in CI** (optional), also add:

| Secret | Used for |
|--------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Create test users in smoke tests |

E2E runs on port `3100` and is skipped in CI by default until you add a dedicated job and the service role secret.

### Local parity

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run test:e2e   # needs .env.local + SUPABASE_SERVICE_ROLE_KEY
```

## Vercel preview deployments (optional)

1. Connect the GitHub repo in the [Vercel dashboard](https://vercel.com).
2. Framework preset: **Next.js**.
3. Build command: `npm run build` (uses `--webpack` for PWA).
4. Add **Production** and **Preview** environment variables matching `.env.local`.
5. Set `NEXT_PUBLIC_SITE_URL` per environment (production domain vs preview URL).

Preview URLs are useful for manual QA before merge. Supabase **Redirect URLs** must include:

```
https://your-preview-*.vercel.app/**
https://your-production-domain.com/**
```

## Production checklist

- [ ] Run `npm run db:migrate` against production Postgres (direct or pooler)
- [ ] Apply [storage RLS](sql/storage-rls.sql) in Supabase SQL Editor
- [ ] Configure Auth providers and Site URL in Supabase
- [ ] Set `DATABASE_POOL_MAX=1` or `2` on Vercel serverless
