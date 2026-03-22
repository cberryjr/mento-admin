CREATE TABLE "quote_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"studio_id" text NOT NULL,
	"revision_number" integer NOT NULL,
	"snapshot_data" text NOT NULL,
	"terms" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "estimate_breakdown_snapshot" text;--> statement-breakpoint
ALTER TABLE "quote_revisions" ADD CONSTRAINT "quote_revisions_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_quote_revisions_quote_id" ON "quote_revisions" USING btree ("quote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_quote_revisions_quote_id_revision_number" ON "quote_revisions" USING btree ("quote_id","revision_number");