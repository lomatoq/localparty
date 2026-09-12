#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install Node.js LTS from https://nodejs.org/"
  read -n 1 -s -r -p "Press any key to close"
  exit 1
fi
(sleep 0.7; open http://localhost:3000/host) &
node server.js
