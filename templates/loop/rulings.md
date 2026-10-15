# <TOPIC> loop — rulings (<DATE>)

These outrank the briefs, any README in the code, and anything an agent infers from the code.
Where a brief and a ruling disagree, **the ruling wins** and the deviation is recorded in
`status.md`.

Precedence: **ruling > brief > README > inference.**

## Context

<Two or three sentences: what prompted this loop, what has already been decided elsewhere, and what
this loop is explicitly not reopening.>

---

## Product rulings (<WHO DECIDED>, <DATE>)

These are decisions a human made. An agent does not reopen them.

**R-1 — <one-line statement of the decision>.**
<What it means in practice, and what it rules out. Be specific enough that an agent can tell whether
a given change obeys it.>

**R-2 — <...>**

---

## Build rulings (the orchestrator's, from the evidence; a human may override)

How the work gets done. Drawn from what was measured, not from preference.

**B-1 — <one-line statement>.**
<Why this way and not the obvious alternative. Name the trap it avoids.>

**B-2 — <...>**

---

## Cross-cutting guards

Hard nevers that apply to every wave in this loop. These repeat the workspace `CLAUDE.md` where it
matters, because an agent reads this file first.

**CG-1 — The deploy branch is never touched.** Work in a worktree, open a pull request, leave
auto-complete off.

**CG-2 — Nothing is deployed.** No pipeline runs, no image builds, no cloud mutations.

**CG-3 — When a question would block, take the conservative path**, record it under "Decisions taken
unattended" in `status.md`, and carry on.

**CG-4 — No workspace path is written into a shared repository.** Carry the substance, not the
pointer.

**CG-5 — <a budget or stop condition, if this loop needs one>.**
