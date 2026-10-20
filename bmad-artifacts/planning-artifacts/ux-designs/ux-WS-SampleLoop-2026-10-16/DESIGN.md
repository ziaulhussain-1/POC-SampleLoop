---
name: SampleLoop
description: Lending-desk software for a Lahore interior-materials showroom. shadcn/ui on React + TypeScript + Tailwind; this DESIGN.md specifies the brand-layer delta and the status colour language only.
status: final
updated: 2026-10-16
sources:
  - ../../prds/prd-WS-SampleLoop-2026-10-15/prd.md
  - ../../prds/prd-WS-SampleLoop-2026-10-15/addendum.md
colors:
  # Brand overrides on top of shadcn defaults. Unlisted tokens
  # (background, foreground, muted, muted-foreground, popover, card,
  # border, input, ring) inherit from shadcn.
  primary: '#2563EB'
  primary-foreground: '#FFFFFF'
  background: '#F8FAFC'
  surface: '#FFFFFF'
  ink: '#0F172A'
  ink-muted: '#64748B'
  hairline: '#E2E8F0'

  # Status language. These six carry meaning and are never decorative.
  status-available: '#15803D'
  status-available-bg: '#F0FDF4'
  status-held: '#6D28D9'
  status-held-bg: '#F5F3FF'
  status-out: '#475569'
  status-out-bg: '#F1F5F9'
  status-due-soon: '#B45309'
  status-due-soon-bg: '#FFFBEB'
  status-overdue: '#B91C1C'
  status-overdue-bg: '#FEF2F2'
  status-damaged: '#9F1239'
  status-damaged-bg: '#FFF1F2'

  # Dark mode brand layer.
  primary-dark: '#60A5FA'
  primary-foreground-dark: '#0B1220'
  background-dark: '#0B1220'
  surface-dark: '#111A2E'
  ink-dark: '#E2E8F0'
  hairline-dark: '#1E293B'
typography:
  # Single family throughout. IBM Plex Sans (shadcn's ramp swapped for IBM Plex Sans'
  # tabular figures, which the loan and overdue tables depend on).
  display:
    fontFamily: 'IBM Plex Sans'
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  heading:
    fontFamily: 'IBM Plex Sans'
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: 'IBM Plex Sans'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-strong:
    fontFamily: 'IBM Plex Sans'
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.5'
  label:
    fontFamily: 'IBM Plex Sans'
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  caption:
    fontFamily: 'IBM Plex Sans'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  numeric:
    fontFamily: 'IBM Plex Sans'
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    note: 'font-variant-numeric: tabular-nums. Mandatory on every date, day-count, piece count and currency amount.'
  metric:
    fontFamily: 'IBM Plex Sans'
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
    note: 'Dashboard tiles only. tabular-nums.'
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  # shadcn / Tailwind 4-based scale inherited. Named tokens below are
  # SampleLoop-specific and exist because density is a requirement.
  row-desktop: 40px
  row-mobile: 56px
  touch-target: 44px
  gutter-desktop: 24px
  gutter-mobile: 16px
components:
  status-pill:
    radius: '{rounded.full}'
    fontSize: '{typography.label.fontSize}'
    fontWeight: '{typography.label.fontWeight}'
    paddingInline: '8px'
    paddingBlock: '2px'
    note: 'Always dot + text. Colour alone never carries the state.'
  piece-chip:
    radius: '{rounded.sm}'
    fontFamily: '{typography.numeric.fontFamily}'
    border: '1px solid {colors.hairline}'
    note: 'Renders a Sample Piece identifier, e.g. FB-2214 / 2.'
  sample-card:
    background: '{colors.surface}'
    radius: '{rounded.lg}'
    border: '1px solid {colors.hairline}'
    note: 'Photograph fills the top at 4:3, never cropped square.'
  metric-tile:
    background: '{colors.surface}'
    radius: '{rounded.lg}'
    border: '1px solid {colors.hairline}'
    foreground: '{colors.ink}'
    note: 'Entire tile is the link target. Accent band on the left edge in the tile status colour.'
  condition-toggle:
    radius: '{rounded.md}'
    minHeight: '{spacing.touch-target}'
    note: 'Three-way segmented control: usable / damaged / missing. No default selection.'
  data-table-row:
    minHeight: '{spacing.row-desktop}'
    borderBottom: '1px solid {colors.hairline}'
    note: 'Collapses to a stacked card at < md, minHeight {spacing.row-mobile}.'
  overdue-row:
    background: '{colors.status-overdue-bg}'
    borderLeft: '3px solid {colors.status-overdue}'
    note: 'The only row treatment that tints a whole row.'
---

## Brand & Style

SampleLoop is the lending desk of a materials showroom, rendered as software. It is used at a counter, standing, often one-handed on a phone, by six people who will touch it forty times a day for four weeks before anyone asks them whether they like it. The aesthetic posture follows from that and from nothing else: **the interface is chrome, the material is the content.**

