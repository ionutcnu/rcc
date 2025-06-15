#!/usr/bin/env bash
set -euo pipefail

# ─── 1. Decode SECRETS_BLOB into an associative array ──────────────────────
declare -A kv
while IFS= read -r line; do
  [[ "$line" =~ ^([^:=]+)[=:][[:space:]]*(.*)$ ]] || continue
  key="${BASH_REMATCH[1]//[[:space:]]/}"
  val="${BASH_REMATCH[2]}"

  # Strip CRs and trailing newlines
  val="${val//$'\r'/}"
  while [[ "$val" == *$'\n' ]]; do val="${val%$'\n'}"; done

  # Unescape backslash-escapes (\n, \t, etc.)
  val="$(printf '%b' "$val")"

  # Remove wrapping quotes if present
  case "$val" in
    \"*\"|\'*\' ) val="${val:1:-1}" ;;
  esac

  kv["$key"]="$val"
done < <(
  printf '%s' "$SECRETS_BLOB" \
    | base64 --decode \
    | grep -Ev '^\s*$|^\s*#'
)

# ─── 2. Export each secret into the shell environment ───────────────────────
for key in "${!kv[@]}"; do
  export "$key=${kv[$key]}"
done

# ─── 3. Install JS dependencies with Bun ──────────────────────────────────
bun install --network-concurrency=12 --no-progress

# ─── 4. Run your build & Cypress tests (recording to Dashboard) ───────────
bun run build:no-tests
npx cypress run --record --key "$CYPRESS_RECORD_KEY"

# ─── 5. Install & invoke Vercel CLI ───────────────────────────────────────
npm install --global vercel
vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
vercel build --token="$VERCEL_TOKEN"
vercel deploy --prebuilt --token="$VERCEL_TOKEN"
