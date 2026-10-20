---
title: SampleLoop
status: draft
created: 2026-10-15
updated: 2026-10-15
---

# PRD: SampleLoop
*Working title — confirm with the client.*

## 0. Document Purpose

This PRD is for the product manager, the delivery team, and the downstream BMad workflows that build on it (UX, architecture, epics and stories). It describes **what** SampleLoop must do and for whom; it does not choose technology. The proposed stack, the rationale behind it and the open commercial decisions live in [`addendum.md`](addendum.md) alongside this file.

It is distilled from two client inputs, both held in this workspace at `Docs/client/`: the **Client Requirements** brief (business problem, eight numbered requirement areas, pilot expectations) and the **Client Technology Discussion** (proposed stack, seven pending decisions, cost and scope position). Where the brief was silent and a decision was needed to make a requirement testable, the inference is tagged inline as `[ASSUMPTION]` and collected in §11. Those tags are not decoration — each one is a question the client still has to answer, and §10 lists the ones that block downstream work.

Structure: a Glossary (§3) fixes the vocabulary, and every journey, requirement and metric uses those terms verbatim. Features (§4) are grouped behaviourally with Functional Requirements nested under them, numbered globally FR-1 … FR-41 so epics and stories can reference them even if features are later reorganised. User Journeys are numbered UJ-1 … UJ-6 and referenced by ID from the FRs they realise.

---

## 1. Vision

A showroom in Lahore lends out pieces of fabric, flooring and wall finish so that interior designers can put real material in front of their own clients. Roughly 600 physical samples circulate among 80 studios, handled by six staff. The lending itself is the business relationship — a designer who cannot get the right sample on the right day presents someone else's material instead.

Today that circulation is tracked in a spreadsheet and chased through WhatsApp. The two artefacts drift apart within a day. Nobody can answer "who has this piece right now" without scrolling a conversation; samples come back in pieces over several days and the spreadsheet has one row per loan, so a partial return either gets lost or collapses the whole record; and a designer can arrive to collect a sample that walked out an hour earlier.

SampleLoop replaces that pair with one web application that knows where every physical piece is. Staff reserve, hand over, take back and chase from a single screen. Designers see what is actually available before they ask for it, and can see what their studio is currently holding. The showroom manager sees what is out, what is late and what came back broken. The ambition for the first release is deliberately narrow: not to optimise the business, but to make its current state continuously knowable — and to keep WhatsApp, which the designers already answer, as the channel for chasing.

---

## 2. Target User

### 2.1 Jobs To Be Done

**Showroom staff** (six people, counter and floor)
- Tell a designer *now*, without leaving the counter, whether a sample can go out today.
- Hand over a kit that may differ from what was requested, and have the record match what physically left.
- Record four pieces coming back on Tuesday and three more the following week, without losing track of either group.
- Produce today's chase list without rereading a week of WhatsApp.

**Showroom manager** (one person, also covers staff duties) `[ASSUMPTION: one of the six staff holds the Manager role and also works the counter; the role itself is not limited to one person.]`
- Keep the catalogue honest as samples are added, retired, damaged or lost.
- See at a glance what is overdue and what is unresolved.
- Decide what a lost piece costs the studio — and waive it for a relationship worth keeping.
- Know who issued a sample and who took it back, when a disagreement comes up.

**Designer** (≈80 studios, several designers per studio)
- See what is available before promising a material palette to a client.
- Ask for a set of samples for a named project, with the date of the client meeting.
- Keep three pieces for another week without a phone call.
- See what my studio currently holds and what is due back.

### 2.2 Non-Users (v1)

- **Suppliers.** They are recorded as a field on a Sample. They do not get accounts and are not notified of anything.
- **The designer's own end client.** Never a user. They exist in the system only as the Client Project name a Kit is labelled with.
- **Other showroom branches.** The first release serves one location; there is no concept of a second site, inter-branch transfer or shared catalogue.
- **Accounts or finance staff.** Charges are recorded in SampleLoop; payment is settled outside it.

### 2.3 Key User Journeys

> **UJ-1. Ayesha builds a kit for Thursday's client meeting.**
> Ayesha is a designer at a three-person studio; she is specifying a living room and needs warm neutrals in both fabric and flooring. Signed in on her laptop, she searches the catalogue by material and colour, and the results show which Samples have a piece free on Thursday. She adds eight to a Kit, names it after the client project, sets collection for Thursday morning and return for the following Thursday, and submits it. The screen confirms that seven pieces are now held for her and that one Sample has no piece free — with two alternatives in the same colour family offered beside it. **Climax:** she leaves knowing she has seven real pieces reserved, not a request sitting in someone's unread messages. **Resolution:** the Kit is in *Reserved* state; showroom staff see it on the collection list for Thursday. **Edge case:** if she sets collection for today and a piece is already out, the system does not hold it — it shows the expected return date so she can decide whether to wait or take an alternative.

