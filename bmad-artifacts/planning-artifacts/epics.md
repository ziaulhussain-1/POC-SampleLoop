---
status: draft
stepsCompleted: [1]
inputDocuments:
  - prds/prd-WS-SampleLoop-2026-10-15/prd.md
  - prds/prd-WS-SampleLoop-2026-10-15/addendum.md
  - architecture/architecture-WS-SampleLoop-2026-10-16/ARCHITECTURE-SPINE.md
  - ux-designs/ux-WS-SampleLoop-2026-10-16/DESIGN.md
  - ux-designs/ux-WS-SampleLoop-2026-10-16/EXPERIENCE.md
---

# SampleLoop - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for SampleLoop, decomposing the requirements from the PRD, the UX design contract and the Architecture spine into implementable stories.

Vocabulary throughout is the PRD §3 glossary, verbatim: **Sample**, **Sample Piece**, **Condition**, **Studio**, **Designer**, **Staff**, **Manager**, **Client Project**, **Kit**, **Hold**, **Loan**, **Loan Line**, **Handover**, **Return Event**, **Extension**, **Overdue**, **Case**, **Replacement Charge**, **Reminder Draft**. No synonym appears in any story.

## Requirements Inventory

### Functional Requirements

**Sample Catalogue and Availability**

- FR-1: Manager can create, edit and retire a Sample with reference code, material, supplier, colour, description and photograph.
- FR-2: Manager can record how many physical Sample Pieces exist for a Sample, and add or remove pieces individually.
- FR-3: Staff, Manager and Designer can search Samples by reference code, material, supplier and colour, and filter to those with a piece available.
- FR-4: Staff, Manager and Designer can see whether a Sample has a piece available for a given collection date.
- FR-5: System offers alternative Samples when a requested Sample has no piece available.

**Kit Requests and Reservations**

- FR-6: Designer or Staff can create a Kit containing one or more Samples, labelled with a Client Project, a collection date and an expected return date.
- FR-7: Staff can reserve a Kit, placing a Hold on one Sample Piece per requested Sample.
- FR-8: System releases Holds that are not collected.
- FR-9: Designer (own Studio, before collection) or Staff can cancel a Kit.
- FR-10: Staff and Manager see all Kits; a Designer sees their own Studio's Kits.

**Collection and Handover**

- FR-11: Staff can confirm which of a Kit's held Sample Pieces are actually leaving, creating a Loan.
- FR-12: Staff can record who physically collected the Kit and add handover notes.
- FR-13: System assigns a due date to every Loan Line at handover; Staff can override.
- FR-14: Staff can add an unheld, available Sample Piece to a Kit at the point of handover.

**Returns and Condition**

- FR-15: Staff can record a Return Event covering any subset of a Loan's open Loan Lines.
- FR-16: Staff must record a Condition for each Sample Piece in a Return Event.
- FR-17: Staff can attach one or more photographs to a Sample Piece in a Return Event.
- FR-18: Staff can mark an open Loan Line as *missing* without the piece being present.
- FR-19: Staff can add a note to a Return Event.

**Extensions and Overdue Follow-up**

- FR-20: Designer can request a new due date for one or more of their Studio's open Loan Lines, with a reason.
- FR-21: Staff can approve or decline an Extension per Loan Line, with a note.
- FR-22: Staff and Manager can see every overdue Loan Line, grouped by Studio.
- FR-23: Staff and Manager can see Loan Lines due back today and within a configurable window.
- FR-24: Staff can generate copyable Reminder Draft text for one Studio's overdue Loan Lines.
- FR-25: System prevents the same Studio being offered a Reminder Draft more than once per day.

**Damage and Loss Cases**

- FR-26: System opens a Case when a Sample Piece is recorded *damaged* or *missing*.
- FR-27: Manager can record a Replacement Charge amount on a Case.
- FR-28: Manager can waive a recorded charge with a required reason.
- FR-29: Manager can resolve a Case, recording the outcome for the Sample Piece.
- FR-30: Staff and Manager can see all unresolved Cases.

**Dashboard, History and Export**

