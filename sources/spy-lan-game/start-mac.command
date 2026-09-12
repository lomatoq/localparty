#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18+ is required: https://nodejs.org/"
  exit 1
fi
[ -d node_modules ] || npm install
(sleep 1; open http://localhost:3000/host) &
npm start
