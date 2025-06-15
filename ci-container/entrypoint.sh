#!/usr/bin/env bash
set -euo pipefail


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


for k in "${!kv[@]}"; do
  printf '%s=%s\n' "$k" "${kv[$k]}" >> /github/env
done


export PATH="$HOME/.bun/bin:$PATH"
for try in 1 2 3; do
  bun install --network-concurrency=12 --no-progress && break
  sleep 15
done


npm install --global vercel
npm install --global cypress
npm install --global @cypress/github-action
npx cypress run --record --key "$CYPRESS_RECORD_KEY"


vercel pull --yes --environment=preview --token="$VERCEL_TOKEN"
vercel build --token="$VERCEL_TOKEN"
vercel deploy --prebuilt --token="$VERCEL_TOKEN"
