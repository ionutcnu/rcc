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

# 2) Export all secrets
for k in "${!kv[@]}"; do
  export "$k=${kv[$k]}"
done

# 3) Install & build with Bun
bun install --network-concurrency=12 --no-progress
bun run build:no-tests

# 4) Conditionally start server for tests
if [[ "${SKIP_TESTS:-false}" == "true" ]]; then
  echo "🚀 SKIPPING SERVER START - No tests to run"
else
  echo "🧪 STARTING SERVER - Tests will run"
  # 4) Start your app and wait on port 3000
  bun run start &
  SERVER_PID=$!
  wait-on http://localhost:3000
fi

export COMMIT_INFO_MESSAGE="${COMMIT_MESSAGE:-}"
export COMMIT_INFO_SHA="${GITHUB_SHA:-}"
export COMMIT_INFO_BRANCH="${GITHUB_REF_NAME:-}"

# 5) Conditionally run Cypress tests
if [[ "${SKIP_TESTS:-false}" == "true" ]]; then
  echo "🚀 SKIPPING TESTS - Fast deployment mode"
else
  echo "🧪 RUNNING TESTS - Full deployment mode"
  # 5) Run Cypress with JUnit reporter into the workspace
  mkdir -p /github/workspace/results
  npx cypress run \
    --record \
    --key "$CYPRESS_RECORD_KEY" \
    --reporter mocha-junit-reporter \
    --reporter-options mochaFile=/github/workspace/results/cypress-results.xml

  # 6) Tear down the server
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID"
  fi
fi

# 7) Deploy to Vercel
npm install --global vercel

# Debug commit message
echo "=== DEPLOYMENT DEBUG ==="
echo "COMMIT_MESSAGE: '$COMMIT_MESSAGE'"
echo "GITHUB_SHA: '$GITHUB_SHA'"
echo "GITHUB_REF_NAME: '$GITHUB_REF_NAME'"
echo "========================"

vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
vercel build --token="$VERCEL_TOKEN"

# Deploy to Vercel with commit message as metadata
if [[ -n "$COMMIT_MESSAGE" ]]; then
    echo "Deploying with commit message: $COMMIT_MESSAGE"
    vercel deploy --prebuilt --token="$VERCEL_TOKEN" --meta "commit=$COMMIT_MESSAGE"
else
    echo "Deploying with SHA: $GITHUB_SHA"
    vercel deploy --prebuilt --token="$VERCEL_TOKEN" --meta "commit=Deploy ${GITHUB_SHA:0:7}"
fi
