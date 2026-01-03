-- CLEANUP INVENTORY SCHEMA
-- Removing expert norms from the storage table to keep it as a pure Product Registry.

ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS norm_area;
ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS norm_personnel;
ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS norm_intensity;
