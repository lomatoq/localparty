#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js не найден. Установи Node.js 18+ и запусти файл снова."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Устанавливаю зависимости один раз..."
  npm install
fi
( command -v open >/dev/null && open http://localhost:3000 ) || true
node server.js
