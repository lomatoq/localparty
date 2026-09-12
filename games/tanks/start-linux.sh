#!/bin/bash
cd "$(dirname "$0")"
node server.js &
PID=$!
trap 'kill "$PID" >/dev/null 2>&1 || true' INT TERM EXIT
sleep 0.7
xdg-open "http://localhost:3000/host" >/dev/null 2>&1 || true
wait "$PID"
