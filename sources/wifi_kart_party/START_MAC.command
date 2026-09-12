#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d .venv ]; then
  python3 -m venv .venv || exit 1
fi
source .venv/bin/activate
python -c "import aiohttp,qrcode,PIL" >/dev/null 2>&1 || python -m pip install --disable-pip-version-check -r requirements.txt || exit 1
python server.py