> **UJ-2. Bilal hands over what actually leaves the building.**
> Bilal is on the counter when Ayesha's assistant arrives Thursday at 10. He opens the Kit, which lists seven held pieces. One of the seven has a frayed edge he is unwilling to send out, so he removes it and the handover goes out with six. He records that the assistant — not Ayesha — collected, notes "client meeting Thu, assistant collecting", and confirms. **Climax:** the Kit becomes a Loan of six Loan Lines, each with a due date seven days out, and the catalogue immediately shows those six pieces as out. **Resolution:** the piece he pulled is back in the available pool; the Sample he rejected is flagged for the manager to inspect.

> **UJ-3. Bilal takes back four of six, and one is damaged.**
> Three days later the assistant returns with four pieces. Bilal opens the Loan and ticks the four that are physically on the counter. Three he marks usable; the fourth, a velvet, has a water stain, so he marks it damaged and photographs it. **Climax:** the three usable pieces are available to lend again before the assistant has left the showroom; the velvet is not, and a Damage Case is open against the studio. **Resolution:** the Loan stays open with two Loan Lines still out, both still due on the original date. The Loan is not "returned" and does not disappear from anyone's list.

> **UJ-4. Ayesha asks for another week; Hina sees the collision.**
> Ayesha's client postponed. From her studio's loan list she selects the two pieces still out and requests seven more days, giving the reason. Hina, on staff, sees the request in her queue — and sees that one of the two pieces is held for a different studio's Kit collecting Monday. **Climax:** Hina approves the extension for one piece and declines the other with a note that it is promised Monday, and both decisions reach Ayesha in one place. **Resolution:** one Loan Line has a new due date; the other keeps the original and appears on Hina's chase list if it is not back Monday morning.

> **UJ-5. Hina works the follow-up list before the showroom opens.**
> It is 9:40am. Hina opens the dashboard and sees four Loan Lines overdue across three studios, and six more due back today. For each overdue studio she opens the reminder draft — the sample names, the days overdue, already written in the tone the showroom uses — copies it, and sends it in the WhatsApp thread she already has open with that designer. **Climax:** three messages, four minutes, no scrolling back through old chats to reconstruct who has what. **Resolution:** each studio is marked as reminded today, and the system will not offer the same studio another draft until tomorrow, so one designer who is slow on two separate loans does not get chased twice in a morning.

> **UJ-6. Farah settles the damaged velvet.**
> Farah manages the showroom. The damage case from UJ-3 has been sitting in her unresolved list for two days with the photograph attached. The studio is one of her best accounts and the stain is minor. She records a replacement charge of PKR 3,500, then waives it with the reason "long-standing account, first incident", and marks the piece retired rather than returning it to the pool. **Climax:** the case leaves her unresolved list with the decision, the reason and her name attached to it. **Resolution:** the Sample's piece count drops by one; if that was its only piece, the Sample is now unavailable and shows as such to designers. **Edge case:** if the same studio damages a second piece within the quarter, the waiver history is visible on the case before she decides.

---

## 3. Glossary

Downstream workflows and readers must use these terms exactly. No synonyms appear elsewhere in this document.

- **Sample** — a catalogue entry for one design: reference code, material, supplier, colour, photograph, description. A Sample is a *design*, not a physical object. One Sample has one or more Sample Pieces.
- **Sample Piece** — one individual physical copy of a Sample. This is the thing that is reserved, handed over, returned, damaged and lost. Carries its own condition and availability. Identified by the Sample reference code plus a piece number.
- **Condition** — the state of a Sample Piece: *usable*, *damaged*, or *missing*. Only *usable* pieces can be lent.
- **Studio** — a design practice that borrows from the showroom. Has one or more Designers. Charges and loan history attach to the Studio, not to the individual Designer. `[ASSUMPTION: a Designer who moves to another Studio does not carry loan or charge history with them.]`
- **Designer** — a user belonging to exactly one Studio. Can browse, request and view that Studio's loans.
- **Staff** — a showroom employee who runs day-to-day lending: reservations, handovers, returns, extensions, reminders.
- **Manager** — a showroom employee with Staff rights plus catalogue management and charge decisions. One person holds this role; the role is not limited to one.
- **Client Project** — the designer's own engagement that a Kit is assembled for. A free-text label, not an entity with its own lifecycle.
- **Kit** — a named set of Samples requested together for one Client Project, with a collection date and an expected return date. Moves through *Requested* → *Reserved* → *Collected* → (closed when its Loan closes), or *Cancelled*.
- **Hold** — a Sample Piece set aside for a specific Kit so that no other Kit can take it. Created when a Kit is reserved; released on handover, cancellation or expiry.
- **Loan** — what actually left the showroom for one Kit, created at Handover. Contains one or more Loan Lines. Closes when every Loan Line is resolved.
- **Loan Line** — one Sample Piece within a Loan. Carries its own due date and its own return state, which is what makes partial returns and per-piece extensions possible. This is the unit of overdue, of extension and of return.
- **Handover** — the act of issuing a Kit's pieces, recording who collected them and any notes. Converts a Kit to a Loan.
- **Return Event** — one occasion on which one or more Loan Lines come back, on a given date, recorded by a named Staff member. A Loan may have several Return Events.
- **Extension** — a request to move the due date of one or more Loan Lines, approved or declined per Loan Line.
- **Overdue** — a Loan Line whose due date has passed and which has not been returned.
- **Case** — an open issue against a Studio raised when a Sample Piece returns *damaged* or is recorded *missing*. Carries an optional replacement charge, an optional waiver with reason, and a resolution.
- **Replacement Charge** — a monetary amount recorded on a Case. Recorded in SampleLoop; collected outside it.
- **Reminder Draft** — pre-written follow-up text for one Studio's overdue Loan Lines, produced for a Staff member to copy into WhatsApp.

