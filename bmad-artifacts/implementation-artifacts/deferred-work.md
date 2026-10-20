# Deferred work

Things that could not be honestly verified here, and what would verify them.

## FR-2 — Maintain Sample Pieces (`feature/FR-2-maintain-sample-pieces`)

- **Migration `20261020000020_catalogue_sample_piece` not applied to a database.** No PostgreSQL or
  Prisma setup exists in the repo yet. *Verify:* apply both catalogue migrations to PostgreSQL 18 and
  confirm `sample_piece_number_unique` refuses a duplicate `(sample_id, piece_number)`.
- **No SQL `SamplePieceRepository`.** Only the in-memory adapter exists. The SQL `append` must lock the
  `sample` row (`SELECT … FOR UPDATE`) before reading the max piece number. *Verify:* two concurrent
  `append` calls on one Sample under a real database get distinct, gap-free numbers.
- **No real `PieceCommitments` adapter.** `kits` (Holds) and `lending` (Loan Lines) do not expose a
  query service yet; tests use `InMemoryPieceCommitments`. *Verify:* once FR-7 / FR-11 land, wire the
  adapter through their application services and test removal refused against a real Hold and Loan.
- **Remove vs. reserve race.** Removal checks commitments, then writes. A reservation committing in
  between could hold a piece that is being removed. *Fix/verify:* removal takes `SELECT … FOR UPDATE` on
  the `sample_piece` row in the same transaction, and reservation (FR-7, AD-5) skips rows with
  `removed_at IS NOT NULL` under its own lock; test with two concurrent transactions.
- **No HTTP layer.** `POST /samples/{id}/pieces` and `POST /sample-pieces/{id}/removal` (AD-13) are named
  in code comments only; FR-1 has no controllers either.
