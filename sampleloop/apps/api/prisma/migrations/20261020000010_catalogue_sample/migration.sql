-- FR-1: Sample (the catalogue module owns sample and sample_piece — AD-1, AD-15).
--
-- AD-2: a Sample is the *design*. No quantity, no piece count and no availability
-- column lives here; availability is computed at query time (AD-11) and condition
-- belongs to sample_piece, which FR-2 adds.
--
-- AD-9: photo_key is a handle into the PhotoStore. The image never enters PostgreSQL.
--
-- The foreign keys from created_by / updated_by / retired_by to the user table are
-- added by the accounts module's migration once that table exists.

CREATE TABLE sample (
  id             uuid PRIMARY KEY,
  reference_code text        NOT NULL CHECK (reference_code ~ '^[A-Za-z0-9][A-Za-z0-9-]{1,31}$'),
  name           text        NOT NULL CHECK (length(btrim(name)) > 0),
  material       text        NOT NULL CHECK (length(btrim(material)) > 0),
  supplier       text        NOT NULL CHECK (length(btrim(supplier)) > 0),
  colour         text        NOT NULL CHECK (length(btrim(colour)) > 0),
  description    text        NOT NULL DEFAULT '',
  photo_key      text,
  retired_at     timestamptz,
  retired_by     uuid,
  created_by     uuid        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_by     uuid        NOT NULL,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sample_retirement_is_attributed
    CHECK ((retired_at IS NULL) = (retired_by IS NULL))
);

-- FR-1: the reference code is unique across the catalogue, retired entries included,
-- and compared case-insensitively so it agrees with the case-insensitive search FR-3
-- promises. Prisma's schema language cannot express an expression index, so this is
-- hand-written SQL that Prisma applies but does not generate — the same mechanism
-- AD-4 uses for the partial indexes.
CREATE UNIQUE INDEX sample_reference_code_unique ON sample (upper(reference_code));

-- FR-3 filters the catalogue by material, supplier and colour; a retired Sample is
-- hidden from Designers, so retired_at is part of every Designer-facing predicate.
CREATE INDEX sample_material_idx ON sample (lower(material));
CREATE INDEX sample_supplier_idx ON sample (lower(supplier));
CREATE INDEX sample_colour_idx ON sample (lower(colour));
CREATE INDEX sample_active_idx ON sample (retired_at) WHERE retired_at IS NULL;
