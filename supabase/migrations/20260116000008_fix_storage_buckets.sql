-- Migration: Fix Storage Buckets and Policies for Chat
-- Ensures 'attachments' and 'voice-messages' buckets exist and are public.
-- Grants upload permissions to authenticated users.

-- 1. Attachments Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Voice Messages Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-messages', 'voice-messages', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Policies
-- Clean up potentially conflicting policies
DROP POLICY IF EXISTS "Authenticated Upload Attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public Select Attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Voice" ON storage.objects;
DROP POLICY IF EXISTS "Public Select Voice" ON storage.objects;

-- Create new robust policies
-- Attachments: Upload (Auth), Select (Public)
CREATE POLICY "Authenticated Upload Attachments" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Public Select Attachments" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'attachments');

-- Voice: Upload (Auth), Select (Public)
CREATE POLICY "Authenticated Upload Voice" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'voice-messages');

CREATE POLICY "Public Select Voice" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'voice-messages');
