-- Supabase Storage RLS for the public `avatars` bucket.
-- Run once in Supabase Dashboard → SQL Editor (or via migration tooling).
--
-- App tables (users, workouts, etc.) are queried via Drizzle + DATABASE_URL
-- on the server, not through the Supabase anon client — they do not need
-- PostgREST RLS for this app. Only Storage uses the authenticated client.

-- Public read (bucket must also be marked Public in Storage settings)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Upload to own folder: {user_id}/avatar.jpg
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
