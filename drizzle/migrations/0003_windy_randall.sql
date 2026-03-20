CREATE TABLE "service_package_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"service_package_id" text NOT NULL,
	"service_package_section_id" text NOT NULL,
	"studio_id" text NOT NULL,
	"name" text NOT NULL,
	"default_content" text DEFAULT '' NOT NULL,
	"quantity" integer NOT NULL,
	"unit_label" text DEFAULT '' NOT NULL,
	"unit_price_cents" integer DEFAULT 0 NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_package_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"service_package_id" text NOT NULL,
	"studio_id" text NOT NULL,
	"title" text NOT NULL,
	"default_content" text DEFAULT '' NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_packages" ADD COLUMN "package_total_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_package_line_items" ADD CONSTRAINT "service_package_line_items_service_package_id_service_packages_id_fk" FOREIGN KEY ("service_package_id") REFERENCES "public"."service_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_package_line_items" ADD CONSTRAINT "service_package_line_items_service_package_section_id_service_package_sections_id_fk" FOREIGN KEY ("service_package_section_id") REFERENCES "public"."service_package_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_package_sections" ADD CONSTRAINT "service_package_sections_service_package_id_service_packages_id_fk" FOREIGN KEY ("service_package_id") REFERENCES "public"."service_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_service_package_line_items_section_position" ON "service_package_line_items" USING btree ("service_package_section_id","position");--> statement-breakpoint
CREATE INDEX "idx_service_package_line_items_package_id" ON "service_package_line_items" USING btree ("service_package_id");--> statement-breakpoint
CREATE INDEX "idx_service_package_line_items_studio_id" ON "service_package_line_items" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "idx_service_package_sections_package_position" ON "service_package_sections" USING btree ("service_package_id","position");--> statement-breakpoint
CREATE INDEX "idx_service_package_sections_studio_id" ON "service_package_sections" USING btree ("studio_id");