-- Storage RLS Policies for brand-assets bucket
-- Run this after creating the brand-assets bucket in Supabase Dashboard → Storage

-- Allow authenticated users to upload to their brand folders
CREATE POLICY "Users can upload to their brand folders"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets' 
  AND (storage.foldername(name))[1] IN (
    SELECT brand_id::text 
    FROM brand_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow public read access (for logo/image URLs)
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'brand-assets');

-- Allow users to delete their brand files
CREATE POLICY "Users can delete their brand files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT brand_id::text 
    FROM brand_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow users to update their brand files (e.g., replace logo)
CREATE POLICY "Users can update their brand files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT brand_id::text 
    FROM brand_members 
    WHERE user_id = auth.uid()
  )
);
