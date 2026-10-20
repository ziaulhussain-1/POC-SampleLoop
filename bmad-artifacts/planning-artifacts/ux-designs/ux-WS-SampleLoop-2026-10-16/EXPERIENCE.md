---
name: SampleLoop
status: final
updated: 2026-10-16
sources:
  - ../../prds/prd-WS-SampleLoop-2026-10-15/prd.md
  - ../../prds/prd-WS-SampleLoop-2026-10-15/addendum.md
---

# SampleLoop — Experience Spine

Single-surface responsive web. shadcn/ui on React + TypeScript + Tailwind (addendum §1 — proposed, not client-approved). `DESIGN.md` is the visual identity reference and names the brand-layer override surface; this spine is the behaviour. Vocabulary is the PRD glossary (§3) verbatim — Sample, Sample Piece, Condition, Studio, Designer, Staff, Manager, Client Project, Kit, Hold, Loan, Loan Line, Handover, Return Event, Extension, Overdue, Case, Replacement Charge, Reminder Draft. No synonyms appear in any screen, label or message.

Both spines win on conflict with any mock in `mockups/`.

## Foundation

One responsive web application, three roles, one URL. Not a native app (PRD §7), no offline mode, no push.

**The mobile browser is a primary surface, not a fallback.** NFR-3 makes every Staff task completable on a phone — handover, return, condition, photograph, reminder draft. These are counter actions performed standing up with a designer's assistant waiting. The desktop layout is the one that adapts to the phone, never the reverse: where the two conflict, the phone wins and the desktop inherits the simplification.

**Three role surfaces, not one surface with hidden controls.** FR-37 requires server-side authorisation; the UI expresses the same split structurally so a Designer never sees a disabled Staff control and wonders what it does.

| Role | Lands on | Owns |
|---|---|---|
| Designer | Designer home | Their Studio's Kits, Loans, extension requests; catalogue browse |
| Staff | Staff dashboard | Reservation, handover, return, extensions, chasing |
| Manager | Staff dashboard + Manage | Everything Staff has, plus catalogue, Studios, users, charges and Cases |