- FR-31: Staff and Manager see a dashboard of Sample Pieces currently out, Loan Lines due back soon, overdue Loan Lines and unresolved Cases.
- FR-32: Designer sees their Studio's current Loans, due dates and Kits.
- FR-33: Staff and Manager can see the borrowing history of a Sample and of an individual Sample Piece.
- FR-34: Staff and Manager can export the outstanding-loan list to CSV.
- FR-35: Staff and Manager can see one Studio's open Loans, history and Cases on a single screen.

**Accounts, Roles and Audit**

- FR-36: Every user signs in before seeing any data.
- FR-37: System enforces the Designer, Staff and Manager roles.
- FR-38: Manager can invite a user to a role and, for Designers, to a Studio; and can deactivate a user.
- FR-39: Manager can create and edit Studios with name and contact details.
- FR-40: System records the acting user and timestamp on handover, return, extension decision, charge, waiver and case resolution.
- FR-41: A user can reset their own password without contacting the showroom.

### NonFunctional Requirements

- NFR-1: Correct behaviour with 15 simultaneous users; no lost updates when two Staff act on the same Kit or Loan. Reservation and handover are the contended paths and must be serialised.
- NFR-2: Catalogue search and dashboard load within 2 seconds at ~600 Samples, ~1,000 Sample Pieces, ~80 Studios, on showroom hardware and a mid-range mobile browser.
- NFR-3: Every Staff task — handover, return, condition, photograph, Reminder Draft — is completable on a mobile browser. Responsive web; no native application.
- NFR-4: Current versions of Chrome, Edge and Safari on desktop and Android/iOS.
- NFR-5: English only in v1; text not hard-coded in a way that would make later localisation a rewrite.
- NFR-6: A new Staff member completes a handover and a partial return unaided after a single demonstration.
- NFR-7: A Sample Piece is on at most one open Loan Line and under at most one Hold at any time, enforced in the data layer.
- NFR-8: Loan, return, case and attribution records are not hard-deleted. Corrections supersede rather than erase.
- NFR-9: Authorisation enforced server-side on every request; passwords never stored in recoverable form; photographs not publicly addressable by guessable URL.
- NFR-10: Showroom business hours are the service window; a short overnight maintenance window is acceptable. Formal RTO/RPO targets pending.
- NFR-11: Application errors recorded with enough context to diagnose them without reproducing the user's session.

### Additional Requirements

From the Architecture spine. Each cites the governing AD.

**No starter template is specified.** The spine names a stack but no scaffold, so Epic 1 Story 1 creates the repository structure by hand: a monorepo `sampleloop/` holding `apps/api` (NestJS), `apps/web` (React + Vite) and `packages/contracts`.

