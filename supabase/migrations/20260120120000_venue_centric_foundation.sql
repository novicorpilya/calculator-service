-- ============================================================
-- VENUE-CENTRIC FOUNDATION
-- Phase 1.1: Database Schema
-- Date: 2026-01-20
-- ============================================================

-- 1. Create venues table
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('restaurant', 'cafe', 'bar', 'hotel', 'other')),
    total_area NUMERIC DEFAULT 0,
    seating_capacity INT DEFAULT 0,
    staff_count INT DEFAULT 0,
    visitors_per_day INT DEFAULT 0,
    address TEXT,
    sanitary_level TEXT DEFAULT 'medium',
    intensity_level TEXT DEFAULT 'medium',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add venue_id to calculations
ALTER TABLE public.calculations 
ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL;

-- 3. RLS for venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venues_access_policy" ON public.venues;
CREATE POLICY "venues_access_policy" ON public.venues FOR ALL TO public
    USING (
        (SELECT auth.uid()) = owner_id 
        OR (SELECT public.is_manager_or_admin())
    )
    WITH CHECK ((SELECT auth.uid()) = owner_id);

-- 4. Shadow Mapping Background Trigger (Optional but good for data integrity)
-- This function will try to auto-map existing calculations to new venues if names match
-- for the same user. This is a pragmatic "Shadow Mapping" implementation.

CREATE OR REPLACE FUNCTION public.fn_shadow_map_calculation_to_venue()
RETURNS TRIGGER AS $$
DECLARE
    v_venue_id UUID;
BEGIN
    -- Only try to map if venue_id is null and we have an organization_name
    IF NEW.venue_id IS NULL AND NEW.organization_name IS NOT NULL THEN
        SELECT id INTO v_venue_id 
        FROM public.venues 
        WHERE owner_id = NEW.user_id AND name = NEW.organization_name
        LIMIT 1;
        
        IF v_venue_id IS NOT NULL THEN
            NEW.venue_id := v_venue_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_shadow_map_calculation ON public.calculations;
CREATE TRIGGER trg_shadow_map_calculation
    BEFORE INSERT OR UPDATE OF organization_name ON public.calculations
    FOR EACH ROW EXECUTE FUNCTION public.fn_shadow_map_calculation_to_venue();
