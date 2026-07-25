#!/usr/bin/env bash
# Red-line claims check — website PRD §4 enforcement.
# Exit 1 if any restricted claim string appears in shipped code.
# Hits are allowed ONLY as gated code paths documented in the PR body.
set -uo pipefail

PATTERN='DIM ?(225|285|221)|÷ ?(225|285|221)|2.day|two.day|zero shrinkage|guaranteed deliver|\$15M|80% off'

if [ "$#" -gt 0 ]; then DIRS=("$@"); else DIRS=(app components lib); fi

matches=$(grep -riEn "$PATTERN" "${DIRS[@]}" 2>/dev/null || true)

if [ -n "$matches" ]; then
  echo "Restricted claim strings found:"
  echo "$matches"
  echo
  echo "FAIL — each hit above must be a gated code path documented in the PR body (website PRD §4)."
  exit 1
fi

echo "PASS — no restricted claim strings in: ${DIRS[*]}"
