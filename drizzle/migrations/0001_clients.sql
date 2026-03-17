CREATE TABLE IF NOT EXISTS "clients" (
  "id" text PRIMARY KEY NOT NULL,
  "studio_id" text NOT NULL,
  "name" text NOT NULL,
  "contact_name" text DEFAULT '' NOT NULL,
  "contact_email" text DEFAULT '' NOT NULL,
  "contact_phone" text DEFAULT '' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_clients_studio_id"
  ON "clients" ("studio_id");

CREATE INDEX IF NOT EXISTS "idx_clients_studio_name_created_at"
  ON "clients" ("studio_id", "name", "created_at");
