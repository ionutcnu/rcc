#!/usr/bin/env bash
set -euo pipefail

# 1) Decode SECRETS_BLOB into kv[]
declare -A kv
while IFS= read -r line; do
  [[ "$line" =~ ^([^:=]+)[=:][[:space:]]*(.*)$ ]] || continue
  key="${BASH_REMATCH[1]//[[:space:]]/}"
  val="${BASH_REMATCH[2]}"
  val="${val//$'\r'/}"
  while [[ "$val" == *$'\n' ]]; do val="${val%$'\n'}"; done
  val="$(printf '%b' "$val")"
  case "$val" in \"*\"|\'*\' ) val="${val:1:-1}" ;; esac
  kv["$key"]="$val"
done < <(printf '%s' "$SECRETS_BLOB" | base64 --decode | grep -Ev '^\s*$|^\s*#')

# 2) Export secrets
for k in "${!kv[@]}"; do
  export "$k=${kv[$k]}"
done

# 3) Install & build with Bun
bun install --network-concurrency=12 --no-progress
bun run build:no-tests

# 4) Start server and wait for it
bun run start &
SERVER_PID=$!
wait-on http://localhost:3000

# 5) Run Cypress with JUnit reporter
mkdir -p /github/home/results
npx cypress run \
  --record \
  --key "$CYPRESS_RECORD_KEY" \
  --reporter mocha-junit-reporter \
  --reporter-options mochaFile=/github/home/results/cypress-results.xml

# 6) Tear down
kill "$SERVER_PID"

# 7) Deploy to Vercel
npm install --global vercel
vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
vercel build --token="$VERCEL_TOKEN"
vercel deploy --prebuilt --token="$VERCEL_TOKEN"
