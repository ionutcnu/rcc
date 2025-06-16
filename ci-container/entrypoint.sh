#!/usr/bin/env bash
set -euo pipefail

# ─── 1) Decode SECRETS_BLOB → associative array ────────────────────────────
declare -A kv
while IFS= read -r line; do
  [[ "$line" =~ ^([^:=]+)[=:][[:space:]]*(.*)$ ]] || continue
  key="${BASH_REMATCH[1]//[[:space:]]/}"
  val="${BASH_REMATCH[2]}"

  # strip CRs & trailing newlines
  val="${val//$'\r'/}"
  while [[ "$val" == *$'\n' ]]; do val="${val%$'\n'}"; done

  # unescape backslash sequences (\n,\t,\")
  val="$(printf '%b' "$val")"

  # remove wrapping quotes if present
  case "$val" in \"*\"|\'*\' ) val="${val:1:-1}" ;; esac

  kv["$key"]="$val"
done < <(
  printf '%s' "$SECRETS_BLOB" \
    | base64 --decode \
    | grep -Ev '^\s*$|^\s*#'
)

# ─── 2) Export secrets into env ────────────────────────────────────────────
for k in "${!kv[@]}"; do
  export "$k=${kv[$k]}"
done

# ─── 3) Install JS deps & build the app ────────────────────────────────────
#    Bun is on PATH; install dependencies and build without running tests
bun install --network-concurrency=12 --no-progress
bun run build:no-tests

# ─── 4) Start the server in background & wait for port 3000 ───────────────
bun run start &
SERVER_PID=$!

# install wait-on so we can block until the server is live
npm install --global wait-on
npx wait-on http://localhost:3000

# ─── 5) Run Cypress with JUnit reporting ───────────────────────────────────
#    Write results to a file in the GitHub workspace for later summary
mkdir -p /github/home/results
npx cypress run \
  --record \
  --key "$CYPRESS_RECORD_KEY" \
  --reporter mocha-junit-reporter \
  --reporter-options mochaFile=/github/home/results/cypress-results.xml

# ─── 6) Tear down test server ──────────────────────────────────────────────
kill "$SERVER_PID"

# ─── 7) Deploy via Vercel CLI ───────────────────────────────────────────────
#    Install the CLI and push your preview build
npm install --global vercel
vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
vercel build --token="$VERCEL_TOKEN"
vercel deploy --prebuilt --token="$VERCEL_TOKEN"