So the surface is deliberately quiet. Neutral slate, one blue that means *act*, a six-colour status language that means *state*, and no third voice. Where a photograph of a fabric or a flooring sample is on screen, it is the brightest thing on screen; everywhere else the product recedes into legible grey. This is not minimalism as taste — it is the only way a status pill still reads as urgent on the hundredth loan row of the morning.

SampleLoop inherits shadcn/ui wholesale (addendum §1). This file specifies the brand-layer delta: one primary colour, the status palette, an IBM Plex Sans ramp with tabular figures, tighter corners, and seven SampleLoop-specific components. The shadcn components that ship as-is — Button, Dialog, Sheet, Command, Popover, Tabs, Toast, Select, Checkbox, Separator — are the contract. Customising them is against the brand discipline, not an improvement to it.

One deliberate tension to hold: PRD §6 forbids the interface implying that money has changed hands, and PRD NFR-6 expects a new staff member to be productive after one demonstration. Both push the same direction — fewer surfaces, plainer language, no ornament that has to be learned.

## Colors

Three layers, and nothing outside them.

**Neutral chrome.** `{colors.background}` (`#F8FAFC`) is the app canvas; `{colors.surface}` (`#FFFFFF`) is every card, table and sheet that sits on it. `{colors.ink}` (`#0F172A`) is primary text, `{colors.ink-muted}` (`#64748B`) is every label, timestamp and secondary line, `{colors.hairline}` (`#E2E8F0`) is every divider. Four values do all the structural work.

**One action colour.** `{colors.primary}` (`#2563EB`) means *this is the thing to press*. Primary buttons, the active nav item, focus rings, links. It is never used for status, never for a chart, never decoratively. A screen with two blue buttons on it has a design bug.

**Six status colours, each with a meaning fixed in the glossary.** These are the only other colours in the product and they are load-bearing:

| Token | Means | Where it appears |
|---|---|---|
| `{colors.status-available}` green | A Sample Piece is *usable* and free | Catalogue availability, condition *usable* on return |
| `{colors.status-held}` violet | A piece is under a Hold for a specific Kit | Kit rows, availability when staff can see who holds it |
| `{colors.status-out}` slate | A piece is on an open Loan Line, not yet due | Loan lists, catalogue "on loan" counts |
| `{colors.status-due-soon}` amber | A Loan Line falls inside the due-back window | Due-back list, dashboard tile |
| `{colors.status-overdue}` red | A Loan Line's due date has passed | Overdue list, chase list, the one tinted row |
| `{colors.status-damaged}` rose | A piece came back *damaged* or is *missing*; a Case is open | Case list, piece condition, sample history |

Rose and red are adjacent on purpose and distinct in use: red is *late*, rose is *broken*. They never appear in the same column.

