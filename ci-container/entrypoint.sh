#!/usr/bin/env bash
set -euo pipefail

# 1) Decode SECRETS_BLOB → associative array
declare -A kv
while IFS= read -r line; do
  [[ "$line" =~ ^([^:=]+)[=:][[:space:]]*(.*)$ ]] || continue
  key="${BASH_REMATCH[1]//[[:space:]]/}"
  val="${BASH_REMATCH[2]}"
  val="${val//$'\r'/}"                     # strip CRs
  while [[ "$val" == *$'\n' ]]; do val="${val%$'\n'}"; done
  val="$(printf '%b' "$val")"              # unescape
  case "$val" in \"*\"|\'*\' ) val="${val:1:-1}" ;; esac
  kv["$key"]="$val"
done < <(printf '%s' "$SECRETS_BLOB" | base64 --decode | grep -Ev '^\s*$|^\s*#')

# 2) Export each secret into this shell
for k in "${!kv[@]}"; do
  export "$k=${kv[$k]}"
done

# 3) Install & build with Bun
bun install --network-concurrency=12 --no-progress
bun run build:no-tests

# 4) Launch the server in the background
bun run start &
SERVER_PID=$!

# 5) Wait for it to be up on port 3000
wait-on http://localhost:3000

# 6) Run Cypress and emit a JUnit report into the workspace
mkdir -p /github/workspace/results
npx cypress run \
  --record \
  --key "$CYPRESS_RECORD_KEY" \
  --reporter mocha-junit-reporter \
  --reporter-options mochaFile=/github/workspace/results/cypress-results.xml

# 7) Tear down the server
kill "$SERVER_PID"

# 8) Deploy to Vercel
npm install --global vercel
vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
vercel build --token="$VERCEL_TOKEN"
vercel deploy --prebuilt --token="$VERCEL_TOKEN"
