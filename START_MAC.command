#!/bin/bash
cd "$(dirname "$0")" || exit 1
if [ ! -x runtime/node/bin/node ]; then
  echo "Bundled Node.js missing or executable permissions lost. Extract the entire Mac ZIP with Archive Utility."
  read -r -p "Press Enter to close. "
  exit 1
fi
export PATH="$PWD/runtime/node/bin:$PATH"
echo "LOCAL PARTY — keep this window open while playing."
exec "$PWD/runtime/node/bin/node" "$PWD/server.js"
