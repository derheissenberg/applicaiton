#!/usr/bin/env bash
# Post-edit hook: lint + typecheck after agent file edits.
# Input (stdin): { "file_path": "<absolute>", "edits": [...] }
#
# Surfaces errors in the Hooks output channel so the agent can fix issues early.
# Full build runs on stop via post-agent-validate.sh.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

input="$(cat)"
file_path=""

if command -v jq >/dev/null 2>&1; then
  file_path="$(printf '%s' "$input" | jq -r '.file_path // empty')"
else
  file_path="$(printf '%s' "$input" | node -e "
    let d = '';
    process.stdin.on('data', (c) => (d += c));
    process.stdin.on('end', () => {
      try { console.log(JSON.parse(d).file_path || ''); }
      catch { console.log(''); }
    });
  ")"
fi

if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

# Project-relative path for tools
rel="${file_path#"$ROOT"/}"
rel="${rel#/}"

ext="${rel##*.}"
errors=0

echo "[post-edit-check] $rel"

case "$ext" in
  ts|tsx|js|jsx)
    if command -v npx >/dev/null 2>&1; then
      echo "--- eslint $rel ---"
      if ! npx eslint --no-error-on-unmatched-pattern "$rel"; then
        errors=$((errors + 1))
      fi
    fi

    # Throttle project typecheck to at most once per 15s
    stamp_file="$ROOT/.cursor/hooks/.last-typecheck"
    now=$(date +%s)
    last=0
    if [ -f "$stamp_file" ]; then
      last=$(cat "$stamp_file" 2>/dev/null || echo 0)
    fi
    if [ $((now - last)) -ge 15 ]; then
      echo "$now" >"$stamp_file"
      echo "--- tsc --noEmit ---"
      if ! npx tsc --noEmit; then
        errors=$((errors + 1))
      fi
    fi
    ;;
esac

if [ "$errors" -gt 0 ]; then
  echo "[post-edit-check] FAILED ($errors check(s)) — fix before finishing; stop hook will run full validate."
  exit 1
fi

exit 0