---

## 4. Features

### 4.1 Sample Catalogue and Availability

**Description:** The catalogue is the spine of the product — every other feature resolves to a Sample Piece being free or not. The manager maintains Samples; the distinction between a Sample (the design) and its Sample Pieces (the physical copies) is what lets the showroom lend the same design to two studios at once when it owns two copies, and refuse when it owns one. Staff and designers search the same catalogue; designers see availability, staff see availability plus who holds what. Realises UJ-1. Initial data entry is manual by showroom staff — roughly 600 Samples — so the create form has to be fast and forgiving. `[ASSUMPTION: the showroom does not use barcodes or RFID today; pieces are identified visually by their printed reference code. Confirm — if codes are already printed on the physical pieces, a scan-to-identify flow would materially speed up handover and return.]`

**Functional Requirements:**

#### FR-1: Maintain Samples
Manager can create, edit and retire a Sample with reference code, material, supplier, colour, description and photograph.

**Consequences (testable):**
- Reference code is unique across the catalogue; attempting to save a duplicate is rejected with the conflicting Sample shown.
- Retiring a Sample with pieces currently on Loan is allowed, and those Loan Lines remain open and chaseable.
- A retired Sample is hidden from designer search but remains visible in Staff search and in all history.
- Staff (non-manager) can view every field but cannot create, edit or retire.

#### FR-2: Maintain Sample Pieces
Manager can record how many physical pieces exist for a Sample, and add or remove pieces individually.

**Consequences (testable):**
- Each Sample Piece has an identifier derived from the Sample reference code plus a sequential piece number, unique and stable for the piece's lifetime.
- A piece can be removed from the catalogue only when it is not on Loan and not held; the attempt is refused with the blocking Loan or Kit named.
- Removing the last usable piece of a Sample leaves the Sample in the catalogue, shown as unavailable.

#### FR-3: Search the catalogue
Staff, Manager and Designer can search Samples by reference code, material, supplier and colour, and filter to those with a piece available.

**Consequences (testable):**
- A search returning up to 600 Samples renders its first page within 2 seconds on showroom hardware and on a mobile browser.
- Results show, per Sample, the count of pieces currently available and the count on loan.
- Partial and case-insensitive matching on reference code and material.

#### FR-4: See availability for a date
Staff, Manager and Designer can see whether a Sample has a piece available for a given collection date.

**Consequences (testable):**
- A piece counts as available for a date if it is *usable*, not held for another Kit covering that date, and not on an open Loan Line expected back after that date.
- Where no piece is available, the expected return date of the earliest-returning piece is shown.
- Availability shown to a Designer never reveals which Studio holds a piece; availability shown to Staff and Manager does.

#### FR-5: Suggest alternatives
System offers alternative Samples when a requested Sample has no piece available. Realises UJ-1.

**Consequences (testable):**
- Alternatives are drawn from the same material and nearest colour, limited to Samples with a piece available for the requested date.
- At most five alternatives are offered; where none qualify, the absence is stated rather than shown as an empty list.
- `[ASSUMPTION: "nearest colour" means same colour-family field value, not perceptual matching from the photograph. A colour-family taxonomy must be agreed with the showroom during catalogue entry.]`

---

### 4.2 Kit Requests and Reservations

**Description:** A Kit is how a request becomes a promise. The brief's central complaint — designers arriving for samples that are already gone — is solved here: reserving a Kit places a Hold on specific Sample Pieces, and a held piece is invisible to everyone else's availability check. Either a Designer or a Staff member can build a Kit; a Designer's Kit arrives as *Requested* and a Staff member reserves it, while a Staff member building a Kit at the counter can reserve it in the same action. Realises UJ-1, UJ-4.

**Functional Requirements:**

#### FR-6: Create a Kit
Designer or Staff can create a Kit containing one or more Samples, labelled with a Client Project, a collection date and an expected return date.

**Consequences (testable):**
- Collection date cannot be in the past; expected return date cannot precede the collection date.
- Expected return date defaults to collection date plus 7 days and can be overridden.
- A Kit with no Samples cannot be submitted.
- A Designer can only create a Kit for their own Studio.

#### FR-7: Reserve a Kit
Staff can reserve a Kit, placing a Hold on one Sample Piece per requested Sample. Realises UJ-1.

**Consequences (testable):**
- Reserving selects a specific *usable*, unheld Sample Piece per Sample; the Kit then names the pieces, not just the designs.
- Where no piece is available for a Sample, the Kit is reserved for the remainder and that Sample is marked unfulfilled with alternatives offered per FR-5.
- A held Sample Piece is excluded from availability (FR-4) for every other Kit.
- Reservation is atomic across the Kit: two Staff reserving Kits that compete for the same last piece cannot both succeed.

#### FR-8: Hold expiry
System releases Holds that are not collected.

