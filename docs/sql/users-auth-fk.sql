-- Optional: tie public.users.id to Supabase auth.users.id
-- Run manually in Supabase Dashboard → SQL Editor (not applied by drizzle-kit migrate).
--
-- Prerequisites:
--   1. Backup your database.
--   2. No orphan rows: every public.users.id must exist in auth.users.
--      Check: SELECT u.id FROM public.users u
--             LEFT JOIN auth.users a ON a.id = u.id
--             WHERE a.id IS NULL;
--
-- App code already uses auth UUIDs via lib/auth/sync-user.ts.

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Stop generating random IDs; IDs must come from auth.users
ALTER TABLE public.users
  ALTER COLUMN id DROP DEFAULT;

ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users (id)
  ON DELETE CASCADE;
