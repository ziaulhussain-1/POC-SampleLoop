#!/bin/sh
# Manual fallback for `npx @solvefy/create-workspace <dir>`, which does all of this for you.
# Use it when you have cloned this repository by hand.
#
# It takes the files and drops the history, so the workspace has no link back to the template and
# nothing can be pushed to it. You then point it at your own remote.

set -e
cd "$(dirname "$0")"

echo
echo "Workspace setup"
echo "==============="

if [ -d .git ] && git remote -v 2>/dev/null | grep -Eqi 'ai-dev-workspace(\.git)?'; then
  COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)
  rm -rf .git installer .github
  git init -q -b main
  printf '{\n  "template": "https://github.com/Solvefy/ai-dev-workspace.git",\n  "commit": "%s"\n}\n' "$COMMIT" > .workspace-template.json
  echo "  ✓ history dropped — this workspace has no remote and no link to the template"
else
  echo "  · already detached, or not a clone of the template"
  [ -d .git ] || git init -q -b main
fi

git config core.hooksPath .githooks
git config core.longpaths true
chmod +x .githooks/* setup.sh 2>/dev/null || true
echo "  ✓ pre-push guard installed"

if [ -f .claude/guard.config.example.json ] && [ ! -f .claude/guard.config.json ]; then
  cp .claude/guard.config.example.json .claude/guard.config.json
  echo "  ✓ .claude/guard.config.json created from the example"
fi

echo
echo "Next:"
echo "  1. Point it at your own repo:   git remote add origin <url> && git push -u origin main"
echo "  2. Configure the branch guard:  .claude/guard.config.json"
echo "  3. Fill in the TODOs:           CLAUDE.md"
echo "  4. Project documents in Docs/, your repositories in Codebase/"
echo
echo "  Until the guard is configured it asks for approval on every push, merge and reset --hard."
echo
