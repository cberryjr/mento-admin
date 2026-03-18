CREATE TABLE "service_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"studio_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"starting_price_label" text NOT NULL,
	"short_description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_service_packages_studio_id" ON "service_packages" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "idx_service_packages_studio_name_created_at" ON "service_packages" USING btree ("studio_id","name","created_at");