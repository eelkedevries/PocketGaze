#!/usr/bin/env bash
set -euo pipefail

PROMPT_DIR="${1:-docs-dev/agent/prompts}"

test -d "$PROMPT_DIR" || {
  echo "Prompt directory not found: $PROMPT_DIR" >&2
  exit 1
}

echo "Checking prompt files in: $PROMPT_DIR"

bad_files="$(find "$PROMPT_DIR" -maxdepth 1 -type f -name "*.md" \
  | sed "s|^$PROMPT_DIR/||" \
  | grep -Ev '^[0-9]{3}[a-z]?_(DRAFT_)?[a-z0-9]+(_[a-z0-9]+)*\.md$' || true)"

if [[ -n "$bad_files" ]]; then
  printf 'Prompt files with invalid names:\n%s\n' "$bad_files" >&2
  echo "Expected format: 001_short_name.md, 001b_short_name_fix.md, or 002_DRAFT_short_name.md" >&2
  exit 1
fi

duplicate_ids="$(find "$PROMPT_DIR" -maxdepth 1 -type f -name "*.md" \
  | sed -E 's|.*/([0-9]{3}[a-z]?)_.*|\1|' \
  | sort \
  | uniq -d || true)"

if [[ -n "$duplicate_ids" ]]; then
  printf 'Duplicate prompt IDs found:\n%s\n' "$duplicate_ids" >&2
  exit 1
fi

# Structural and placeholder checks.
#
# Every prompt is checked for unresolved template placeholders (e.g. `<criterion>`).
# Implementation prompts (numeric id >= 004) must additionally contain the full required
# section set. The setup/spec/planner prompts (001-003) are meta-prompts with a different
# shape and are exempt from the section check.
REQUIRED_SECTIONS=(
  '^# Task:'
  '^## Goal'
  '^## Scope'
  '^## Required reading'
  '^## Dependencies'
  '^## Required changes'
  '^## Do not implement'
  '^## Acceptance criteria'
  '^## Automated checks'
  '^## Manual verification'
  '^## Commit and push'
  '^## Final report'
)

structural_fail=0

while IFS= read -r file; do
  base="$(basename "$file")"

  # Unresolved angle-bracket placeholders left from the prompt template.
  if grep -nE '<[A-Za-z][^>]{2,}>' "$file" >/dev/null 2>&1; then
    printf 'Unresolved template placeholder(s) in %s:\n' "$base" >&2
    grep -nE '<[A-Za-z][^>]{2,}>' "$file" >&2
    structural_fail=1
  fi

  id="${base:0:3}"
  # Only enforce full structure on implementation prompts (id >= 004).
  if [[ "$id" =~ ^[0-9]{3}$ ]] && (( 10#$id >= 4 )); then
    for section in "${REQUIRED_SECTIONS[@]}"; do
      if ! grep -qE "$section" "$file"; then
        printf 'Missing required section in %s: %s\n' "$base" "${section#^}" >&2
        structural_fail=1
      fi
    done
  fi
done < <(find "$PROMPT_DIR" -maxdepth 1 -type f -name "*.md" | sort)

if [[ "$structural_fail" -ne 0 ]]; then
  echo "Prompt structure validation failed." >&2
  exit 1
fi

echo "Prompt validation completed."
