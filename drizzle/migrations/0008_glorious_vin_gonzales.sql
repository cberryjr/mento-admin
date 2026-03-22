CREATE TABLE "invoice_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"invoice_section_id" text NOT NULL,
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
CREATE TABLE "invoice_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"studio_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"studio_id" text NOT NULL,
	"client_id" text NOT NULL,
	"source_quote_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"issue_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"payment_instructions" text DEFAULT '' NOT NULL,
	"terms" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_section_id_invoice_sections_id_fk" FOREIGN KEY ("invoice_section_id") REFERENCES "public"."invoice_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_sections" ADD CONSTRAINT "invoice_sections_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_source_quote_id_quotes_id_fk" FOREIGN KEY ("source_quote_id") REFERENCES "public"."quotes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_invoice_line_items_invoice_id" ON "invoice_line_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_line_items_section_position" ON "invoice_line_items" USING btree ("invoice_section_id","position");--> statement-breakpoint
CREATE INDEX "idx_invoice_line_items_position" ON "invoice_line_items" USING btree ("invoice_id","position");--> statement-breakpoint
CREATE INDEX "idx_invoice_line_items_studio_id" ON "invoice_line_items" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_sections_invoice_id" ON "invoice_sections" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_sections_invoice_position" ON "invoice_sections" USING btree ("invoice_id","position");--> statement-breakpoint
CREATE INDEX "idx_invoice_sections_studio_id" ON "invoice_sections" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_studio_id" ON "invoices" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_client_id" ON "invoices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_source_quote_id" ON "invoices" USING btree ("source_quote_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_studio_status" ON "invoices" USING btree ("studio_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_invoices_studio_invoice_number" ON "invoices" USING btree ("studio_id","invoice_number");