**Consequences (testable):**
- A Hold expires at the end of the day after its Kit's collection date, returning the piece to the available pool.
- Expiring Holds moves the Kit to *Cancelled* and records the reason as expiry.
- Staff see expiring Holds on the dashboard the day they are due to be collected.
- `[ASSUMPTION: a one-day grace period after the collection date. The brief does not state how long a reservation should survive an absent designer; the showroom should confirm, as too long starves the pool and too short breaks trust.]`

#### FR-9: Cancel a Kit
Designer (own Studio, before collection) or Staff can cancel a Kit.

**Consequences (testable):**
- Cancelling releases every Hold immediately.
- A collected Kit cannot be cancelled; its Loan must be returned instead.
- Cancellation records who cancelled and when.

#### FR-10: View Kits
Staff and Manager see all Kits; a Designer sees their own Studio's Kits.

**Consequences (testable):**
- Kits are filterable by state and by collection date.
- The collection list for a given day shows every Kit in *Reserved* state due to be collected that day.

---

### 4.3 Collection and Handover

**Description:** Handover is the moment the record either matches reality or starts drifting from it — the brief is explicit that a kit may go out with fewer samples than requested. The handover screen therefore asks what is *physically on the counter*, not what was asked for, and the Loan is built from the answer. The person collecting is often not the person who requested, which matters when a studio disputes a loan weeks later. Realises UJ-2.

**Functional Requirements:**

#### FR-11: Confirm handover
Staff can confirm which of a Kit's held Sample Pieces are actually leaving, creating a Loan. Realises UJ-2.

**Consequences (testable):**
- Every held piece is listed and individually included or excluded; excluded pieces have their Hold released immediately and return to the available pool.
- Confirming with zero pieces included is refused; the Kit should be cancelled instead.
- The Loan records the issuing Staff member and the handover timestamp.
- The Kit moves to *Collected* and the catalogue shows every included piece as out within the same action.

#### FR-12: Record the collector
Staff can record who physically collected the Kit and add handover notes.

**Consequences (testable):**
- Collector is captured as free text with the requesting Designer offered as the default.
- Handover notes are retained on the Loan and visible in the Loan's history for its lifetime.

#### FR-13: Set due dates
System assigns a due date to every Loan Line at handover; Staff can override.

**Consequences (testable):**
- Default due date is the Kit's expected return date; where absent, handover date plus 7 days.
- Staff can set a different due date for the whole Loan or for an individual Loan Line before confirming.
- `[ASSUMPTION: the brief says "regular customers sometimes keep samples longer" — this is handled by an explicit per-loan override at handover plus extensions (FR-20), not by a per-Studio default loan period. Confirm the showroom does not want a standing longer period for named Studios.]`

#### FR-14: Add a piece at handover
Staff can add an unheld, available Sample Piece to a Kit at the point of handover.

**Consequences (testable):**
- The added piece joins the Loan with the same due date rules as the rest.
- The addition is attributed to the Staff member and distinguishable in history from originally requested pieces.

---

### 4.4 Returns and Condition

**Description:** The feature the spreadsheet cannot do. Pieces come back in instalments, and the record has to survive that: a Return Event covers whichever Loan Lines are physically present, the rest stay out and stay chaseable, and a usable piece is lendable again the moment it is recorded — not when the whole Loan eventually closes. Condition is assessed per piece, because one stained velvet should not hold up five clean pieces. Realises UJ-3, UJ-6.

**Functional Requirements:**

#### FR-15: Record a partial return
Staff can record a Return Event covering any subset of a Loan's open Loan Lines. Realises UJ-3.

**Consequences (testable):**
- Loan Lines not included in the Return Event remain open, keep their due dates, and continue to appear on overdue and due-today lists.
- A Loan with any open Loan Line is not closed and is not removed from the outstanding list.
- A Loan closes automatically when its last open Loan Line is resolved by return, loss or write-off.
- Several Return Events against one Loan on different dates are each retained with their own date and recording Staff member.

#### FR-16: Assess condition on return
Staff must record a Condition for each Sample Piece in a Return Event. Realises UJ-3.

**Consequences (testable):**
- Condition is one of *usable*, *damaged*, *missing*; a Return Event cannot be saved with any included piece unassessed.
- A piece recorded *usable* becomes available to other Kits immediately on save.
- A piece recorded *damaged* or *missing* does not return to the available pool and opens a Case (FR-26).

#### FR-17: Attach a return photograph
Staff can attach one or more photographs to a Sample Piece in a Return Event.

**Consequences (testable):**
- Photographs are attached to the Sample Piece within that Return Event, and remain visible on the resulting Case and in the piece's history.
- Capture from a mobile browser camera is supported.

#### FR-18: Record a piece as missing without a return
Staff can mark an open Loan Line as *missing* without the piece being present.

**Consequences (testable):**
- The Loan Line is resolved, stops appearing as overdue, and opens a Case.
- The action records the Staff member and a required reason.

#### FR-19: Return notes
Staff can add a note to a Return Event.

**Consequences (testable):**
- The note is retained against the Return Event and shown in the Loan history.

---

### 4.5 Extensions and Overdue Follow-up

