CREATE TABLE IF NOT EXISTS "quote_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"studio_id" text NOT NULL,
	"source_service_package_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quote_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"quote_section_id" text NOT NULL,
	"studio_id" text NOT NULL,
	"name" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"quantity" integer NOT NULL,
	"unit_label" text DEFAULT '' NOT NULL,
	"unit_price_cents" integer DEFAULT 0 NOT NULL,
	"line_total_cents" integer DEFAULT 0 NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "generated_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "quote_sections" ADD CONSTRAINT "quote_sections_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_section_id_quote_sections_id_fk" FOREIGN KEY ("quote_section_id") REFERENCES "public"."quote_sections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quote_sections_quote_id" ON "quote_sections" USING btree ("quote_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quote_sections_quote_position" ON "quote_sections" USING btree ("quote_id","position");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quote_sections_studio_id" ON "quote_sections" USING btree ("studio_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quote_line_items_quote_id" ON "quote_line_items" USING btree ("quote_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quote_line_items_section_position" ON "quote_line_items" USING btree ("quote_section_id","position");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quote_line_items_studio_id" ON "quote_line_items" USING btree ("studio_id");
