-- FR-7: Hold, and the piece each reserved Kit Line names.
-- Prisma cannot express partial indexes, so the NFR-7 invariant lives here (AD-4, AR-3).

CREATE TYPE hold_release_reason AS ENUM ('expiry', 'cancelled');

CREATE TABLE hold (
  id              uuid PRIMARY KEY,
  kit_id          uuid        NOT NULL REFERENCES kit (id),
  sample_id       uuid        NOT NULL,
  sample_piece_id uuid        NOT NULL,
  expires_on      date        NOT NULL,
  created_by      uuid        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  released_at     timestamptz,
  released_by     uuid,
  release_reason  hold_release_reason,
  CONSTRAINT hold_release_complete CHECK ((released_at IS NULL) = (release_reason IS NULL))
);

-- NFR-7: at most one active Hold per Sample Piece.
CREATE UNIQUE INDEX hold_one_active_per_piece ON hold (sample_piece_id) WHERE released_at IS NULL;
CREATE INDEX hold_kit_idx ON hold (kit_id);
CREATE INDEX hold_active_expiry_idx ON hold (expires_on) WHERE released_at IS NULL;

ALTER TABLE kit_line
  ADD COLUMN sample_piece_id uuid,
  ADD COLUMN unfulfilled boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT kit_line_piece_or_unfulfilled CHECK (NOT (unfulfilled AND sample_piece_id IS NOT NULL));
