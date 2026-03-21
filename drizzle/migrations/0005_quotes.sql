CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"studio_id" text NOT NULL,
	"client_id" text NOT NULL,
	"quote_number" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"terms" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_service_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"service_package_id" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quote_service_packages" ADD CONSTRAINT "quote_service_packages_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "quote_service_packages" ADD CONSTRAINT "quote_service_packages_service_package_id_service_packages_id_fk" FOREIGN KEY ("service_package_id") REFERENCES "public"."service_packages"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_quotes_studio_id" ON "quotes" USING btree ("studio_id");
--> statement-breakpoint
CREATE INDEX "idx_quotes_client_id" ON "quotes" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX "idx_quotes_studio_status" ON "quotes" USING btree ("studio_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_quotes_studio_quote_number" ON "quotes" USING btree ("studio_id","quote_number");
--> statement-breakpoint
CREATE INDEX "idx_quote_service_packages_quote_id" ON "quote_service_packages" USING btree ("quote_id");
--> statement-breakpoint
CREATE INDEX "idx_quote_service_packages_service_package_id" ON "quote_service_packages" USING btree ("service_package_id");
