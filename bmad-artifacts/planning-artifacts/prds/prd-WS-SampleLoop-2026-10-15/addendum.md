# SampleLoop — PRD Addendum

Depth that belongs downstream rather than in [`prd.md`](prd.md): technology direction, data-shape consequences, and the commercial positions taken in the client's Technology Discussion. Architecture and solution-design work should start here.

Everything in §1 is **proposed and subject to client agreement** — the Technology Discussion is a draft for agreement, not an approved decision, and its decision record is unsigned.

---

## 1. Proposed technology direction

Carried from the Client Technology Discussion (14 October 2026, draft for agreement). The PRD deliberately states no technology; this is where the proposal lives.

| Area | Proposal | Purpose given | Point still to agree |
|---|---|---|---|
| User interface | React + TypeScript | Screens for staff and designers; interactive web experience | Responsive web for v1; no separate mobile app |
| Visual design | Tailwind CSS + shadcn/ui | Consistent forms, tables and controls, using the sample UI as reference | Approve visual direction; review prototype code before deciding what to reuse |
| Backend | Node.js + NestJS (TypeScript) | Lending rules, permissions and updates in one central service; same language as the frontend | One backend application for the pilot; business rules agreed separately |
| Database | PostgreSQL | Studios, sample pieces, loans, returns and history as related records | Centrally hosted with a defined backup arrangement |
| Database tooling | Prisma ORM | Developer access and controlled schema change | Supporting tool; versions checked for compatibility |
| Login and photo storage | Provider to be selected | Account protection; sample and damage photographs with controlled access | Login needs, account ownership, photo limits, provider costs |

**Stated rationale.** One web interface, one backend, one database — sized to keep development and support manageable for a six-staff showroom.

**Recorded alternative.** A Python or .NET backend remains open if existing systems or team experience make it a better fit. The Technology Discussion asks the team to confirm it can maintain the proposed stack before approval; that confirmation has not been recorded.

**Consequence for the pilot.** The existing sample UI is described as a demonstration using local browser data. A real release needs server-side authorisation, shared storage and server-side validation before it touches client data. That is a rebuild of the data layer, not a port — treat any reused prototype code as presentation only. The prototype is not present in this workspace (`Codebase/` is empty); see PRD §10 item 12.

---

## 2. Data-shape consequences of the requirements

Not architecture, but the modelling the PRD's vocabulary forces. Architecture should start from these, since getting any of them wrong makes the PRD's central requirements unimplementable.

- **Sample versus Sample Piece is load-bearing.** The brief's "some designs have several physical copies" is why availability, Holds, Loans, Conditions and Cases all attach to the *piece*, while catalogue attributes attach to the *design*. A model with a quantity column on Sample cannot express "this specific piece came back stained" and cannot support FR-33 piece history.
- **Loan Line is the unit of everything.** Partial return (FR-15), per-piece extension (FR-21), overdue (FR-22) and loss (FR-18) all operate on a single piece within a loan. A Loan without line-level state cannot do partial returns, which is the product's primary reason to exist.
- **Return Event is separate from Loan Line.** Several pieces come back together on one day, and several such occasions occur per loan. Collapsing return data onto the Loan Line loses "who took these three back, on what day"; collapsing it onto the Loan loses partiality.
- **The one-piece-one-place invariant** (NFR-7) — at most one open Loan Line and at most one Hold per Sample Piece — is the integrity rule the whole system rests on. It belongs in the database as a constraint, not only in service code, because the reservation path is contended (FR-7, NFR-1).
- **Hold is a first-class record, not a flag.** It has an owning Kit, a covered date range and an expiry (FR-8), and it must be visible when deciding an extension (FR-21).
- **Attribution is append-only** (FR-40, NFR-8). Handover, return, extension decision, charge, waiver and case resolution are a history, not mutable fields on a current-state row.
- **Charge and waiver coexist.** A waived charge retains its original amount (FR-28); waiver is a decision recorded against the amount, not a deletion of it.

---

## 3. Commercial and contractual position

From the Technology Discussion, preserved because it bounds what the delivery team may assume.

- Development is quoted separately from recurring hosting, database, photo storage, backup and support costs.
- No price and no paid subscription is approved by that document. Automated messaging or other paid services add charges that are not authorised — which is why PRD FR-24 produces drafts rather than sending messages.
- Agreement on the Technology Discussion confirms **technical direction only**. It does not approve budget, delivery date, or a completed software design.
- Exact versions and implementation details are to be documented after business requirements are agreed — i.e. after this PRD is accepted.
- Proposed account model: client-owned service accounts with developer access. Provider, hosting region and monthly budget are unanswered.

---

## 4. Decisions the client has not made

The Technology Discussion's decision record is unsigned and every row reads *Pending*. Reproduced here because several of them change the product, not just the infrastructure — those are mirrored into PRD §10.

| Item | Question as posed | Product impact |
|---|---|---|
| Hosting and ownership | Which provider, region, monthly budget? | Where designer contact data and photographs reside |
| Access and accounts | Who invites users; can designers see every loan in their studio? | PRD FR-32, FR-38 — assumed, not confirmed |
| Reminders | Copyable WhatsApp drafts, or automated sending? | PRD FR-24/FR-25 scope; cost; consent; template approval |
| Backups and recovery | Acceptable data loss, downtime, retention? | NFR-10 has no numeric target without this |
| Images and privacy | Allowed types, size limits, retention, access, deletion responsibility | PRD §6 Privacy; storage cost; FR-17 |
| Release and acceptance | Four-week pilot scope, budget, feedback availability, who accepts | Whether the PRD's MVP scope is deliverable as scoped |
| Support after launch | Who handles incidents, accounts, backups, updates; response expectations | Not a v1 feature, but shapes observability (NFR-11) |

**Sign-off state:** technology proposal not marked approved; client and technical representative signatures blank.

---

## 5. Source inputs

- `Docs/client/SampleLoop_Client_Requirements.md` — fictional client brief, initial request, version 1. Business problem, users, eight numbered requirement areas, worked example, practical expectations, pilot success criteria.
- `Docs/client/SampleLoop_Client_Technology_Discussion.md` — client discussion and decision record, 14 October 2026, draft for agreement.

Both originals are retained as `.docx` alongside the converted Markdown.