- AR-1: Seven backend modules, each owning its own tables: `catalogue`, `kits`, `lending`, `followup`, `cases`, `reporting` (read-only), `accounts`. Cross-module access only through the owning module's application service. (AD-1, AD-15)
- AR-2: Module internals are `domain/` · `application/` · `infrastructure/` · `http/`; `domain/` imports nothing from the other three. (AD-1)
- AR-3: Two partial unique indexes carry NFR-7 — one open `loan_line` per `sample_piece` where `resolved_at IS NULL`, one active `hold` per `sample_piece` where `released_at IS NULL`. Prisma cannot generate partial indexes, so both are hand-written SQL migrations. (AD-4)
- AR-4: The application database role is granted INSERT and SELECT only on the event tables (`loan`, `return_event`, `return_line`, `extension_decision`, `case_event`); the grant ships as a migration. (AD-7)
- AR-5: Reservation, handover and return each run as one transaction at READ COMMITTED with `SELECT … FOR UPDATE` on candidate `sample_piece` rows in ascending piece-id order; one retry on unique violation, then a structured conflict. No partial commits. (AD-5)
- AR-6: Every repository method touching Studio-owned data takes a required `StudioScope` argument. Designer responses use their own DTOs with no holder field, not conditional redaction. (AD-6)
- AR-7: Collection, expected-return and due dates are SQL `DATE`; everything else `timestamptz`. Overdue, due-soon and Hold expiry evaluate against the current date in Asia/Karachi through one shared function in `shared/clock/`. (AD-8)
- AR-8: Photographs never enter PostgreSQL. A `PhotoStore` port exposes `put`, `signedRead`, `delete`; reads are short-lived signed URLs minted only after the owning Case or Return Event's authorisation check passes; type and size caps enforced server-side before the put, as configuration. (AD-9)
- AR-9: An `AuthProvider` port. The provider is unselected (Technology Discussion, Pending), so the adapter is swappable by configuration.
- AR-10: Reminder Draft text is a pure function of (Studio, overdue Loan Lines, date) with no I/O and no transport dependency. Suppression is a `studio_reminder` record keyed by Studio and showroom-local date. Nothing in the backend sends a message. (AD-10)
- AR-11: Availability is computed at query time from Condition, active Holds and open Loan Lines. No `is_available` column and no cache. (AD-11)
- AR-12: Replacement Charge is an integer in minor units with an ISO-4217 currency code. Waiver is a separate `(waived_at, waived_by, waiver_reason)` set that never overwrites the amount. No payment, invoice, ledger or balance concept anywhere. (AD-12)
- AR-13: Every lending state change is a POST to a named sub-resource — `/kits/{id}/reservation`, `/kits/{id}/handover`, `/loans/{id}/return-events`, `/extension-requests/{id}/decisions`, `/cases/{id}/resolution`. No PATCH writes a state or status field. (AD-13)
- AR-14: One error envelope `{ code, message, conflict? }` where `conflict` names the competing entity, its id, a human label and the relevant date. Conflict codes are a closed enumeration shared through `packages/contracts`.
- AR-15: UUIDv7 surrogate primary keys. A Sample Piece's business identity is `(sample.reference_code, piece_number)` under its own unique constraint; no sequential integer is exposed.
- AR-16: Structured JSON logging with request id and actor id. Never logged: signed photo URLs, Studio or Designer contact numbers, authentication tokens.
- AR-17: Configuration by environment variable only; no secret in the repository; provider adapters selected by configuration.
- AR-18: Three environments (local, staging, production) from one codebase differing only in configuration. One API process is correct for the pilot. Managed PostgreSQL 18, nightly backup as the floor; no RTO/RPO number exists yet.
- AR-19: The stack is **proposed, not client-approved**. AD-2, AD-3, AD-4, AD-7, AD-8, AD-11, AD-12 and AD-15 survive a change of backend language; AD-1's module mapping and AD-4's Prisma mechanics are the only stack-specific calls. (AD-14)
- AR-20: Pinned stack: Node.js 26 LTS, TypeScript 5.x, NestJS 12.x, Prisma ORM 7.x, PostgreSQL 18, React 19.2.x, Tailwind CSS 4.3.x, shadcn/ui (copied in), Vite. Minors pinned at install.

### UX Design Requirements

From `DESIGN.md` (visual identity) and `EXPERIENCE.md` (behaviour), read as one contract. Both spines win over any mockup.

**Design tokens and type**

- UX-DR1: Implement the colour token set: chrome (`background #F8FAFC`, `surface #FFFFFF`, `ink #0F172A`, `ink-muted #64748B`, `hairline #E2E8F0`), one action colour (`primary #2563EB`), and the six status colours with their `-bg` pairs — available, held, out, due-soon, overdue, damaged. One primary action per surface; the action colour is never used for status.
- UX-DR2: Implement the IBM Plex Sans ramp — display 24/600, heading 18/600, body 14/400, body-strong 14/600, label 12/500, caption 12/400, numeric 14/500, metric 30/600. Minimum rendered size 12px anywhere.
- UX-DR3: Apply `font-variant-numeric: tabular-nums` to every date, day count, piece count and currency amount. Render dates as `14 Oct` within the current year and `14 Oct 2026` otherwise; never `14/10/26`.
- UX-DR4: Implement the radius scale (4 / 6 / 8 / full) and the density tokens (`row-desktop 40px`, `row-mobile 56px`, `touch-target 44px`, gutters 24/16px). Pill shape is reserved for status.
- UX-DR5: Implement the dark-mode token set as a meaning-identical variant, with contrast re-verified.

