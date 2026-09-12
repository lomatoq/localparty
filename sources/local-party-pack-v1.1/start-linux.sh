#!/bin/bash
cd "$(dirname "$0")"
(sleep 0.7; xdg-open http://localhost:3000/host >/dev/null 2>&1 || true) &
node server.js
