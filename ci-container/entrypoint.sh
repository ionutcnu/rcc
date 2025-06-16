#!/usr/bin/env bash
set -euo pipefail

# ─── 1) Decode SECRETS_BLOB into kv[] ───────────────────────────────────────
declare -A kv
while IFS= read -r line; do
  [[ "$line" =~ ^([^:=]+)[=:][[:space:]]*(.*)$ ]] || continue
  key="${BASH_REMATCH[1]//[[:space:]]/}"
  val="${BASH_REMATCH[2]}"
  # strip CRs & trailing newlines
  val="${val//$'\r'/}"
  while [[ "$val" == *$'\n' ]]; do val="${val%$'\n'}"; done
  # unescape backslashes
  val="$(printf '%b' "$val")"
  # strip wrapping quotes
  case "$val" in \"*\"|\'*\' ) val="${val:1:-1}" ;; esac
  kv["$key"]="$val"
done < <(
  printf '%s' "$SECRETS_BLOB" \
    | base64 --decode \
    | grep -Ev '^\s*$|^\s*#'
)

# ─── 2) Export all secrets into env ────────────────────────────────────────
for k in "${!kv[@]}"; do
  export "$k=${kv[$k]}"
done

# ─── 3) Install & build the app with Bun ──────────────────────────────────
bun install --network-concurrency=12 --no-progress
bun run build:no-tests

# ─── 4) Start your server & wait for port 3000 ────────────────────────────
bun run start &
SERVER_PID=$!
npm install --global wait-on
npx wait-on http://localhost:3000

# ─── 5) Ensure the JUnit reporter is in node_modules ──────────────────────
#    Install into your project so Cypress can require it.
npm install --no-save mocha-junit-reporter

# ─── 6) Run Cypress with JUnit reporting ──────────────────────────────────
mkdir -p /github/home/results
npx cypress run \
  --record \
  --key "$CYPRESS_RECORD_KEY" \
  --reporter mocha-junit-reporter \
  --reporter-options mochaFile=/github/home/results/cypress-results.xml

# ─── 7) Tear down the server ──────────────────────────────────────────────
kill "$SERVER_PID"

# ─── 8) Deploy to Vercel ───────────────────────────────────────────────────
npm install --global vercel
vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
vercel build --token="$VERCEL_TOKEN"
vercel deploy --prebuilt --token="$VERCEL_TOKEN"
