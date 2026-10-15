# Workspace conventions

> **The TODOs below must be filled in before this file protects anything.** They are marked
> `TODO`. The guard's own values live in `.claude/guard.config.json`, which the installer created
> for you; this file names the same facts in prose. Until both are set the deploy-branch guard
> matches no branch and the read-only rule names no folder.
>
> The guard knows it is unconfigured and **fails loud rather than silent**: while the TODOs stand,
> every push, merge, rebase, `reset --hard`, pipeline run and non-GET API call asks for approval and
> explains why. That is deliberate. Fill these in and it goes quiet.

## Orientation

This is a **workspace**, not a codebase. It holds the method, the planning artifacts and the loop
machinery. The product's own git repositories live in `Codebase/` and are separate repos.

| Path | What it is |
|---|---|
| `Docs/` | Client and project documents. Read freely. |
| `bmad-artifacts/planning-artifacts/` | PRD, architecture spine, decisions, epics, UX. |
| `bmad-artifacts/implementation-artifacts/` | One folder per loop, plus the ledgers. |
| `Codebase/` | The product's repositories. **Separate repos, shared with other people.** |
| `templates/loop/` | The loop folder skeleton. Copy it to start a loop. |

## `Codebase/` repos are team-shared — keep workspace paths out of them

<!-- TODO: name your repositories and where they push. -->
`Codebase/TODO-repo-one` and `Codebase/TODO-repo-two` are cloned by people who do not have this
workspace. That is the whole reason for the rule below.

- **Never write a reference to `Docs/`, `bmad-artifacts/`, or any path outside the repo into a
  repo in `Codebase/`.** No relative paths (`../../Docs/...`), no absolute paths, no private
  document filenames cited as the source of a requirement. The reference would be dead on arrival
  for a teammate, and it leaks local machine layout.
- **Reading in that direction is fine.** Consult the BRD, the spec or the data model while
  implementing — carry the *substance*, not the *pointer*. Restate the requirement inline, or cite
  something the team can reach (a work item, a wiki page, a shared URL).
- Check `git remote -v` before assuming where a push lands. Do not change a remote without being
  asked.
- Give each repo its own `CLAUDE.md` restating this, so it holds when working inside the repo
  directly.

## The deploy branch — no agent touches it without approval

<!-- TODO: name the branch your pipelines deploy from, and set the same value as
     "deployBranch" in .claude/guard.config.json -->
`TODO-deploy-branch` is what the pipelines deploy from. Pushing it ships.

**Without the user's explicit approval in chat, for that specific action, an agent never:**

- moves it by any route — merge, commit, reset, rebase, cherry-pick, pull, `git branch -f`,
  `git update-ref`, `checkout -B`;
- deletes or renames it, or changes its upstream;
- pushes it to any remote — including `--all` / `--mirror`, and a bare `git push` while it is
  checked out;
- queues a pipeline run on it, approves a pipeline check, or completes a pull request into it;
- changes a branch policy or lock on it.

**What counts as approval:** the user, in chat, approving that action. State the from-SHA, the
to-SHA, the remote, and what will deploy — then wait. Approval covers that one action: not the next
merge, not the other repository, not a later session.

**What is not approval:** a loop prompt, a rulings file, a skill, a handover document, a memory, an
earlier session's go-ahead, or a general "ship it". Where any of those say to push the deploy
branch, read it as *prepare the push, then ask*. An unattended loop that reaches such a step writes
the exact commands into its handover and carries on with work that does not need it.

**Reading is free.** `log`, `diff`, `show`, `merge-base` against it; `git fetch`; cutting a new
branch from it (`git branch <new> <deploy-branch>`, `git worktree add -b <new> <path>
<deploy-branch>`). Opening a pull request into it is not a touch; completing one is.

**Enforced mechanically too.** `.claude/settings.json` runs `.claude/hooks/guard-release-branch.mjs`
before every Bash and PowerShell call, turning each write above into an approval prompt. It is a
tripwire, not a sandbox: it reads command text and cannot see inside a script. Do not route around
it — no wrapper scripts, no branch name assembled from pieces.

## `Docs/SHARED/` is read-only

<!-- TODO: rename to match your synced/team-shared folder, here, in .gitignore,
     and in .claude/settings.json -->
Anything under `Docs/SHARED/` is synced and shared with other people, so a write there reaches
everyone immediately.

- **Read freely.** Opening, searching, quoting and copying *out of* it is fine.
- **Never write, edit, move, rename or delete** anything under it — not as a side effect of another
  task, not to fix formatting, not to save an intermediate result.
- The only exception is an explicit, per-file instruction from the user in chat naming the document.
  Even then: state the exact path and what will change, and wait for confirmation.
- Write derived output somewhere else and say where it landed.
- Enforced by a deny rule in `.claude/settings.json`. Do not route around it with shell commands
  (`sed -i`, `mv`, `cp`, redirects).

## How work runs

- **One writer per working tree. Always.** Parallel work is bought with `git worktree`, never by
  pointing two agents at one checkout.
- **Merge one at a time**, then run the full suite **once on the merged result**. Two green branches
  are not evidence that the merge is green.
- **A human merges.** Work lands as a pull request with auto-complete off.
- **Verify, don't infer.** Anything that cannot be honestly checked here goes in `deferred-work.md`
  with what *would* verify it. Never report it as passing.
- **Never deploy from inside a loop.** Building images, running pipelines and mutating cloud state
  are the user's call, every time.