**Description:** Chasing is where staff time actually goes, and the brief is specific about the constraint: follow-up happens on WhatsApp, and the same person must not be pestered repeatedly. The first release does not send messages — it prepares them. A Staff member gets a written draft naming the right samples and the right number of days, copies it, and sends it from the phone the designer already replies to. That keeps the showroom's existing relationship intact and avoids committing the client to a paid messaging provider before they have decided to (see §10). Extensions are decided per Loan Line, because the answer genuinely differs per piece when another studio is waiting. Realises UJ-4, UJ-5.

**Functional Requirements:**

#### FR-20: Request an extension
Designer can request a new due date for one or more of their Studio's open Loan Lines, with a reason. Realises UJ-4.

**Consequences (testable):**
- The request names specific Loan Lines, not whole Loans.
- An extension can be requested on an already-overdue Loan Line.
- A Loan Line with a pending extension request continues to count as overdue until the request is approved.

#### FR-21: Decide an extension
Staff can approve or decline an extension per Loan Line, with a note. Realises UJ-4.

**Consequences (testable):**
- Approval sets the new due date on that Loan Line only; other Loan Lines in the same request and the same Loan are unaffected.
- Declining retains the original due date and requires a note, which is visible to the requesting Designer.
- Before deciding, the Staff member sees any Hold on that Sample Piece for an upcoming Kit, with the competing Kit's collection date.
- Every decision records the deciding Staff member and timestamp.

#### FR-22: Overdue list
Staff and Manager can see every overdue Loan Line, grouped by Studio. Realises UJ-5.

**Consequences (testable):**
- A Loan Line becomes overdue at the start of the day after its due date.
- The list shows days overdue, Sample, Studio, the Designer who requested, and the date the Studio was last reminded.
- The list is sortable by days overdue and filterable by Studio.

#### FR-23: Due-back list
Staff and Manager can see Loan Lines due back today and within a configurable window.

**Consequences (testable):**
- Default window is the next 3 days; the window is adjustable in the view.

#### FR-24: Generate a reminder draft
Staff can generate copyable reminder text for one Studio's overdue Loan Lines. Realises UJ-5.

**Consequences (testable):**
- The draft names every overdue Sample for that Studio, the days overdue, and the showroom contact, in one message.
- The draft is copyable to the clipboard in one action from both desktop and mobile browsers.
- Generating a draft records the Studio as reminded, with date and Staff member.

#### FR-25: Reminder suppression
System prevents the same Studio being offered a reminder draft more than once per day. Realises UJ-5.

**Consequences (testable):**
- Where a Studio was already reminded today, the draft action is disabled and shows who reminded them and when.
- A Manager can override the suppression with a reason.
- `[ASSUMPTION: "without repeatedly bothering the same person" is implemented as one reminder per Studio per calendar day, covering all of that Studio's overdue lines in a single message. Confirm the cadence — weekly may suit this relationship better than daily.]`

---

### 4.6 Damage and Loss Cases

**Description:** A Case is what a damaged or missing piece becomes so that it does not quietly disappear. The brief asks for two things the spreadsheet cannot hold: a charge the manager can waive for a valued customer, and a visible list of what still needs attention. Payment is explicitly outside the system, so a Case tracks the *decision*, not the money. Realises UJ-6.

**Functional Requirements:**

#### FR-26: Open a Case
System opens a Case when a Sample Piece is recorded *damaged* or *missing*. Realises UJ-3, UJ-6.

**Consequences (testable):**
- The Case is attached to the Studio, the Loan, the Loan Line and the Sample Piece, and carries over any photographs from the Return Event.
- A Case opens in *unresolved* state and appears on the Manager's unresolved list until resolved.
- Staff can also open a Case manually against a Studio's Loan Line.

#### FR-27: Record a replacement charge
Manager can record a replacement charge amount on a Case. Realises UJ-6.

**Consequences (testable):**
- The amount is recorded with its currency and the Manager's name.
- Recording a charge does not resolve the Case.
- `[ASSUMPTION: replacement charge is entered by the Manager per Case rather than derived from a stored replacement value on the Sample. A per-Sample default would reduce typing but requires the showroom to value 600 samples before launch — see §10.]`

#### FR-28: Waive a charge
Manager can waive a recorded charge with a required reason. Realises UJ-6.

**Consequences (testable):**
- The waiver retains the original amount alongside the waived state — the number is not erased.
- Reason is mandatory and free text.
- Prior waivers for the same Studio are visible on the Case before the decision is made.
- Staff cannot waive.

#### FR-29: Resolve a Case
Manager can resolve a Case, recording the outcome for the Sample Piece. Realises UJ-6.

**Consequences (testable):**
- Resolution requires an outcome for the piece: returned to the pool as *usable*, retired from the catalogue, or recorded as permanently *missing*.
- Returning a piece to the pool makes it immediately available to other Kits.
- Retiring the last piece of a Sample leaves the Sample unavailable but present in history.
- A resolved Case leaves the unresolved list and remains in the Studio's history.

#### FR-30: Unresolved case list
Staff and Manager can see all unresolved Cases.

**Consequences (testable):**
- Shows Studio, Sample, how the Case arose, age in days, and whether a charge has been recorded.
- Sortable by age.

---

