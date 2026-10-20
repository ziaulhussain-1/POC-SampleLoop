# SampleLoop Technology Discussion

Client discussion and decision record | 14 October 2026 | Draft for agreement

This document proposes the technology for SampleLoop and explains what each part does. We will use it to agree the technical direction, running costs and responsibilities before detailed design and development. All recommendations below remain subject to client agreement.

## What we are building

A web application for one Lahore showroom to manage material samples, reservations, loans, partial returns and damage or loss cases. Staff and designers will use it on computers and mobile browsers. The planning baseline is approximately 600 physical samples, 80 studios, six staff and fewer than 15 simultaneous users.

## Recommended technology

| Area and proposal | Purpose and reason | Point to agree |
| --- | --- | --- |
| User interface React and TypeScript | Build the screens used by staff and designers. Supports an interactive web experience. | Responsive web app for the first release; no separate mobile app. |
| Visual design Tailwind CSS and shadcn/ui | Create consistent forms, tables and controls using the sample UI as a reference. | Approve the visual direction. Review prototype code before deciding what to reuse. |
| Application backend Node.js and NestJS with TypeScript | Apply lending rules, permissions and updates in one central service. Uses the same main language as the interface. | One backend application for the pilot. Business rules will be agreed separately. |
| Database PostgreSQL | Store studios, individual sample pieces, loans, returns and history in related records. | A centrally hosted database with a defined backup arrangement. |
| Database development Prisma ORM | Help developers access the database and manage controlled changes to its structure. | A supporting development tool; versions will be checked for compatibility. |
| Login and photo storage Provider to be selected | Protect accounts and store sample or damage photos with controlled access. | Agree login needs, account ownership, photo limits and provider costs. |

## Why this is the proposed direction

The proposal keeps the first release to a web interface, one backend and one database. It is intended to keep development and support manageable for the showroom’s size. The team should confirm its ability to maintain this stack before approval. A Python or .NET backend remains an option if existing systems or team experience make it a better fit.

## Decisions to make together

| Discussion item | Proposed approach or question | Agreed decision |
| --- | --- | --- |
| Hosting and ownership | Use client-owned service accounts with developer access. Which provider, hosting region and monthly budget are acceptable? | Pending |
| Access and accounts | Separate manager, staff and designer access. Who invites users, and can designers see every loan within their studio? | Pending |
| Reminders | Start with copyable WhatsApp reminder drafts. If automatic sending is required, separately confirm provider, costs, recipients and timing. | Pending |
| Backups and recovery | Agree how much recent data could be lost, acceptable downtime and retention. Use these answers to select a backup and recovery plan. | Pending |
| Images and privacy | Agree allowed photo types, size limits, retention, access and deletion responsibilities. | Pending |
| Release and acceptance | The brief requests a four-week pilot. Confirm scope, budget, client feedback availability and the person authorised to accept it. | Pending |
| Support after launch | Who handles incidents, account support, backups and software updates? Agree the support period and response expectations. | Pending |

## Cost and scope agreement

Development will be quoted separately from recurring hosting, database, photo storage, backup and support costs. Automated messaging or other paid services may add charges. No price or paid subscription is approved by this document; an estimate will follow the provider and service choices.

The first release excludes online payments, delivery tracking, purchasing, native mobile apps and AI recommendations. The existing sample UI is a demonstration using local browser data. A real release needs server-side security, shared storage and validation before use with client data.

## Decision record

For each pending item, record the selected option, decision owner and date. Any unresolved item should also have an owner and a target decision date.

Technology proposal: ☐ Approved ☐ Approved with changes ☐ Further discussion

Changes or conditions: _______________________________________________________

Client representative: ____________________ Date: ____________________

Technical representative: _________________ Date: ____________________

Agreement here confirms technical direction only. It does not approve a final budget, delivery date or completed software design. Exact versions and implementation details will be documented after the business requirements are agreed.
