#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "❌ cloudflared is not installed."
  echo ""
  echo "Install on macOS:"
  echo "  brew install cloudflared"
  echo ""
  echo "Or see: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Cloudflare quick tunnel → http://localhost:${PORT}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "When the public URL appears (https://….trycloudflare.com):"
echo "  1. Open that URL on your phone / external device"
echo "  2. Set NEXT_PUBLIC_SITE_URL in .env.local to that URL"
echo "  3. Restart \`npm run dev\` (or the dev:tunnel process)"
echo "  4. In Supabase → Auth → URL Configuration, add:"
echo "       https://YOUR-SUBDOMAIN.trycloudflare.com/auth/callback"
echo "       https://YOUR-SUBDOMAIN.trycloudflare.com/**"
echo ""
echo "Full guide: docs/cloudflare-tunnel.md"
echo ""

wait_for_origin() {
  local waited=0
  local max_wait="${TUNNEL_WAIT_SECONDS:-120}"

  while ! nc -z 127.0.0.1 "$PORT" 2>/dev/null; do
    if [[ "$waited" -eq 0 ]]; then
      echo "⏳ Waiting for http://127.0.0.1:${PORT} (start Next.js or use npm run dev:tunnel)…"
    fi
    if [[ "$waited" -ge "$max_wait" ]]; then
      echo ""
      echo "❌ Nothing is listening on port ${PORT} after ${max_wait}s."
      echo ""
      echo "Run both dev server and tunnel together:"
      echo "  npm run dev:tunnel"
      echo ""
      echo "Or in two terminals:"
      echo "  npm run dev"
      echo "  npm run tunnel"
      exit 1
    fi
    sleep 1
    waited=$((waited + 1))
  done

  echo "✓ Origin ready on port ${PORT}"
  echo ""
}

wait_for_origin

exec cloudflared tunnel --url "http://127.0.0.1:${PORT}"
