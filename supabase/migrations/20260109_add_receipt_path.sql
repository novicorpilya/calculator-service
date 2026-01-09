-- Add receipt_path to calculations table
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS receipt_path TEXT;

-- Update RLS for storage to be even more precise if possible
-- (Already handled in previous migration, but ensures calculation_id is part of path)
