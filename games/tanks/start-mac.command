#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install Node.js 20+ from nodejs.org and run again."
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi
node server.js &
PID=$!
trap 'kill "$PID" >/dev/null 2>&1 || true' INT TERM EXIT
sleep 0.7
open "http://localhost:3000/host"
wait "$PID"
