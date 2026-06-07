CREATE TYPE "public"."template_source" AS ENUM('manual', 'ai', 'imported');--> statement-breakpoint
CREATE TYPE "public"."daily_plan_status" AS ENUM('suggested', 'accepted', 'skipped', 'completed');--> statement-breakpoint
CREATE TYPE "public"."program_source" AS ENUM('manual', 'ai', 'preset');--> statement-breakpoint
CREATE TABLE "workout_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source" "template_source" DEFAULT 'manual' NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "template_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"target_sets" smallint,
	"target_reps" smallint,
	"target_weight_kg" numeric(7, 2),
	"notes" text
);--> statement-breakpoint
CREATE TABLE "daily_workout_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_date" date NOT NULL,
	"template_id" uuid,
	"title" text NOT NULL,
	"status" "daily_plan_status" DEFAULT 'suggested' NOT NULL,
	"ai_rationale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "workout_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source" "program_source" DEFAULT 'manual' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "program_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"template_id" uuid,
	"is_rest_day" boolean DEFAULT false NOT NULL,
	"label" text
);--> statement-breakpoint
ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_workout_plans" ADD CONSTRAINT "daily_workout_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_workout_plans" ADD CONSTRAINT "daily_workout_plans_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_programs" ADD CONSTRAINT "workout_programs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_days" ADD CONSTRAINT "program_days_program_id_workout_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."workout_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_days" ADD CONSTRAINT "program_days_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workout_templates_user_id_idx" ON "workout_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_templates_user_id_name_idx" ON "workout_templates" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "template_exercises_template_id_idx" ON "template_exercises" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "template_exercises_exercise_id_idx" ON "template_exercises" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "daily_workout_plans_user_id_plan_date_idx" ON "daily_workout_plans" USING btree ("user_id","plan_date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_workout_plans_user_date_unique" ON "daily_workout_plans" USING btree ("user_id","plan_date");--> statement-breakpoint
CREATE INDEX "workout_programs_user_id_idx" ON "workout_programs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_programs_user_id_active_idx" ON "workout_programs" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "program_days_program_id_idx" ON "program_days" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "program_days_program_day_idx" ON "program_days" USING btree ("program_id","day_of_week");
