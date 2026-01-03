-- ADD STOCK COLUMN TO INVENTORY_ITEMS
-- Run this in Supabase SQL Editor

ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0;

-- Set some random stock for testing if needed
-- UPDATE public.inventory_items SET stock = floor(random() * 500 + 10);
