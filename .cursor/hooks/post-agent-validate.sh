#!/usr/bin/env bash
# Stop hook: run full validate (typecheck + build + smoke tests) before agent may finish.
# Input (stdin): { "status": "completed"|"aborted"|"error", "loop_count": number }
# Output (stdout): { "followup_message": "..." } when validation fails — agent auto-continues to fix.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

input="$(cat)"
status="completed"
loop_count=0

if command -v jq >/dev/null 2>&1; then
  status="$(printf '%s' "$input" | jq -r '.status // "completed"')"
  loop_count="$(printf '%s' "$input" | jq -r '.loop_count // 0')"
fi

if [ "$status" != "completed" ]; then
  exit 0
fi

echo "[post-agent-validate] loop_count=$loop_count — running npm run validate"

log="$(mktemp)"
trap 'rm -f "$log"' EXIT

if npm run validate >"$log" 2>&1; then
  echo "[post-agent-validate] OK"
  exit 0
fi

echo "[post-agent-validate] FAILED"
tail -100 "$log" >&2

if command -v jq >/dev/null 2>&1; then
  jq -n \
    --arg body "$(tail -80 "$log")" \
    --argjson loop "$loop_count" \
    '{
      followup_message: (
        "Automated validation failed (attempt " + (($loop|tonumber) + 1|tostring) + "). "
        + "Fix all errors below, then run `npm run validate` locally before stopping again:\n\n"
        + $body
      )
    }'
else
  # Minimal JSON escape fallback
  msg="Validation failed. Run npm run validate and fix errors before finishing."
  printf '%s\n' "{\"followup_message\":$(node -pe "JSON.stringify(process.argv[1])" "$msg")}"
fi

exit 0
