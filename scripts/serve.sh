#!/usr/bin/env bash
# Build and serve the production bundle on port 3000.
set -euo pipefail
cd "$(dirname "$0")/.."

ulimit -n 65536 2>/dev/null || true
PORT="${PORT:-3000}"

free_port() {
  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi
  local pids
  pids=$(lsof -t -iTCP:"${PORT}" -sTCP:LISTEN 2>/dev/null || true)
  for pid in $pids; do
    local cmd
    cmd=$(ps -p "$pid" -o args= 2>/dev/null || true)
    case "$cmd" in
      *vite*|*oms-backoffice-ui*)
        echo "Stopping previous server on :${PORT} (pid $pid)"
        kill "$pid" 2>/dev/null || true
        ;;
    esac
  done
  for _ in 1 2 3 4 5 6 7 8; do
    if ! lsof -t -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.25
  done
}

echo "Building optimized production bundle..."
npm run build

free_port

echo "Serving production build at http://127.0.0.1:${PORT}"
exec npx vite preview --host 127.0.0.1 --port "$PORT" --strictPort
