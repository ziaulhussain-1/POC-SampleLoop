# ai-dev-workspace

The workspace we start every project in. Clone it, drop your repositories into `Codebase/`,
and you have the method, the agent skills and the loop machinery already wired together.

It is a **workspace**, not a codebase. Your product's git repositories live inside it and stay
separate from it.

---

## What ships in it

| | |
|---|---|
| `_bmad/` | The installed method — config, modules, render scripts. |
| `.claude/skills/` | 42 agent skills: planning, architecture, stories, build, review, test. |
| `.claude/hooks/` | `guard-release-branch.mjs` — turns a write to your deploy branch into an approval prompt. Configured by `.claude/guard.config.json`, never by editing the hook. |
| `.claude/settings.json` | Hook registration and the read-only deny rules. |
| `bmad-artifacts/` | Empty folders where planning and implementation output lands. |
| `templates/loop/` | A loop folder skeleton — copy it to start a loop. |
| `Codebase/` | Empty. Your repositories go here. |
| `CLAUDE.md` | The rules every agent reads. **Written for you to edit.** |

---

## Quick start

```bash
npx @solvefy/create-workspace acme-workspace
```

That is the whole install. It takes this template's current `main` **as files, not as a clone**:
no history, no remote, no link back here. You get your own `git init`, one initial commit, and a
workspace you then point at your own repository.

> **Why not `git clone`?** A clone leaves `origin` pointing at the template, still writable — and
> `Docs/` is tracked. One `git push` would publish your client's documents into the repository every
> other team installs from next. The installer removes the possibility rather than guarding it.
>
> If you must clone by hand, run `./setup.sh` (Windows: `.\setup.ps1`) immediately — it drops the
> history and does the same job.

Then, in order:

1. **Point it at your own repo.**
   `git remote add origin <url> && git push -u origin main`
2. **Configure the branch guard.** The installer creates `.claude/guard.config.json` from the
   example; set `deployBranch`, `guardedRepos` and `ciOrg`. Until you do, the hook cannot check
   anything, so **it fails loud rather than silent**: every push, merge, rebase, `reset --hard`,
   pipeline run and non-GET API call asks for approval and says why. Reads stay quiet. Commit this
   file — your teammates need the same protection.
3. **Edit `CLAUDE.md`.** Its `TODO` markers want the same three facts, plus the name of any synced
   team folder.
4. **Add your repositories** into `Codebase/`. Clone them normally; they are ignored by this repo
   (see *Nested repositories*).
5. **Optional:** copy `.claude/launch.json.example` to `.claude/launch.json` so agents can start your
   dev server and verify changes in a browser.
6. **Put the project's documents in `Docs/`** — all versions, not just the newest.

The project name is set during install, in `_bmad/custom/config.toml`. Do **not** edit
`_bmad/config.toml` — the BMAD installer regenerates it.

---

## Plan before you loop

Do not start a loop against unreconciled documents. The sequence, in order:

1. Reconcile every document into **one register** of contradictions, open questions and gaps.
2. Write the **PRD** — requirements with criteria that can fail.
3. Write the **architecture spine** — the invariants everything else is built from.
4. Record **decisions** with their reasoning.
5. Cut **epics and stories**.
6. Run a **readiness gate** before cutting stories. This is the step people skip.

Each has a skill. Ask for the one you need by name, or run `bmad-help` if you are unsure.

---

## Your first loop

A **loop** is a themed unit of work with its own dated folder. The orchestrator restarts from zero
every pass, so the folder is its entire memory.

```bash
cp -r templates/loop bmad-artifacts/implementation-artifacts/onboarding-2026-10-14
```

Fill in the `<ANGLE-BRACKET>` placeholders in `rulings.md` (what has been decided) and `loop.md`
(the paths, the waves, the gate). Then run a pass — three ways, same prompt:

