-- Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS policies to allow users to update their own avatar_url
-- (Assuming policies already exist for other profile fields, this column will fall under existing UPDATE policies if they allow all columns)
-- If there's a specific column list in the policy, we might need to update it, but usually standard policies allow updating any column.
