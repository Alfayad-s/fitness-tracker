ALTER TABLE "body_measurements" ADD COLUMN IF NOT EXISTS "recorded_at" timestamp with time zone DEFAULT now() NOT NULL;
