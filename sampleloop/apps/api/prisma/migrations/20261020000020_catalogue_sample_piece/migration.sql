-- FR-2: Sample Piece, one physical copy of a Sample (AD-2). Owned by catalogue (AD-15).
--
-- Holds, Loan Lines and Cases attach here. A piece is never hard-deleted: removal
-- sets removed_at, so those rows keep a target and FR-33 can show the piece's
-- history. There is no availability column; availability is computed (AD-11).
--
-- The foreign keys from created_by / removed_by to the user table are added by the
-- accounts module's migration once that table exists.

CREATE TABLE sample_piece (
  id           uuid        PRIMARY KEY,
  sample_id    uuid        NOT NULL REFERENCES sample (id) ON DELETE RESTRICT,
  piece_number integer     NOT NULL CHECK (piece_number > 0),
  condition    text        NOT NULL DEFAULT 'usable'
                           CHECK (condition IN ('usable', 'damaged', 'missing')),
  removed_at   timestamptz,
  removed_by   uuid,
  created_by   uuid        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sample_piece_removal_is_attributed
    CHECK ((removed_at IS NULL) = (removed_by IS NULL))
);

-- AR-15: a piece's business identity is (sample.reference_code, piece_number). The
-- reference code is fixed once set (FR-1), so uniqueness on (sample_id, piece_number)
-- carries it. Removed pieces keep their row, so a number is never reused.
CREATE UNIQUE INDEX sample_piece_number_unique ON sample_piece (sample_id, piece_number);

-- Pieces still in the catalogue, per Sample: the set FR-3 counts and FR-4 / FR-7 draw from.
CREATE INDEX sample_piece_in_catalogue_idx ON sample_piece (sample_id) WHERE removed_at IS NULL;
