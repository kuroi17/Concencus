-- 1. Create Buckets
-- Ensure the following buckets exist and are public.

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('user-avatars', 'user-avatars', true),
  ('chat-images', 'chat-images', true),
  ('forum-post-images', 'forum-post-images', true),
  ('announcement-images', 'announcement-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage Policies (RLS)
-- Note: You might need to delete existing policies if they conflict.

-- ALLOW PUBLIC ACCESS TO VIEW IMAGES
CREATE POLICY "View Public Images"
ON storage.objects FOR SELECT
USING (bucket_id IN ('user-avatars', 'chat-images', 'forum-post-images', 'announcement-images'));

-- ALLOW AUTHENTICATED USERS TO UPLOAD IMAGES
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('user-avatars', 'chat-images', 'forum-post-images', 'announcement-images'));

-- ALLOW USERS TO MANAGE THEIR OWN FILES (Delete/Update)
-- This assumes the first part of the path is the user's ID
CREATE POLICY "Manage Own Files"
ON storage.objects FOR ALL
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);
