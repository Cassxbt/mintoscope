#!/usr/bin/env bash
set -euo pipefail

NAME="token-2022-extension-auditor"
SRC="$(cd "$(dirname "$0")" && pwd)/skill"

installed=0
for base in "$HOME/.claude/skills" "$HOME/.codex/skills" "$HOME/.agents/skills"; do
  parent="$(dirname "$base")"
  [ -d "$parent" ] || continue
  mkdir -p "$base/$NAME"
  cp -Rf "$SRC/." "$base/$NAME/"
  echo "installed $NAME -> $base/$NAME"
  installed=1
done

if [ "$installed" -eq 0 ]; then
  mkdir -p "$HOME/.claude/skills/$NAME"
  cp -Rf "$SRC/." "$HOME/.claude/skills/$NAME/"
  echo "installed $NAME -> $HOME/.claude/skills/$NAME"
fi

echo
echo "The auditor script ships with this repo. To run a live audit:"
echo "  npm install && npm run audit -- <MINT_ADDRESS>"
