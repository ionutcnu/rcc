#!/usr/bin/env bash
set -euo pipefail

#### 1) Decode & export SECRETS_BLOB exactly as before
declare -A kv
while IFS= read -r line; do
  [[ "$line" =~ ^([^:=]+)[=:][[:space:]]*(.*)$ ]] || continue
  key="${BASH_REMATCH[1]//[[:space:]]/}"
  val="${BASH_REMATCH[2]}"
  val="${val//$'\r'/}"             # strip CRs
  while [[ "$val" == *$'\n' ]]; do val="${val%$'\n'}"; done
  val="$(printf '%b' "$val")"      # unescape
  case "$val" in \"*\"|\'*\' ) val="${val:1:-1}" ;; esac
  kv["$key"]="$val"
done < <(
  printf '%s' "$SECRETS_BLOB" \
    | base64 --decode \
    | grep -Ev '^\s*$|^\s*#'
)
for k in "${!kv[@]}"; do export "$k=${kv[$k]}"; done

#### 2) Install & build your app
bun install --network-concurrency=12 --no-progress
bun run build:no-tests

#### 3) Start your server in the background
#    Adjust this if your start script is different (npm, yarn, etc.)
bun run start &
SERVER_PID=$!

#### 4) Wait for the server to be up on :3000
# install wait-on if you haven’t already: npm install --global wait-on
npx wait-on http://localhost:3000

#### 5) Run Cypress (now the server is live)
npx cypress run --record --key "$CYPRESS_RECORD_KEY"

#### 6) Tear down & continue to deploy
kill $SERVER_PID
npm install --global vercel
vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
vercel build --token="$VERCEL_TOKEN"
vercel deploy --prebuilt --token="$VERCEL_TOKEN"
