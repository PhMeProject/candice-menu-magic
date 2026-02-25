-- Create a public storage bucket for meal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', true);

-- Allow anyone to read photos
CREATE POLICY "Meal photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'meal-photos');

-- Allow anyone to upload photos (no auth for this personal app)
CREATE POLICY "Anyone can upload meal photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'meal-photos');

-- Allow anyone to delete meal photos
CREATE POLICY "Anyone can delete meal photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'meal-photos');