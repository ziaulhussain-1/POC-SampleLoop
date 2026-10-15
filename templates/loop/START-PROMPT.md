You're the orchestrator of the **<TOPIC> loop** in this workspace. The loop folder is
`bmad-artifacts/implementation-artifacts/<THIS FOLDER>/`. Run it unattended, from start to finish.

Read these first, in this order:

1. `rulings.md`. These outrank everything else — this prompt, `loop.md`, any README in the code, and
   anything you infer from the code itself.
2. `loop.md`. The waves, the gate, the ending. **Read the trap list at the bottom before you start,
   not after.**
3. `status.md`. Where things stand. Keep it current after every wave.
4. `<evidence file>`, if this loop has one. Measured facts — do not re-derive them.

## Scope

<One paragraph: what this loop touches and, just as important, what it does not. Name the
repositories and the directories. Everything else is out of scope.>

## What makes this loop different

<Delete if nothing does. Otherwise: the one thing an agent would get wrong by assuming this loop is
like the others. For example — there is no test suite for this surface, so the gate is a browser
against the deployed site; or every change here is user-visible, so every bundle needs a screenshot.>

## How to run

**If `GATES.md` does not exist in this folder, this is the bootstrap pass.** Follow `loop.md` §2a
instead of the steps below: it creates the state files, records the starting commits, and **stops**
so a human can set gate policy. Do not cut a branch on the bootstrap pass. The steps below are for
every pass after it.

1. Record the starting commit of each repository in `status.md`.
2. Cut the work branch from the base branch **in a worktree**. Never check out the deploy branch.
3. Run the waves in `loop.md`. Give every agent its brief, `rulings.md`, and the boundary block.
   Tell each one to prove its work the way its "Prove it" line says, and to report its commit, what
   it measured, any deviation, and anything it could not verify.
4. After each report: review the diff, check the proof **yourself**, update `status.md`.
5. When a question would block, take the conservative path, record it under "Decisions taken
   unattended" in `status.md`, and carry on. Never stall. Never silently invent a decision.
6. The ending, in `loop.md`: the full gate, one pull request per repository with auto-complete off,
   `HANDOVER.md`, and the deferred-work entries.

## Never

- **The deploy branch.** Never commit, merge, push or run a pipeline on it. Work in a worktree, open
  a pull request, leave auto-complete off. The workspace `CLAUDE.md` rule and its hook apply.
- **Deploying anything.** No pipeline runs, no image builds, no cloud mutations.
- **Another agent's working tree.** One writer per tree, including the orchestrator's own checkout.
- **Read-only folders** named in the workspace `CLAUDE.md`.
- **Workspace paths inside a shared repository.** Carry the substance, not the pointer.
- **<ANYTHING ELSE THIS LOOP MUST NOT TOUCH>**
