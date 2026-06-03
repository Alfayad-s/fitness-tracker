#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3000}"
export PORT

bash scripts/check-port.sh "$PORT"

echo "Starting Next.js dev server + Cloudflare tunnel (port ${PORT})…"
echo "Press Ctrl+C to stop both."
echo ""

npx concurrently@9 \
  --kill-others \
  --names "next,tunnel" \
  --prefix-colors "blue,magenta" \
  "npm run dev" \
  "bash scripts/tunnel.sh"
