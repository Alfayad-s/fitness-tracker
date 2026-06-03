#!/usr/bin/env bash
# Usage: check-port.sh [port]  — exits 0 if free, 1 if in use (prints help).

PORT="${1:-${PORT:-3000}}"

if pids=$(lsof -ti ":${PORT}" 2>/dev/null) && [ -n "$pids" ]; then
  echo "❌ Port ${PORT} is already in use (PID: $(echo "$pids" | tr '\n' ' ' | xargs))."
  echo ""
  echo "Stop the process using that port:"
  echo "  npm run dev:free-port"
  echo ""
  echo "Or manually:"
  echo "  lsof -ti :${PORT} | xargs kill -9"
  echo ""
  echo "Or use another port:"
  echo "  PORT=3001 npm run dev:tunnel"
  exit 1
fi

exit 0
