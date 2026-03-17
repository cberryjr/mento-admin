CREATE TABLE IF NOT EXISTS "studio_defaults" (
  "id" text PRIMARY KEY NOT NULL,
  "studio_id" text NOT NULL,
  "studio_name" text NOT NULL,
  "studio_contact_name" text DEFAULT '' NOT NULL,
  "studio_contact_email" text DEFAULT '' NOT NULL,
  "studio_contact_phone" text DEFAULT '' NOT NULL,
  "default_quote_terms" text NOT NULL,
  "default_invoice_payment_instructions" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_studio_defaults_studio_id"
  ON "studio_defaults" ("studio_id");
