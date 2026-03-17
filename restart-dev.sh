#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

echo "Checking for stale Next.js dev processes..."

if lsof -ti tcp:3000 >/dev/null 2>&1; then
  PORT_PID="$(lsof -ti tcp:3000 | head -n 1)"
  echo "Stopping process on port 3000 (PID: ${PORT_PID})"
  kill "$PORT_PID" || true
fi

if pgrep -f "next dev" >/dev/null 2>&1; then
  echo "Stopping extra next dev processes"
  pkill -f "next dev" || true
fi

rm -f .next/dev/lock

echo "Starting dev server..."
exec npm run dev
