# Supabase Auth configuration

Complete these steps in the [Supabase Dashboard](https://supabase.com/dashboard) for your project.

## 1. Enable Email OTP

1. Go to **Authentication** → **Providers** → **Email**.
2. Enable **Email** sign-in.
3. Enable **Email OTP** (6-digit code — matches the login page OTP step).
4. Optional: disable **Magic Link** if you only want codes in email (recommended for this app).
5. For development, you may disable **Confirm email** to skip verification (re-enable for production).
6. Save changes.
7. Customize the email template so **`{{ .Token }}`** shows the code — see **[supabase-email-otp-template.md](./supabase-email-otp-template.md)**.

## 2. Enable Google & Apple OAuth

Step-by-step (Google Cloud + Apple Developer): **[oauth-google-apple.md](./oauth-google-apple.md)**

Quick checklist:

1. Supabase → **Authentication** → **Providers** → enable **Google** and **Apple**.
2. Google redirect URI must be `https://<project-ref>.supabase.co/auth/v1/callback` (not your Next.js URL).
3. Apple Services ID return URL: same Supabase callback URL.
4. Add your app URLs under **URL Configuration** → **Redirect URLs** (`/auth/callback`).

## 4. Site URL & redirect URLs

1. Go to **Authentication** → **URL Configuration**.

2. Set **Site URL** to your app origin:
   - Local: `http://localhost:3000`
   - Production: `https://your-domain.com`

3. Add **Redirect URLs**:

   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   https://your-domain.com/auth/callback
   https://your-domain.com/**
   ```

4. Save changes.

## 5. Environment variables

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

Use the **Transaction pooler** URI (port `6543`) from Supabase → **Database** → **Connection string**. The direct `:5432` URL has a low connection limit; Next.js dev can hit `remaining connection slots are reserved` (Postgres `53300`) without the pooler.

`NEXT_PUBLIC_SITE_URL` must match **Site URL** in Supabase (used for OAuth and magic-link redirects).

## 6. Test on a phone (Cloudflare Tunnel)

To use Google / Apple / email links on a physical device, expose localhost with a tunnel:

```bash
npm run dev:tunnel
```

Copy the `https://….trycloudflare.com` URL, set `NEXT_PUBLIC_SITE_URL` in `.env.local`, add the tunnel URL to **Redirect URLs**, and restart dev. See [cloudflare-tunnel.md](./cloudflare-tunnel.md).

## 7. Verify the flow

1. Run `npm run dev`.
2. Open `/login`.
3. **Email:** enter address → “Continue with Email” → enter 6-digit code from inbox → `/dashboard`.
4. **Google / Apple:** click provider → complete OAuth → redirect to `/dashboard`.
5. While signed out, `/dashboard` redirects to `/login?next=/dashboard`.

## Login page (app)

- Email OTP sign-in (no signup page).
- Google and Apple OAuth buttons.
- `/signup`, `/forgot-password`, `/reset-password` redirect to `/login`.

## Route protection

| Type | Paths |
|------|--------|
| Public | `/login`, `/auth/callback` |
| Protected | `/dashboard`, `/workouts`, `/progress`, `/profile`, and all other routes |

Configured in `lib/auth/routes.ts` and `lib/supabase/middleware.ts`.

## Database (Drizzle)

Postgres connection strings (transaction pooler vs direct), migrations, and optional `users` → `auth.users` FK: **[supabase-drizzle-database.md](./supabase-drizzle-database.md)**.
