-- ADD SKU COLUMN TO INVENTORY_ITEMS
-- Run this in Supabase SQL Editor

ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS sku VARCHAR(100);

-- Update existing items with dummy SKUs if needed
UPDATE public.inventory_items SET sku = 'ART-' || id::text WHERE sku IS NULL;
