#!/bin/bash
# Auto-deploy Orchestra Research Skills to Hermes agent
set -e
SRC="$HOME/.hermes/skills/0-autoresearch-skill"
DST="$HOME/.hermes/skills/research/last30days"
mkdir -p "$DST"
rsync -a "$SRC/" "$DST/"
echo "✓ Deployed autoresearch → $DST"