```
# 1. By hand — paste the prompt into a fresh session. Use this until you trust it.

# 2. Self-paced in the app:
/loop
  Read `bmad-artifacts/implementation-artifacts/<folder>/loop.md` and execute one
  full pass of THE PROMPT it contains, then report.

# 3. Unattended (PowerShell) — re-runs until a stop sentinel appears:
$prompt = "Read '<workspace>\bmad-artifacts\implementation-artifacts\<folder>\loop.md'
           and execute one full pass of THE PROMPT it contains."
while ($true) {
  $out = claude -p $prompt --permission-mode acceptEdits
  $out
  if ($out -match "LOOP (COMPLETE|PAUSED)") { break }
}
```

**The first pass writes no code.** It creates four state files in the loop folder and stops:

| File | Holds |
|---|---|
| `GATES.md` | Open decisions that block work. You own the policy line; the loop obeys it. |
| `ESCALATIONS.md` | Anything only a human can settle. Filed, not asked — the run continues. |
| `PASS-LOG.md` | One line per pass. |
| `deferred-work.md` | What could not be honestly verified, and what would verify it. |

Read `GATES.md`, set each policy to `PARK`, `PROCEED-AT-RISK` or `CLEAR`, and re-run. Everything
after that is unattended.

Every pass ends with exactly one line:

```
LOOP CONTINUE: <what the next pass will do>      re-run me
LOOP PAUSED:   <the human action needed>         resolve, then re-run me
LOOP COMPLETE: every item in scope is done or parked
```

To answer an escalation, write your ruling into its `resolution:` line and set `status: resolved`.
The next pass applies it and re-drives the work.

---

## Rules that ship with it

These are in `CLAUDE.md`, and the dangerous ones are enforced by a hook or a deny rule.

- **One writer per working tree.** Parallel work is bought with `git worktree`, never by pointing
  two agents at one checkout.
- **The deploy branch is untouchable.** No merge, push or pipeline run on it without approval in
  chat, for that one action.
- **References point one way.** Never write a workspace path into a repository in `Codebase/` —
  teammates cloning that repo do not have this workspace.
- **A human merges.** Work lands as a pull request with auto-complete off.
- **Verify, don't infer.** Anything that cannot be honestly checked here is recorded as deferred
  work, never reported as passing.

---

## Nested repositories

`Codebase/*` is gitignored. Clone your repositories into it normally.

If a repository there ever shows up in `git status` as a single changed entry, it has been recorded
as a **gitlink** — a submodule pointer with no `.gitmodules`, which breaks on clone for everyone
else. Remove it from the index and leave it ignored:

```bash
git rm --cached Codebase/<repo>
```

---

## Not committed, by design

`Codebase/*` · `.claude/settings.local.json` (machine paths) · `.claude/launch.json` (per-machine
ports) · `.mcp.json` (carries tokens) · `.worktrees/` · `Docs/SHARED/` (the synced team folder, if
you use one).

---

## Layout

```
workspace/
  Docs/                  project documents — read freely, never built from directly
    SHARED/                optional synced team folder — read-only, gitignored
  bmad-artifacts/
    planning-artifacts/      PRD, architecture, epics, UX
    implementation-artifacts/  one folder per loop, plus the ledgers
  Codebase/              your repositories (ignored)
  templates/loop/        loop folder skeleton
  _bmad/                 the method
  .claude/               skills, hooks, settings
  CLAUDE.md              project rules — edit this first
```

---

## Pulling template improvements

There is no template remote to merge from — by design. Instead, refresh the template's own files
in place, from the workspace root, with a clean tree:

```bash
npx @solvefy/create-workspace update
```

It replaces **only what the template owns** and leaves everything else exactly as it is:

| Refreshed | Never touched |
|---|---|
| `.claude/skills/` `.claude/hooks/` | `Docs/` `bmad-artifacts/` `Codebase/` |
| `.githooks/` `templates/` | `CLAUDE.md` `.claude/settings.json` `.gitignore` `README.md` |
| `_bmad/` *(except `_bmad/custom/`)* | `.claude/guard.config.json` `_bmad/custom/` |

Because it never writes a file you own, it cannot conflict with your work — which a merge can, and
would, in exactly the files you were told to edit. Where the template has changed its own copy of
something in the right-hand column, the update **says so and changes nothing**, leaving the decision
to you.

It refuses to run on a dirty tree, so `git diff` afterwards shows precisely what moved.
