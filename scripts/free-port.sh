#!/usr/bin/env bash
# Usage: free-port.sh [port]  — kills processes listening on the port.

PORT="${1:-${PORT:-3000}}"

if ! pids=$(lsof -ti ":${PORT}" 2>/dev/null) || [ -z "$pids" ]; then
  echo "Port ${PORT} is already free."
  exit 0
fi

echo "Stopping process(es) on port ${PORT}: $(echo "$pids" | tr '\n' ' ')"
echo "$pids" | xargs kill -9 2>/dev/null || true
echo "Done. Port ${PORT} is free."
