-- Create plant-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-images', 'plant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can upload plant images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view plant images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own plant images" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload plant images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'plant-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access
CREATE POLICY "Public can view plant images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'plant-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own plant images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'plant-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