### 4.7 Dashboard, History and Export

**Description:** The single screen the brief asks for — "handle this situation in one place and understand what still needs action". The dashboard answers four questions on open: what is out, what is due back, what is late, and what is broken. Sample history answers the fifth, the one that currently needs a WhatsApp archaeology session: where has this piece been. Realises UJ-5, UJ-6.

**Functional Requirements:**

#### FR-31: Dashboard
Staff and Manager see a dashboard of Sample Pieces currently out, Loan Lines due back soon, overdue Loan Lines and unresolved Cases. Realises UJ-5.

**Consequences (testable):**
- Each of the four figures links through to the corresponding filtered list.
- Figures reflect activity recorded in the same session without a manual refresh.
- The dashboard is usable on a mobile browser without horizontal scrolling.

#### FR-32: Designer home
Designer sees their Studio's current Loans, due dates and Kits.

**Consequences (testable):**
- Shows open Loan Lines with due dates, pending Kits and pending extension requests.
- A Designer sees nothing belonging to another Studio anywhere in the interface.
- `[ASSUMPTION: a Designer sees all of their Studio's loans, including those requested by colleagues. The Technology Discussion raises this as an open question; studio-wide visibility is assumed because loans and charges attach to the Studio.]`

#### FR-33: Sample history
Staff and Manager can see the borrowing history of a Sample and of an individual Sample Piece.

**Consequences (testable):**
- History lists every Loan, Studio, handover date, return date, Condition on return and any Case, newest first.
- History survives the Sample being retired.

#### FR-34: Export outstanding loans
Staff and Manager can export the outstanding-loan list to CSV.

**Consequences (testable):**
- The export contains one row per open Loan Line with Sample reference code, Studio, Designer, handover date, due date and days overdue.
- The export reflects the filters applied to the list on screen.
- The file opens in Excel with correct column separation and UTF-8 characters intact.

#### FR-35: Studio view
Staff and Manager can see one Studio's open Loans, history and Cases on a single screen.

**Consequences (testable):**
- Shows open Loan Lines, unresolved Cases, waiver history and last reminder date.

---

### 4.8 Accounts, Roles and Audit

**Description:** Three roles with genuinely different surfaces: a Designer sees one Studio's world, Staff run lending, a Manager additionally owns the catalogue and the money decisions. The brief also asks to keep a record of who issued samples and who took them back — not a general audit log, but attribution on the actions that cause disputes. Designers are invited rather than self-registering, because the showroom decides who borrows.

**Functional Requirements:**

#### FR-36: Authenticate
Every user signs in before seeing any data.

**Consequences (testable):**
- No catalogue, loan or studio data is reachable without an authenticated session.
- Sessions expire after inactivity and sign-in is usable on a mobile browser.

#### FR-37: Roles
System enforces the Designer, Staff and Manager roles.

**Consequences (testable):**
- Designer cannot reach catalogue maintenance, charges, other Studios' data, or any Staff list.
- Staff cannot create or retire Samples, record or waive charges.
- Manager has every Staff capability plus catalogue maintenance and charge decisions.
- Authorisation is enforced server-side, not only by hiding controls.

#### FR-38: Invite and deactivate users
Manager can invite a user to a role and, for Designers, to a Studio; and can deactivate a user.

**Consequences (testable):**
- A deactivated user cannot sign in; their historical attributions remain intact and attributed.
- A Designer belongs to exactly one Studio.
- `[ASSUMPTION: the Manager invites all users, Staff and Designers alike. The Technology Discussion lists "who invites users" as pending.]`

#### FR-39: Maintain Studios
Manager can create and edit Studios with name and contact details.

**Consequences (testable):**
- Contact details include the WhatsApp number used for follow-up.
- A Studio with open Loans or unresolved Cases cannot be deleted.

#### FR-40: Action attribution
System records the acting user and timestamp on handover, return, extension decision, charge, waiver and case resolution.

**Consequences (testable):**
- Attribution is visible on the Loan, the Return Event and the Case to Staff and Manager.
- Attribution cannot be edited after the fact.

#### FR-41: Password reset
A user can reset their own password without contacting the showroom.

**Consequences (testable):**
- Reset is self-service via the user's registered email.

---

## 5. Cross-Cutting NFRs

- **NFR-1 Concurrency.** Correct behaviour with 15 simultaneous users; no lost updates when two Staff act on the same Kit or Loan. Reservation and handover are the contended paths and must be serialised (FR-7).
- **NFR-2 Responsiveness.** Catalogue search and dashboard load within 2 seconds at the stated data volume (≈600 Samples, ≈1,000 Sample Pieces, ≈80 Studios) on showroom hardware and on a mid-range mobile browser over the showroom's connection.
- **NFR-3 Mobile browsers.** Every Staff task — handover, return, condition, photograph, reminder draft — is completable on a mobile browser. The product is responsive web; there is no native application.
- **NFR-4 Browser support.** Current versions of Chrome, Edge and Safari on desktop and Android/iOS. `[ASSUMPTION: no Internet Explorer or legacy Android browser requirement.]`
- **NFR-5 Language.** English only in v1, with no Urdu or right-to-left requirement. Text is not hard-coded in a way that would make later localisation a rewrite.
- **NFR-6 Learnability.** A new Staff member completes a handover and a partial return unaided after a single demonstration. The pilot is four weeks and training time is not budgeted.
- **NFR-7 Data integrity.** A Sample Piece is on at most one open Loan Line and under at most one Hold at any time. This invariant is enforced in the data layer, not only in application code.
- **NFR-8 Durability.** Loan, return, case and attribution records are not hard-deleted. Corrections supersede rather than erase.
- **NFR-9 Security.** Authorisation enforced server-side on every request; passwords never stored in recoverable form; photographs not publicly addressable by guessable URL.
- **NFR-10 Availability.** Showroom business hours are the service window; a short overnight maintenance window is acceptable. Formal RTO/RPO targets are pending (§10).
- **NFR-11 Observability.** Application errors are recorded with enough context to diagnose them without reproducing the user's session.

