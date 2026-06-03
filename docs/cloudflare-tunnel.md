# Cloudflare Tunnel — test on phone & external devices

Expose your local Next.js dev server to the internet with a temporary HTTPS URL (no port forwarding).

## 1. Install cloudflared

**macOS (Homebrew):**

```bash
brew install cloudflared
```

**Other platforms:** [Cloudflare installation docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)

Verify:

```bash
cloudflared --version
```

## 2. Run dev + tunnel together

**Free port 3000** if a previous dev server is still running:

```bash
npm run dev:free-port
```

From the project root:

```bash
npm run dev:tunnel
```

Use a different port if needed:

```bash
PORT=3001 npm run dev:tunnel
```

This starts:

- **next** — `http://localhost:3000`
- **tunnel** — public `https://….trycloudflare.com` URL

Or run in two terminals:

```bash
npm run dev      # terminal 1
npm run tunnel   # terminal 2
```

## 3. Copy the public URL

In the **tunnel** terminal, look for a line like:

```text
https://random-words-here.trycloudflare.com
```

Open that URL on your phone (same Wi‑Fi not required).

> **Note:** Quick tunnel URLs change every time you restart `cloudflared`. Update Supabase and `.env.local` when the URL changes.

## 4. Update environment variables

In `.env.local`, set:

```env
NEXT_PUBLIC_SITE_URL=https://random-words-here.trycloudflare.com
```

Restart the dev server so OAuth / magic-link redirects use the tunnel URL.

Optional: keep a separate file and copy when testing:

```bash
cp .env.tunnel.example .env.local
# then edit NEXT_PUBLIC_SITE_URL
```

## 5. Configure Supabase Auth

In **Supabase Dashboard** → **Authentication** → **URL Configuration**:

| Field | Value |
|--------|--------|
| **Site URL** | `https://YOUR-SUBDOMAIN.trycloudflare.com` |
| **Redirect URLs** | `https://YOUR-SUBDOMAIN.trycloudflare.com/auth/callback` |
| | `https://YOUR-SUBDOMAIN.trycloudflare.com/**` |

Also enable providers per [supabase-auth-setup.md](./supabase-auth-setup.md).

## 6. Test auth on your device

1. Open `https://YOUR-SUBDOMAIN.trycloudflare.com/login` on your phone.
2. Try **Continue with Email** or Google / Apple.
3. Callback should hit `/auth/callback` on the same tunnel host.

## Troubleshooting

| Issue | Fix |
|--------|-----|
| Next.js blocks requests / host errors | `allowedDevOrigins` in `next.config.ts` includes `*.trycloudflare.com` |
| OAuth redirect mismatch | Site URL + Redirect URLs must match tunnel URL exactly (https) |
| Magic link goes to localhost | Set `NEXT_PUBLIC_SITE_URL` to tunnel URL and restart dev |
| Tunnel URL changed | Re-copy URL, update `.env.local` and Supabase |
| `cloudflared: command not found` | Run `brew install cloudflared` |

## Optional: stable hostname (named tunnel)

For a fixed subdomain, use a [named Cloudflare tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) and copy `cloudflared/config.example.yml` → `~/.cloudflared/config.yml`. Quick tunnels are enough for most device testing.