**Never:** gradients, a second accent, colour as the sole carrier of any state (every status colour ships with a dot and a word), a custom destructive colour (shadcn's `destructive` is correct), tinted backgrounds on anything except `{components.overdue-row}` and status pills.

Dark mode exists as a token set (`*-dark`) and is not a design variant: same hierarchy, same meanings, contrast re-verified. It is for the staff member checking the chase list at home, not a feature.

## Typography

**IBM Plex Sans throughout. No second family.** Serif display type would be a lie about what this product is.

| Role | Size / weight | Used for |
|---|---|---|
| `{typography.display}` | 24 / 600 | Surface titles — "Handover", "Return", "Overdue" |
| `{typography.heading}` | 18 / 600 | Card and section headings, Sample name on detail |
| `{typography.body}` | 14 / 400 | Everything written in sentences |
| `{typography.body-strong}` | 14 / 600 | The one value in a row that matters most — Sample name, Studio name |
| `{typography.label}` | 12 / 500 | Field labels, column headers, status pill text |
| `{typography.caption}` | 12 / 400 | Attribution lines, timestamps, "last reminded" |
| `{typography.numeric}` | 14 / 500 tabular | Dates, day counts, piece counts, PKR amounts |
| `{typography.metric}` | 30 / 600 tabular | Dashboard tile figures only |

**The tabular-figures rule is not cosmetic.** FR-22 asks staff to sort and scan "days overdue" down a column, and FR-34 exports those same columns to CSV. Proportional digits make a column of numbers ragged and the scan fails. Every date, count and amount in SampleLoop sets `font-variant-numeric: tabular-nums`.

Dates render as `14 Oct` within the current year and `14 Oct 2026` otherwise — never `14/10/26`, which is ambiguous to an English-language product used in a country that writes dates both ways.

Minimum rendered size anywhere is 12px. Nothing in SampleLoop is small enough to need a squint at a counter.

## Layout & Spacing

Tailwind's 4-based scale, inherited. The named tokens above exist because this product has a density requirement that general scales do not express.

- **Desktop list rows** are `{spacing.row-desktop}` (40px) — dense enough that a staff member sees fifteen overdue lines without scrolling, which is what makes UJ-5 a four-minute routine.
- **Mobile rows** are `{spacing.row-mobile}` (56px) and every interactive element clears `{spacing.touch-target}` (44px). The counter phone is the design target for handover and return, not an afterthought.
- **Gutters** are `{spacing.gutter-desktop}` (24px) / `{spacing.gutter-mobile}` (16px).

Shell: persistent left sidebar at `lg`+ (1024px), collapsed to icons at `md`, a shadcn `Sheet` from the top bar below that. Content maxes at 1440px — SampleLoop *is* a wide-table product and should not be squeezed into a reading column.

Two layout archetypes cover every surface:

1. **List surface** — filter bar pinned at the top, table below, count and export on the right. Catalogue, loans, overdue, due-back, cases, studios.
2. **Transaction surface** — a line-item list in the middle, a sticky summary and single confirm action at the bottom (bottom bar on mobile, right rail at `lg`+). Kit builder, handover, return, extension decisions.

The sticky confirm bar is the single most important layout decision in the product. Handover and return are counter actions performed under mild social pressure with a designer's assistant standing there; the commit control must never be somewhere you scroll to find.

## Elevation & Depth

Flat by default. shadcn's shadow scale is inherited and used in exactly three places: dropdowns and popovers (`shadow-md`), dialogs and sheets (`shadow-lg`), and the sticky transaction bar (`shadow-lg` upward, so it reads as floating above the list it commits).

Cards do not have shadows. They are separated by `{colors.hairline}` borders. Depth is not a hierarchy device here — position and weight are.

## Shapes

`{rounded.sm}` (4px) on inputs, piece chips and checkboxes. `{rounded.md}` (6px) on buttons, cards, segmented controls. `{rounded.lg}` (8px) on dialogs, sheets and dashboard tiles. `{rounded.full}` on status pills and avatars only.

Tighter than shadcn's defaults by 2px at every step. The product should read as an instrument, not a consumer app. A pill shape is reserved for status so the shape itself becomes a signal: *round means state, square means thing.*

Photographs are `{rounded.md}` and always 4:3, never square-cropped. A square crop of a flooring sample throws away the part of the grain the designer is judging.

## Components

Inherited from shadcn unchanged: `Button`, `Dialog`, `Sheet`, `Command`, `Popover`, `DropdownMenu`, `Tabs`, `Toast`, `Select`, `Checkbox`, `Switch`, `Separator`, `Skeleton`, `Tooltip`, `Avatar`.

Drawn on the six key screens in [`mockups/`](mockups/README.md); this spine wins where the two disagree.

SampleLoop's brand-layer components:

- **Status pill** — `{rounded.full}`, `{typography.label}`, a 6px dot in the status colour, then the word. Background is the matching `*-bg` token. Six variants, one per status colour, and no seventh.
- **Piece chip** — monospaced-feeling tabular rendering of a Sample Piece identifier (`FB-2214 / 2`), `{rounded.sm}`, hairline border. The glossary distinguishes Sample from Sample Piece; the UI must too, at a glance, in every list.
- **Sample card** — photograph at 4:3 on top, reference code in `{typography.numeric}`, name in `{typography.body-strong}`, then two counts: *N available* in green, *N on loan* in slate. Used in catalogue grid and alternative suggestions (FR-5).
- **Metric tile** — dashboard only. 3px left band in the tile's status colour, `{typography.metric}` figure, `{typography.label}` caption. The whole tile is the link target (FR-31 requires each figure to lead to its filtered list).
- **Condition toggle** — three-way segmented control, *usable* / *damaged* / *missing*, minimum 44px tall, **no default selection**. FR-16 forbids saving an unassessed piece; the control must look unanswered until it is answered.
- **Data table row** — 40px desktop, collapsing to a stacked card at `< md` with the Sample name as the card title and labels moving above values.
- **Overdue row** — `{colors.status-overdue-bg}` fill plus a 3px `{colors.status-overdue}` left border. The only full-row tint in the product, which is what keeps it meaningful.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Let the sample photograph be the brightest thing on the screen | Put a brand colour anywhere near a photograph |
| Use `{colors.primary}` for exactly one action per surface | Render two primary buttons on one screen |
| Ship every status colour with a dot and a word | Rely on red-versus-amber alone to mean late-versus-soon |
| Set `tabular-nums` on every date, count and amount | Let a days-overdue column go ragged |
| Keep the confirm bar sticky on transaction surfaces | Make a staff member scroll to commit a handover |
| Render Sample Piece identity as a `piece-chip`, always | Show a Sample where the user needs a Sample Piece |
| Inherit shadcn's `destructive` for destructive actions | Invent a seventh red |
| Say "charge recorded" | Say "paid", "invoice", "settled", or show a payment icon (PRD §6) |
| 40px rows on desktop, 56px and 44px targets on mobile | Shrink mobile rows to fit more in — the counter phone is the target |
| Keep dark mode token-identical in meaning | Treat dark mode as a second design |
