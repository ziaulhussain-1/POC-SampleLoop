-- FR-6: Kit and Kit Line (kits module owns kit, kit_line, hold — AD-1).
-- Foreign keys to studio, sample and the user table are added by the owning
-- modules' migrations once those tables exist (catalogue / accounts).

CREATE TYPE kit_state AS ENUM ('requested', 'reserved', 'collected', 'cancelled');

CREATE TABLE kit (
  id                   uuid PRIMARY KEY,
  studio_id            uuid        NOT NULL,
  client_project       text        NOT NULL CHECK (length(btrim(client_project)) > 0),
  collection_date      date        NOT NULL,
  expected_return_date date        NOT NULL,
  state                kit_state   NOT NULL DEFAULT 'requested',
  created_by           uuid        NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kit_return_not_before_collection CHECK (expected_return_date >= collection_date)
);

CREATE INDEX kit_studio_idx ON kit (studio_id);
CREATE INDEX kit_state_collection_idx ON kit (state, collection_date);

CREATE TABLE kit_line (
  id        uuid PRIMARY KEY,
  kit_id    uuid NOT NULL REFERENCES kit (id),
  sample_id uuid NOT NULL,
  CONSTRAINT kit_line_one_per_sample UNIQUE (kit_id, sample_id)
);