**Components**

- UX-DR6: **Status pill** — six variants, each a 6px dot plus the word, on its matching `-bg`. No seventh variant.
- UX-DR7: **Piece chip** — renders a Sample Piece identifier (`FB-2214 / 2`) in tabular figures with a hairline border; clicking opens that piece's history.
- UX-DR8: **Sample card** — 4:3 photograph never square-cropped, reference code, name, then *N available* in green and *N on loan* in slate.
- UX-DR9: **Metric tile** — the whole tile is the link target, with a 3px left band in the tile's status colour and the figure in `metric` type.
- UX-DR10: **Condition toggle** — three-way segmented control (*usable* / *damaged* / *missing*), minimum 44px tall, implemented as a labelled radio group, with **no default selection**.
- UX-DR11: **Data table row** — 40px on desktop, collapsing below `md` to a stacked card with labels above values.
- UX-DR12: **Overdue row** — tinted background plus a 3px left border; the only full-row tint in the product, always accompanied by a day count.
- UX-DR13: **Sticky commit bar** — always visible on Kit builder, Handover, Return and Extensions; labelled with the count that will commit ("Hand over 6 pieces"), with any disabled reason beside it, not in a tooltip.
- UX-DR14: **Date context bar** — one persistent, sticky control naming the date availability is judged for; changing it re-evaluates every visible row.
- UX-DR15: **Availability cell** — resolves against the selected date, not today; reveals the holding Studio to Staff and Manager and never to a Designer.
- UX-DR16: **Unfulfilled banner** — names each Sample that got no piece, with up to five alternatives inline and their availability for the same date; states the absence in words rather than showing an empty list.
- UX-DR17: **Reminder Draft card** — one per Studio, pre-written, single copy action; copying settles the card without the list re-sorting.
- UX-DR18: **Case strip** — a persistent open-Case summary (how it arose, age in days, charge state) that follows the piece everywhere it is mentioned.
- UX-DR19: **Attribution line** — caption-weight "who did it and when" on every consequential record, never editable.
- UX-DR20: **Photo capture** — device camera on mobile, file picker on desktop, thumbnails with progress; a failed upload never blocks saving the Return Event.
- UX-DR21: **Export action** — labelled with the row count and that filters apply ("Export 23 rows (current filters)").

**Behaviour, layout and accessibility**

- UX-DR22: Build three role-distinct surfaces rather than one surface with hidden controls; a surface the role cannot reach is absent from navigation, with no blocked screen and no greyed menu item.
- UX-DR23: Handover, Return and Case resolution are surfaces, not dialogs. Modal depth is one level. Transaction surfaces commit once from the sticky bar; no autosave, no draft state.
- UX-DR24: Implement the State Patterns table — skeleton rows at real row height, named empty states, "4 of 6 returned" partial-return progress, "still overdue until approved" on a pending Extension, the already-reminded state, charge-recorded-but-unresolved, charge-waived-with-amount-retained, and prior-waiver disclosure before the decision.
- UX-DR25: Implement responsive behaviour — sidebar visible at `lg`, icons at `md`, a sheet below; every table becomes stacked cards below `md`; commit summary becomes a fixed bottom bar; no horizontal scrolling on the dashboard.
- UX-DR26: Meet the accessibility floor — WCAG 2.2 AA, no state carried by colour alone, surface announcement on navigation, focus moved to the first unassessed piece when a save is blocked, tab order matching reading order with the sticky bar reachable from the last line item, and 200% text reflow adopting the stacked layout.
- UX-DR27: Apply the microcopy register from the Voice and Tone table, including the separate Reminder Draft register, which is the showroom's voice: no product branding, no link, no "sent via SampleLoop". Nothing in the interface may imply money moved.
- UX-DR28: Banned patterns to enforce in review — infinite scroll, hover-only affordances, nested modals, auto-refreshing a list while Staff are acting on it, and any animation over 150ms on a transaction surface.

### FR Coverage Map

{{requirements_coverage_map}}

## Epic List

{{epics_list}}