A Manager's extra capability appears as additional navigation, not as controls that materialise inside Staff screens. `[ASSUMPTION: the Manager also works the counter (PRD §2.1), so the Manager's default landing surface is the Staff dashboard, not an admin console.]`

## Information Architecture

**Staff / Manager**

| Surface | Reached from | Purpose |
|---|---|---|
| Dashboard | App open, logo | Four figures: out, due back, overdue, unresolved Cases (FR-31) |
| Catalogue | Sidebar | Search Samples, date-aware availability, who holds what (FR-3, FR-4) |
| Sample detail | Catalogue row | Pieces, condition, availability, borrowing history (FR-33) |
| Kits | Sidebar, dashboard | All Kits filterable by state and collection date (FR-10) |
| Kit detail / Reserve | Kits row | Reserve, see unfulfilled Samples and alternatives (FR-7, FR-5) |
| Handover | Kit detail, collection list | Confirm what physically leaves (FR-11 – FR-14) |
| Loans | Sidebar | Open Loans and their Loan Lines |
| Loan detail / Return | Loans row, scan of Studio | Record a Return Event, assess Condition (FR-15 – FR-19) |
| Due back | Dashboard tile | Loan Lines due in a configurable window (FR-23) |
| Overdue & chase | Dashboard tile | Overdue Loan Lines grouped by Studio, Reminder Drafts (FR-22, FR-24, FR-25) |
| Extensions | Sidebar badge, dashboard | Pending extension requests, decided per Loan Line (FR-21) |
| Cases | Dashboard tile | Unresolved Cases, charge, waiver, resolution (FR-26 – FR-30) |
| Studio detail | Any Studio name | One Studio's open Loans, history, Cases, waivers, last reminder (FR-35) |
| Manage ▸ Samples | Sidebar (Manager) | Create, edit, retire Samples and Pieces (FR-1, FR-2) |
| Manage ▸ Studios | Sidebar (Manager) | Studios and WhatsApp contact details (FR-39) |
| Manage ▸ Users | Sidebar (Manager) | Invite, assign role and Studio, deactivate (FR-38) |

**Designer**

| Surface | Reached from | Purpose |
|---|---|---|
| Home | App open | Studio's open Loan Lines with due dates, pending Kits, pending extensions (FR-32) |
| Browse | Sidebar | Catalogue with availability for a chosen date (FR-3, FR-4, FR-5) |
| Kit builder | Browse "Add to kit", Home | Assemble, name, date and submit a Kit (FR-6) |
| My Kits | Sidebar | Own Studio's Kits and their states; cancel before collection (FR-9) |
| Loan detail | Home row | Loan Lines, due dates, request an Extension (FR-20) |

**Every studio name is a link for Staff and Manager, and inert text for a Designer** — a Designer sees nothing belonging to another Studio anywhere, including in alternative suggestions, availability and history (FR-4, FR-32).

Modal depth is one level. Handover, Return and Case resolution are **surfaces, not dialogs**: they are long, they are performed on a phone, and a dialog that can be dismissed by a stray tap is the wrong container for the action that makes the record match reality.

→ Composition reference: the six journey-screen mocks in [`mockups/`](mockups/README.md), published as a design canvas. Spines win on conflict.

## Voice and Tone

Microcopy. Brand posture lives in `DESIGN.md.Brand & Style`. English only (NFR-5), written for staff whose first language is not English, so: short sentences, no idiom, no humour at the point of an error.

| Do | Don't |
|---|---|
| "6 of 7 pieces leaving" | "Handover partially complete" |
| "FB-2214 / 2 is held for Noor Studio, collecting Mon 20 Oct" | "This item is unavailable" |
| "4 days overdue" | "Overdue since 12/10" |
| "Charge recorded: PKR 3,500" | "Billed", "Invoiced", "Paid", "Settled" |
| "Waived — long-standing account, first incident" | "Charge cancelled" |
| "Mehreen reminded this Studio today at 9:42" | "Reminder already sent" |
| "No piece free on Thu 22 Oct. Earliest back: Mon 20 Oct." | "Out of stock" |
| "Mark each piece usable, damaged or missing before saving." | "Please complete all required fields." |
| "Nothing overdue. Six pieces due back today." | "All caught up! 🎉" |

**Reminder Draft voice is a separate register** and belongs to the showroom, not to the product. It is written as the staff member would write it on WhatsApp: greeting, the sample names, the days, one ask, the showroom's name. No product branding, no link, no "sent via SampleLoop". The draft is a human's message that the product typed out for them.

> Assalam-o-Alaikum Ayesha — a quick reminder from Lahore Materials. Two samples from the Hassan Residence kit are past their return date: FB-2214 Linen Weave Oat (4 days) and FL-0881 Oak Herringbone (2 days). Could you send them back with your next collection? Thank you.

**Never, anywhere in the interface:** a word implying money moved (PRD §6), an exclamation mark in an error, an emoji in a system message, or the word "item" where the glossary says Sample or Sample Piece.

## Component Patterns

Behavioural. Visual specs live in `DESIGN.md.Components` or in shadcn defaults when inherited.

| Component | Use | Behavioural rules |
|---|---|---|
| Availability cell | Catalogue, kit builder | Resolves against the **selected collection date**, not today. Changing the date header re-evaluates every visible row. For Staff it reveals the holding Studio; for a Designer it never does (FR-4). |
| Date context bar | Catalogue, kit builder | A single persistent control naming the date availability is being judged for. Defaults to today; sticky while scrolling. The whole catalogue is *as of* that date, and saying so once beats a tooltip per row. |
| Piece chip | Everywhere a piece appears | Shows `REF / n`. Clicking opens that Piece's history (FR-33). Never collapses two pieces of one Sample into a count where the user is acting on a specific piece. |
| Line-item toggle | Handover, Return | Each Loan Line / held piece is independently included or excluded. Excluding states the consequence inline — "Hold released, returns to the pool". |
| Condition toggle | Return | Three-way, no default. Save is blocked while any included piece is unassessed, with the unassessed rows scrolled to and outlined (FR-16). |
| Sticky commit bar | Kit builder, Handover, Return, Extensions | Always visible. Shows the count that will commit ("Hand over 6 pieces"), never just "Confirm". Disabled state carries the reason beside it, not in a tooltip. |
| Unfulfilled banner | Kit detail after reserve | Names each Sample that got no piece, with up to five alternatives inline and their availability for the same date. Where none qualify, says so in words — never an empty list (FR-5). |
| Reminder Draft card | Overdue & chase | One per Studio, pre-written, with a single Copy action. Copying records the Studio as reminded and the card visibly settles into a reminded state without the row moving or the list re-sorting. |
| Case strip | Loan detail, Studio detail, Sample history | A persistent summary of an open Case: how it arose, age in days, charge state. Follows the piece everywhere it is mentioned. |
| Attribution line | Loan, Return Event, Case, Extension | `{typography.caption}`: who did it and when, present on every consequential record and never editable (FR-40). |
| Photo capture | Return, Case | Opens the device camera on mobile, file picker on desktop. Thumbnails appear immediately with a progress state; a failed upload never blocks saving the Return Event. |
| Export action | Any list surface | Exports exactly the rows and filters on screen, and says so: "Export 23 rows (current filters)" (FR-34). |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold load | Any list | shadcn `Skeleton` rows matching the real row height. No spinner. |
| Empty — nothing overdue | Overdue & chase | "Nothing overdue." Below it, the due-back list, because that is the next thing the staff member wants. Not a celebration. |
| Empty — no Cases | Cases | "No unresolved Cases." Link to resolved Case history. |
| Empty — new Studio | Studio detail | "No loans yet." Primary action: build a Kit for this Studio. |
| Empty — no search results | Catalogue | "No Sample matches 'oat linen'." Offers to clear the availability filter first, since that is the usual cause. |
| No piece available | Catalogue row, kit builder | Row stays visible and selectable-for-later, states the earliest expected return date, and offers alternatives (FR-4, FR-5). Never hidden — a Designer needs to know the design exists. |
| Partial reservation | Kit detail | Kit reserves for the remainder; unfulfilled Samples are listed above the held ones, not mixed in (FR-7). |
| Hold expiring today | Dashboard, Kits | Amber pill "Expires tonight" on every Kit whose collection date is today (FR-8). `[ASSUMPTION: PRD §10 Q1 — one-day grace. If the client answers differently, this pill's trigger and the dashboard's expiring group change; nothing else does.]` |
| Reservation lost a race | Reserve action | The action fails as a whole, names the piece and the competing Kit, and re-renders availability. Never a silent partial success (FR-7, NFR-1). |
| Loan partially returned | Loans, Loan detail | Loan stays open and stays in every list. Progress reads "4 of 6 returned", and the two open Loan Lines keep their own due dates and overdue state (FR-15). |
| Extension pending | Designer home, Loan Line | Pill "Extension requested". The line **continues to count as overdue** and says so: "Requested — still overdue until approved" (FR-20). |
| Collision on an extension | Extensions queue | The competing Hold and its collection date render inline on the decision row, before a decision is made (FR-21). |
| Already reminded today | Overdue & chase | Copy action disabled, replaced by "Mehreen reminded them at 9:42". Manager sees an Override with a required reason (FR-25). |
| Charge recorded, Case open | Case, Studio detail | "Charge recorded: PKR 3,500 · unresolved". Recording a charge never resolves a Case (FR-27). |
| Charge waived | Case, Studio history | Both values shown: "PKR 3,500 — waived (long-standing account, first incident)". The amount is never erased (FR-28). |
| Prior waivers exist | Case, before deciding | Inline on the Case: "This Studio has 2 prior waivers, PKR 6,200 total." Shown before the decision, not after (FR-28, UJ-6 edge case). |
| Retired Sample | Catalogue | Hidden from Designers entirely; visible to Staff with a "Retired" pill, and its open Loan Lines remain chaseable (FR-1). |
| Permission denied | Any | The surface does not exist in the navigation. No blocked screen, no greyed menu item (FR-37). |
| Session expired | Any | Sign-in sheet over the current surface; after signing in the user returns to exactly where they were, with unsaved transaction input retained (FR-36). |
| Save failed | Handover, Return | `Toast` (destructive): "Couldn't save the return. Nothing was recorded. Try again." Every line-item input is retained. Never a partial write. |

## Interaction Primitives

**Touch-first, keyboard-capable.** Staff work on a phone at the counter; Managers work on a laptop. Both get a complete surface.

- Every interactive element clears 44px on touch. Row-level actions are visible on touch, not hover-revealed.
- Search focuses with `/` on desktop. `Esc` closes the topmost sheet or dialog.
- Barcode scanning is explicitly out of scope (PRD §8.2), so **reference-code entry is the fast path**: the catalogue search field accepts a typed or pasted reference code and jumps straight to the Sample. `[NOTE FOR UX: PRD §10 Q11 — if pieces already carry printed codes, this field becomes the scan target in v2 with no layout change. Keep it the first focusable element on the catalogue surface.]`
- Transaction surfaces (Kit builder, Handover, Return) commit once, from the sticky bar. There is no autosave and no draft state — a half-recorded handover is worse than none.
- Destructive and irreversible actions confirm with a sentence naming the consequence: cancelling a Kit ("releases 7 Holds"), marking a piece missing, resolving a Case.
- Clipboard is a first-class interaction: the Reminder Draft copies in one action on both desktop and mobile, with a confirmation the staff member can see while already switching to WhatsApp (FR-24).

**Banned everywhere:** infinite scroll (paginate, because FR-34 exports what is on screen), hover-only affordances, nested modals, auto-refreshing a list while a staff member is acting on it (changes announce via `Toast` and wait for a manual refresh), and any animation longer than 150ms on a transaction surface.

## Accessibility Floor

Behavioural. Visual contrast lives in `DESIGN.md`.

- WCAG 2.2 AA across every surface, at the mobile and desktop layouts both.
- **No state is carried by colour alone.** Every status pill is a dot plus a word; the overdue row tint is accompanied by a day count; the Condition toggle reads its state as text.
- Screen reader announces the surface and its load: "Overdue, 4 Loan Lines across 3 Studios."
- The Condition toggle is a labelled radio group, not three buttons. Attempting to save with an unassessed piece moves focus to the first one and announces why.
- Tab order follows reading order; the sticky commit bar is reachable from the last line item, not stranded outside the flow.
- Photographs attached to a Return Event or Case accept an optional text note that serves as the description; where absent, the alt text names the piece and the Return Event date.
- Target sizes meet 2.2 AA (24px minimum) everywhere and SampleLoop's own 44px floor on touch.
- Text resizes to 200% without loss of function: at that size desktop tables adopt the mobile stacked-card layout.

## Responsive & Platform

| Breakpoint | Behaviour |
|---|---|
| `≥ lg` (1024px+) | Sidebar visible. List surfaces are full tables. Transaction surfaces put the commit summary in a right rail. Dashboard is a four-tile row. |
| `md` (768–1023px) | Sidebar collapses to icons. Tables keep their key columns; secondary columns move into an expandable row. Dashboard is 2×2. |
| `< md` | Sidebar becomes a `Sheet`. **Every table becomes stacked cards** with labels above values. The commit summary becomes a fixed bottom bar. Dashboard tiles stack; no horizontal scrolling anywhere (FR-31). |

Chrome, Edge and Safari, current versions, desktop and Android/iOS (NFR-4). Catalogue search and dashboard render their first page within 2 seconds at ~600 Samples / ~1,000 Pieces on a mid-range phone (NFR-2) — which is why the catalogue paginates, loads photographs lazily, and never blocks the row list on image loading.

## Inspiration & Anti-patterns

- **Lifted from library circulation systems:** the item-versus-copy distinction rendered consistently in the UI. A catalogue record and a physical copy are different objects, and every screen that acts on a copy shows the copy's identity. This is the single pattern SampleLoop cannot get wrong (addendum §2).
- **Lifted from point-of-sale:** the sticky commit bar with the count on it. The counter action is the moment of truth; the control for it is never scrolled away.
- **Lifted from shadcn:** the entire surface vocabulary. SampleLoop's design is what it adds to shadcn, which is a status language and two layout archetypes.
- **Rejected — a single unified "lending" screen.** The brief asks to "handle this in one place", and the dashboard is that place for *knowing*. Collapsing reserve, handover and return into one screen would fail NFR-6: three different physical moments, three different sets of hands, three screens.
- **Rejected — automated WhatsApp sending.** Out of scope (PRD §8.2), and the UI must not hint at it: no "Send" button greyed out, no "coming soon". The draft ends at Copy. `[NOTE FOR UX: keep the draft generation surface separable from any future send action — PRD §8.2 flags this as the most likely week-one request.]`
- **Rejected — notification bell / activity feed.** No email, no push (PRD §8.2). What needs attention is on the dashboard and in the sidebar badges, which is a smaller promise that the product can actually keep.
- **Rejected — a "mark Loan returned" shortcut.** It is exactly the spreadsheet behaviour the product exists to replace. Returns are per-piece, always, even when all pieces come back together; the fast path is a "select all" on the Return Event, not a Loan-level state change (FR-15, SM-2).
- **Rejected — adding fields to handover or return forms.** SM-C3 makes this an explicit counter-metric. Any proposal to improve record quality by adding a field at the counter is rejected by default.

## Key Flows

Named protagonists from PRD §2.3. Each flow's climax is the beat the surface must deliver.

### Flow 1 — Ayesha builds a kit for Thursday (UJ-1, Designer, laptop)

1. Ayesha signs in and lands on Designer home: her Studio holds three pieces, one due back Friday.
2. She opens **Browse** and sets the date context bar to **Thu 22 Oct**. Every availability cell now answers for Thursday, not today.
3. She filters material *Fabric* and colour family *Neutral*, then switches to *Flooring*. Each Sample card shows pieces available for Thursday in green and pieces on loan in slate.
4. She adds eight Samples to the Kit; a bottom bar counts them as she goes.
5. In the Kit builder she names the Client Project "Hassan Residence", collection Thu 22 Oct, return defaulting to Thu 29 Oct, and submits.
6. **Climax:** the confirmation does not say "request sent". It names **seven specific Sample Pieces now held for her** as piece chips, and separates out the one Sample with no piece free — showing its earliest return date and two alternatives in the same colour family that *are* free on Thursday. She leaves knowing she has seven real pieces, not a message in someone's unread list.
7. The Kit sits in *Reserved*; it appears on Thursday's collection list for Staff.

Edge: she sets collection to **today** and a piece is already out. The system does not hold it. The row states the expected return date and offers alternatives; it never shows a hold that does not exist.

### Flow 2 — Bilal hands over what actually leaves (UJ-2, Staff, counter phone)

1. 10:04, Thursday. The assistant arrives. Bilal opens the dashboard on his phone and taps **Collecting today → Hassan Residence**.
2. The Handover surface lists seven held pieces as line items, each a piece chip with its photograph thumbnail.
3. He inspects `FB-2214 / 2`, finds a frayed edge, and toggles it off. The row restates the consequence inline: *Hold released — returns to the available pool.* The sticky bar re-counts to **Hand over 6 pieces**.
4. He taps the collector field — pre-filled with "Ayesha Khan" — and types "Assistant (Ayesha's studio)". He adds the note "client meeting Thu, assistant collecting".
5. Due dates default to Thu 29 Oct for all six; he leaves them.
6. **Climax:** he taps **Hand over 6 pieces**. In one action the Kit becomes a Loan of six Loan Lines, the catalogue shows those six pieces as out, the seventh is available again, and the surface confirms exactly that — six out, one returned to the pool, one Sample flagged for the Manager to inspect. The record matches what physically left the building.

Failure: save fails → destructive `Toast`, nothing recorded, every toggle and note retained, one tap to retry.

### Flow 3 — Bilal takes back four of six, one damaged (UJ-3, Staff, counter phone)

1. Sunday. The assistant returns with four pieces. Bilal opens the Loan from **Loans** and taps **Record return**.
2. Six open Loan Lines are listed. He ticks the four physically on the counter; the two he does not tick stay visibly out, with their due dates.
3. Each ticked piece shows a Condition toggle with **nothing selected**. He marks three *usable*.
4. The fourth, `FB-2301 / 1`, a velvet, has a water stain. He marks it *damaged*; a photo control appears inline. He taps it, the phone camera opens, he takes one photograph, the thumbnail appears.
5. **Climax:** he saves. The three usable pieces are available to other Kits before the assistant has left the showroom — the catalogue says so immediately. The velvet is not in the pool, and a Case is now open against the Studio with the photograph attached. The Loan is **not** closed: it reads "4 of 6 returned", and the two outstanding Loan Lines keep their original due dates and remain on every chase list.

Failure: he tries to save with the velvet unassessed → save is blocked, focus moves to that row, and the message names the piece: "Mark FB-2301 / 1 usable, damaged or missing before saving."

### Flow 4 — Ayesha asks for a week; Hina sees the collision (UJ-4, Designer then Staff)

1. Ayesha's client postpones. From Designer home she selects the two still-out Loan Lines and taps **Request extension**, choosing Thu 5 Nov and giving the reason.
2. Both lines show "Extension requested" — and continue to show their overdue state, with "still overdue until approved" in words.
3. Hina opens **Extensions** and sees the request as two decision rows, one per Loan Line.
4. **Climax:** on the second row, before she has decided anything, the surface already tells her the collision: `FL-0881 / 1` is **held for Noor Studio, collecting Mon 20 Oct**. She approves the first line to Thu 5 Nov and declines the second with the note "promised to another studio Monday — please return by then".
5. Both decisions land in one place for Ayesha: one line has a new due date, the other has the original date and the note. The declined line appears on Hina's chase list if it is not back Monday morning.

### Flow 5 — Hina works the chase list before opening (UJ-5, Staff, 9:40am, laptop)

1. Hina opens the dashboard. Four tiles: **28 out**, **6 due back**, **4 overdue**, **2 Cases**.
2. She taps **4 overdue**. The list is grouped by Studio — three Studios — each group showing its Loan Lines, days overdue in tabular figures, the requesting Designer, and when the Studio was last reminded.
3. Each group carries a Reminder Draft card, already written: the Sample names, the days, the showroom's own words. No editing needed.
4. **Climax:** she taps **Copy** on the first card, switches to the WhatsApp thread she already has with that designer, pastes, sends. Back in SampleLoop the card has settled into "You reminded them at 9:41" without the list re-sorting under her. Three Studios, three messages, four minutes, no scrolling back through a week of chat.
5. The fourth Studio's card is already disabled: "Mehreen reminded them at 9:12." One designer who is slow on two loans is not chased twice in one morning.

Manager variant: Farah can override the suppression, which requires a reason recorded against the Studio.

### Flow 6 — Farah settles the damaged velvet (UJ-6, Manager, laptop)

1. Farah opens **Cases**: two unresolved, sorted by age. The velvet is 2 days old with the photograph attached.
2. She opens it. The Case names the Studio, the Loan, the Loan Line and the piece; the photograph is full-width; the attribution line says Bilal recorded it on Sunday.
3. Inline, before she decides: **"This Studio has 2 prior waivers, PKR 6,200 total"** and its loan history for the quarter.
4. She records a Replacement Charge of PKR 3,500. The Case does not resolve — it now reads "Charge recorded: PKR 3,500 · unresolved".
5. She waives it, reason: "long-standing account, first incident". The amount stays visible beside the waiver.
6. She resolves the Case with the outcome **retired** for the piece rather than returning it to the pool.
7. **Climax:** the Case leaves her unresolved list carrying the decision, the reason and her name. The Sample's piece count drops by one; because it was the only piece, the Sample now shows as unavailable to every Designer, immediately, without anyone editing the catalogue.

Nowhere in this flow does the interface suggest money was collected (PRD §6).

## Open Items

Carried from PRD §10. Each names what changes in the UI if the client answers differently; none blocks the spines.

| # | Question | What moves in the UI |
|---|---|---|
| 1 | Hold expiry window (FR-8) | The "Expires tonight" pill trigger and the dashboard's expiring group. Layout unchanged. |
| 2 | Studio-wide Designer visibility (FR-32) | If answered *no*, Designer home filters to the signed-in Designer and the Studio-level framing on every Designer surface changes. This is the largest of the six. |
| 3 | Reminder cadence and channel (FR-24, FR-25) | Suppression copy ("today" → "this week") and, if automated sending is in scope, a Send action the spine currently forbids. |
| 4 | Replacement charge source (FR-27) | A per-Sample default would pre-fill the Case charge field. Field stays; its empty state changes. |
| 5 | Photograph policy | Upload limits, allowed types, and whether a delete control exists on a Case photograph at all. |
| 6 | Pilot acceptance | Nothing in the UI; affects what is built first. |
| 10 | Colour taxonomy (FR-5) | The colour filter's vocabulary and the alternatives' grouping. |
| 11 | Printed reference codes (§8.2) | If codes exist, the catalogue search field becomes a scan target with no layout change. |
| 12 | Existing demonstration UI | Not present in this workspace; if provided, reconcile as presentation-only reference (addendum §1). |
