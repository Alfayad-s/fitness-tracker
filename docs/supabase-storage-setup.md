# Supabase Storage — profile avatars

Required once for the **Change profile photo** feature on `/profile`.

## 1. Create bucket

1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `avatars`
3. **Public bucket:** ON (so profile images load in the app)
4. Create bucket

## 2. Storage policies

Open the `avatars` bucket → **Policies** → add these (or run in **SQL Editor**):

See **[docs/sql/storage-rls.sql](../sql/storage-rls.sql)** for the full script. Summary:

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
