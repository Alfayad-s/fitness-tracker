-- Indexes for common query paths
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
CREATE INDEX IF NOT EXISTS "exercises_muscle_group_idx" ON "exercises" USING btree ("muscle_group");
CREATE INDEX IF NOT EXISTS "exercises_created_by_idx" ON "exercises" USING btree ("created_by");
CREATE INDEX IF NOT EXISTS "exercises_is_custom_idx" ON "exercises" USING btree ("is_custom");
CREATE INDEX IF NOT EXISTS "workouts_user_id_idx" ON "workouts" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "workouts_date_idx" ON "workouts" USING btree ("date");
CREATE INDEX IF NOT EXISTS "workouts_user_id_date_idx" ON "workouts" USING btree ("user_id","date");
CREATE INDEX IF NOT EXISTS "workout_exercises_workout_id_idx" ON "workout_exercises" USING btree ("workout_id");
CREATE INDEX IF NOT EXISTS "workout_exercises_exercise_id_idx" ON "workout_exercises" USING btree ("exercise_id");
CREATE INDEX IF NOT EXISTS "sets_workout_exercise_id_idx" ON "sets" USING btree ("workout_exercise_id");
CREATE INDEX IF NOT EXISTS "body_measurements_user_id_idx" ON "body_measurements" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "body_measurements_user_id_recorded_at_idx" ON "body_measurements" USING btree ("user_id","recorded_at");

-- Audit timestamps
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;

ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;

ALTER TABLE "workouts" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE "workouts" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;

ALTER TABLE "body_measurements" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE "body_measurements" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;
