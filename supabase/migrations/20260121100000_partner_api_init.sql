-- ============================================================
-- Migration: Partner API & Optimized Calculations
-- Description: Adds partners table for API access and a view for fast calculations.
-- ============================================================

-- 1. Partners Table for API Integrations
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    api_key_hash TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    rate_limit_quota INT DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_partners_api_key_hash ON public.partners (api_key_hash);

-- 2. Optimized View for Calculation Engine
-- Returns only columns necessary for the logic, reducing memory footprint in Edge Functions.
CREATE OR REPLACE VIEW public.v_inventory_calculation AS
SELECT 
    name,
    sku,
    color,
    price,
    stock,
    norm_area,
    norm_personnel,
    norm_intensity,
    replacement_cycle_days,
    category,
    series,
    durability,
    supplier_id
FROM public.inventory_items
WHERE stock > -1; -- Explicitly filter items that might be marked inactive/out-of-stock if needed

-- 3. Security: Granular permissions for the service role (used by Edge Functions)
GRANT SELECT ON public.v_inventory_calculation TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.partners TO service_role;
