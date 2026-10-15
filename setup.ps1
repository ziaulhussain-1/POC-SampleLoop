# Manual fallback for `npx @solvefy/create-workspace <dir>`, which does all of this for you.
# Use it when you have cloned this repository by hand.
#
# It takes the files and drops the history, so the workspace has no link back to the template and
# nothing can be pushed to it. You then point it at your own remote.

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host ''
Write-Host 'Workspace setup'
Write-Host '==============='

$isTemplateClone = (Test-Path .git) -and ((git remote -v 2>$null) -match 'ai-dev-workspace')
if ($isTemplateClone) {
  $commit = (git rev-parse --short HEAD 2>$null)
  if (-not $commit) { $commit = 'unknown' }
  Remove-Item -Recurse -Force .git, installer, .github -ErrorAction SilentlyContinue
  git init -q -b main
  "{`n  `"template`": `"https://github.com/Solvefy/ai-dev-workspace.git`",`n  `"commit`": `"$commit`"`n}" |
    Set-Content -Path .workspace-template.json
  Write-Host '  [ok] history dropped - this workspace has no remote and no link to the template'
} else {
  Write-Host '  [--] already detached, or not a clone of the template'
  if (-not (Test-Path .git)) { git init -q -b main }
}

git config core.hooksPath .githooks
git config core.longpaths true
Write-Host '  [ok] pre-push guard installed'

if ((Test-Path .claude/guard.config.example.json) -and -not (Test-Path .claude/guard.config.json)) {
  Copy-Item .claude/guard.config.example.json .claude/guard.config.json
  Write-Host '  [ok] .claude/guard.config.json created from the example'
}

Write-Host ''
Write-Host 'Next:'
Write-Host '  1. Point it at your own repo:   git remote add origin <url> ; git push -u origin main'
Write-Host '  2. Configure the branch guard:  .claude/guard.config.json'
Write-Host '  3. Fill in the TODOs:           CLAUDE.md'
Write-Host '  4. Project documents in Docs/, your repositories in Codebase/'
Write-Host ''
Write-Host '  Until the guard is configured it asks for approval on every push, merge and reset --hard.'
Write-Host ''