---

## 6. Constraints and Guardrails

**Privacy**
- Photographs may incidentally capture a showroom or a designer's premises; they are visible only to authenticated users and only on the Sample Piece, Case and history they belong to.
- Designer contact details, including WhatsApp numbers, are visible to Staff and Manager only, and never to another Studio.
- Retention and deletion responsibility for photographs is unresolved and is a pre-launch decision (§10).

**Cost**
- The first release commits the client to no paid messaging service. Reminders are drafts for a human to send (FR-24), which is a deliberate guardrail: automated WhatsApp sending requires a business API, per-message cost and template approval, and the Technology Discussion explicitly defers that decision.
- Photograph storage is the one usage-driven cost in the system; a per-upload size cap is required before launch.

**Operational**
- Catalogue entry for ~600 Samples is manual showroom work and is on the critical path to the pilot. It is not a development task, but the pilot cannot start without it.
- SampleLoop records charges; it never takes payment. Nothing in the interface may imply a payment has been collected.

---

## 7. Non-Goals (Explicit)

- **Not a payments product.** No online payment, no invoicing, no ledger, no reconciliation. A Case records what was decided, not what was paid.
- **Not a logistics product.** No delivery, courier booking or in-transit tracking. Samples are collected from and returned to the counter.
- **Not a procurement product.** No supplier ordering, stock replenishment or purchase history. Suppliers are a field, not a feature.
- **Not a native mobile app.** Responsive web only; no app store presence, no push notifications, no offline mode.
- **Not a recommendation engine.** Alternatives (FR-5) are a deterministic catalogue filter on material and colour. No learned ranking, no AI suggestion.
- **Not a messaging platform.** SampleLoop does not send, receive or archive WhatsApp messages in v1. It writes text that a person sends.
- **Not multi-branch.** One showroom, one catalogue, one location. No inter-branch transfer.
- **Not a CRM.** No sales pipeline, no campaign, no marketing to designers.

---

## 8. MVP Scope

### 8.1 In Scope

- Sample and Sample Piece catalogue with manual entry, search and date-aware availability (FR-1 – FR-5).
- Kit creation by Designer or Staff, reservation with Holds, expiry and cancellation (FR-6 – FR-10).
- Handover recording what physically left, who collected it, and per-line due dates (FR-11 – FR-14).
- Partial returns across multiple Return Events, per-piece condition and photographs (FR-15 – FR-19).
- Per-line extension requests and decisions; overdue and due-back lists; copyable WhatsApp reminder drafts with daily suppression (FR-20 – FR-25).
- Damage and loss Cases with replacement charge, waiver and resolution (FR-26 – FR-30).
- Dashboard, designer home, sample history, Studio view and CSV export (FR-31 – FR-35).
- Three roles, invitations, attribution on consequential actions (FR-36 – FR-41).

### 8.2 Out of Scope for MVP

- **Automated WhatsApp sending.** Deferred to v2 pending provider, cost and consent decisions. `[NOTE FOR PM: this is the item most likely to be asked for the week after launch, because drafting is visibly one step short of sending. Keep the reminder text generation separable from its delivery so adding a sender later is not a rewrite.]`
- **Barcode or QR identification of pieces.** Deferred to v2. `[NOTE FOR PM: if the showroom already prints reference codes on pieces, revisit this before build — it is the single largest speed-up available to handover and return, and it is cheap if codes exist.]`
- **Per-Sample replacement values.** Deferred; charges are typed per Case (FR-27). Requires the showroom to value the catalogue.
- **Forward booking beyond one Hold per piece.** A piece can be held for one upcoming Kit, not queued for several. Deferred to v2.
- **Designer self-registration.** Invitation only.
- **Reporting beyond the CSV export** — no utilisation analytics, no supplier performance, no revenue reporting.
- **Urdu or any non-English interface.**
- **Email notification of any kind.** Password reset (FR-41) is the only transactional email.
- Online payments, delivery tracking, supplier purchasing, native apps and AI recommendation, per the client brief.

---

## 9. Success Metrics

The pilot is four weeks with six staff; these are observational measures taken at the showroom, not instrumented analytics.

