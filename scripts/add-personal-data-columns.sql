-- Add first_name and last_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update existing data if needed (optional)
-- UPDATE public.profiles SET first_name = 'Эксперт' WHERE role = 'manager' AND first_name IS NULL;
