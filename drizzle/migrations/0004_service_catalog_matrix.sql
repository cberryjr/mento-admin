CREATE TABLE "service_package_complexity_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"service_package_id" text NOT NULL,
	"studio_id" text NOT NULL,
	"tier_key" text NOT NULL,
	"tier_title" text NOT NULL,
	"descriptor" text NOT NULL,
	"time_min_value" integer NOT NULL,
	"time_max_value" integer NOT NULL,
	"time_unit" text NOT NULL,
	"quantity_default" integer NOT NULL,
	"duration_value_default" integer,
	"duration_unit_default" text,
	"resolution_default" text,
	"revisions_default" integer NOT NULL,
	"urgency_default" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_package_tier_deliverables" (
	"id" text PRIMARY KEY NOT NULL,
	"service_package_id" text NOT NULL,
	"service_package_complexity_tier_id" text NOT NULL,
	"studio_id" text NOT NULL,
	"value" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_package_tier_process_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"service_package_id" text NOT NULL,
	"service_package_complexity_tier_id" text NOT NULL,
	"studio_id" text NOT NULL,
	"value" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_packages" ADD COLUMN "category_key" text DEFAULT 'ai-print-campaigns' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_packages" ADD COLUMN "category_label" text DEFAULT 'AI Print Campaigns' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_packages" ADD COLUMN "category_short_label" text DEFAULT 'Print' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_package_complexity_tiers" ADD CONSTRAINT "service_package_complexity_tiers_service_package_id_service_packages_id_fk" FOREIGN KEY ("service_package_id") REFERENCES "public"."service_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_package_tier_deliverables" ADD CONSTRAINT "service_package_tier_deliverables_service_package_id_service_packages_id_fk" FOREIGN KEY ("service_package_id") REFERENCES "public"."service_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_package_tier_deliverables" ADD CONSTRAINT "service_package_tier_deliverables_service_package_complexity_tier_id_service_package_complexity_tiers_id_fk" FOREIGN KEY ("service_package_complexity_tier_id") REFERENCES "public"."service_package_complexity_tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_package_tier_process_notes" ADD CONSTRAINT "service_package_tier_process_notes_service_package_id_service_packages_id_fk" FOREIGN KEY ("service_package_id") REFERENCES "public"."service_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_package_tier_process_notes" ADD CONSTRAINT "service_package_tier_process_notes_service_package_complexity_tier_id_service_package_complexity_tiers_id_fk" FOREIGN KEY ("service_package_complexity_tier_id") REFERENCES "public"."service_package_complexity_tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_service_package_complexity_tiers_package_position" ON "service_package_complexity_tiers" USING btree ("service_package_id","position");--> statement-breakpoint
CREATE INDEX "idx_service_package_complexity_tiers_studio_id" ON "service_package_complexity_tiers" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "idx_service_package_tier_deliverables_tier_position" ON "service_package_tier_deliverables" USING btree ("service_package_complexity_tier_id","position");--> statement-breakpoint
CREATE INDEX "idx_service_package_tier_deliverables_package_id" ON "service_package_tier_deliverables" USING btree ("service_package_id");--> statement-breakpoint
CREATE INDEX "idx_service_package_tier_process_notes_tier_position" ON "service_package_tier_process_notes" USING btree ("service_package_complexity_tier_id","position");--> statement-breakpoint
CREATE INDEX "idx_service_package_tier_process_notes_package_id" ON "service_package_tier_process_notes" USING btree ("service_package_id");