**Primary**
- **SM-1 — Locating a holder.** A Staff member can say which Studio holds a given Sample Piece in under 30 seconds without opening WhatsApp, in 9 of 10 attempts. Validates FR-31, FR-33, FR-35.
- **SM-2 — Partial returns stay accounted for.** At the end of the pilot, zero Loans exist in which a piece was physically returned but the Loan Line is still open, and zero closed Loans have an unaccounted piece. Validates FR-15, FR-16.
- **SM-3 — Failed collections fall.** Collections where a designer arrives and a reserved sample is unavailable drop to at most one per fortnight, from the current baseline. Validates FR-7, FR-8. `[ASSUMPTION: the current rate is not measured; a baseline must be taken in week one or this metric is unverifiable.]`

**Secondary**
- **SM-4 — The chase list is a morning routine.** A Staff member prepares and sends the day's follow-ups in under 5 minutes. Validates FR-22, FR-24.
- **SM-5 — Nothing rots.** No Case sits unresolved for more than 14 days during the pilot. Validates FR-29, FR-30.
- **SM-6 — Adoption is real, not performed.** Every loan handed over during weeks 3 and 4 of the pilot was recorded in SampleLoop at the counter, not reconstructed into it later from the spreadsheet. Validates FR-11.

**Counter-metrics (do not optimise)**
- **SM-C1 — Reminder volume.** More reminders sent is not better. If reminders per Studio per week rises while overdue days do not fall, the follow-up design is annoying designers rather than retrieving samples. Counterbalances SM-4.
- **SM-C2 — Catalogue completeness versus the pilot date.** Do not delay the pilot to reach 600 entered Samples. A pilot running on the 150 most-borrowed Samples teaches more than a complete catalogue two weeks late. Counterbalances SM-3.
- **SM-C3 — Fields per screen.** Do not add fields to the handover or return form to improve record quality. Every field added at the counter is paid for in abandoned records, which costs more than the field is worth. Counterbalances SM-2 and SM-6.

---

## 10. Open Questions

Items 1–6 block downstream work and should be resolved before architecture and UX begin. Items 7–12 can be settled during build.

1. **Hold expiry window** (FR-8). How long does a reservation survive a designer who does not arrive? Assumed one day after the collection date.
2. **Studio-wide visibility for Designers** (FR-32). Can a Designer see loans requested by colleagues in the same Studio? Raised as pending in the Technology Discussion; assumed yes.
3. **Reminder cadence and channel** (FR-24, FR-25). Daily per Studio, as assumed? And is the client content to stay with copyable drafts for v1, or is automated sending a pilot requirement — which changes cost, provider selection and consent handling?
4. **Replacement charge source** (FR-27). Typed per Case, or a stored replacement value per Sample? The latter requires valuing ~600 Samples before launch.
5. **Photograph policy.** Permitted types, size cap, retention period, who may delete, and who is responsible. Listed as pending in the Technology Discussion and needed before any storage provider is chosen.
6. **Pilot acceptance.** Who is authorised to accept the pilot, what scope constitutes acceptance, and is the four-week target compatible with manual catalogue entry running in parallel?
7. **Backup and recovery targets.** Acceptable data loss, acceptable downtime, retention period (Technology Discussion, pending).
8. **Hosting, region and account ownership** (Technology Discussion, pending). Also governs where photographs and designer contact data reside.
9. **Support after launch.** Incident handling, account support, updates, support period (Technology Discussion, pending).
10. **Colour taxonomy** (FR-5). What colour-family vocabulary does the showroom use, and is it stable enough to drive alternative suggestions?
11. **Printed reference codes.** Do physical pieces already carry their reference code, and would scanning be viable later (§8.2)?
12. **Existing sample UI.** The Technology Discussion refers to a demonstration UI built on local browser data. It is not present in this workspace (`Codebase/` is empty). Is it available for reference, and is any of it intended for reuse?

---

## 11. Assumptions Index

Every inference made in the absence of a client statement. Each needs confirmation; those that are also phase-blocking appear in §10.

1. **§4.1 / FR-5** — "Nearest colour" for alternatives means a shared colour-family field value, not perceptual matching from photographs; a colour taxonomy must be agreed during catalogue entry.
2. **§4.1** — The showroom does not use barcodes or RFID; pieces are identified visually by printed reference code.
3. **§4.2 / FR-8** — Holds expire at the end of the day following the collection date.
4. **§4.3 / FR-13** — Longer loans for regular customers are handled by per-loan override and extensions, not by a standing per-Studio loan period.
5. **§4.5 / FR-25** — "Without repeatedly bothering the same person" means one reminder per Studio per calendar day, covering all that Studio's overdue lines in one message.
6. **§4.6 / FR-27** — Replacement charges are typed per Case rather than derived from a stored per-Sample replacement value.
7. **§4.7 / FR-32** — A Designer sees all of their Studio's loans, including those requested by colleagues.
8. **§4.8 / FR-38** — The Manager invites all users, both Staff and Designers.
9. **§5 / NFR-4** — No legacy browser support is required.
10. **§9 / SM-3** — No baseline exists for failed collections; one must be taken in week one of the pilot.
11. **§2.1** — Six staff share one Manager role holder, who also performs Staff duties. The role is not technically limited to one person.
12. **§3** — Charges and loan history attach to the Studio rather than to the individual Designer, so a designer changing studios does not carry history with them.
