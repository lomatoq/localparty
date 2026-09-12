#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then echo "Нужен Node.js 18+: https://nodejs.org/"; read -n 1; exit 1; fi
[ -d node_modules ] || npm install
(sleep 1; open http://localhost:3000/host) &
node server.js
