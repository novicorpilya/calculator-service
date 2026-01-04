-- Add voice message support to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS voice_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER;

-- Update RLS policies to include voice messages
-- (Existing policies should already cover voice_url and voice_duration)

-- Create storage bucket for voice messages if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for voice messages
CREATE POLICY "Anyone can view voice messages"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-messages');

CREATE POLICY "Authenticated users can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'voice-messages' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own voice messages"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'voice-messages' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
