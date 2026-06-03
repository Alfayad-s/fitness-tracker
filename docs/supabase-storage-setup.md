# Supabase Storage — profile avatars

Required once for the **Change profile photo** feature on `/profile`.

## 1. Create bucket

1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `avatars`
3. **Public bucket:** ON (so profile images load in the app)
4. Create bucket

## 2. Storage policies

Open the `avatars` bucket → **Policies** → add these (or run in **SQL Editor**):

```sql
-- Anyone can view avatars (public bucket)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Signed-in users upload to their own folder: {user_id}/avatar.jpg
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
```

## 3. Test

1. Run the app and open **Profile**
2. Tap the **camera** button on your avatar
3. Pick a JPG, PNG, or WebP (max 2 MB)
4. Photo should update on Profile and in the top bar after refresh

## Troubleshooting

| Error | Fix |
|-------|-----|
| Bucket not found | Create public bucket named exactly `avatars` |
| new row violates row-level security | Add the policies above |
| Image does not show in header | Hard refresh; check bucket is **public** |
