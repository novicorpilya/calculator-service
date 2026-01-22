-- ============================================================
-- PHASE 2: Intelligence & Collaboration
-- Version: 2.1.0 | Date: 2026-01-20
-- ============================================================

-- 1. Sync Venue Types with Application Logic
ALTER TABLE public.venues DROP CONSTRAINT IF EXISTS venues_type_check;
ALTER TABLE public.venues ADD CONSTRAINT venues_type_check CHECK (
    type IN ('restaurant', 'cafe', 'bar', 'hotel', 'production_food', 'production_nonfood', 'beauty', 'mall', 'other')
);

-- 2. Track Cloned Calculations for Intelligence/History
ALTER TABLE public.calculations ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES public.calculations(id) ON DELETE SET NULL;

-- 3. Enhance Versioning (adjust_calculation_expert)
-- Redefine to return a single record and automatically save snapshots
DROP FUNCTION IF EXISTS public.adjust_calculation_expert(UUID, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.adjust_calculation_expert(UUID, JSONB, JSONB, INT);
DROP FUNCTION IF EXISTS public.adjust_calculation_expert(UUID, JSONB, JSONB, INTEGER);

CREATE OR REPLACE FUNCTION public.adjust_calculation_expert(
    p_calculation_id UUID,
    p_results JSONB,
    p_adjustments JSONB,
    p_current_version INT
)
RETURNS public.calculations AS $$
DECLARE
    v_current_user_id UUID := auth.uid();
    v_server_version INT;
    v_updated_record public.calculations;
    v_base_price NUMERIC := 0;
    v_total_cost NUMERIC := 0;
BEGIN
    -- 1. SECURITY & EXISTENCE CHECK
    SELECT version_number INTO v_server_version 
    FROM public.calculations 
    WHERE id = p_calculation_id;

    IF v_server_version IS NULL AND NOT EXISTS(SELECT 1 FROM public.calculations WHERE id = p_calculation_id) THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.calculations 
        WHERE id = p_calculation_id 
        AND (manager_id = v_current_user_id OR public.is_admin())
    ) THEN
        RAISE EXCEPTION 'Permission denied: Not your project';
    END IF;

    -- 2. CALCULATE TOTAL COST (Consistency)
    -- Sum of (price * quantity) from summary items
    SELECT COALESCE(SUM((item->>'price')::NUMERIC * (item->>'quantity')::NUMERIC), 0)
    INTO v_base_price
    FROM jsonb_array_elements(COALESCE(p_results->'summary', '[]'::jsonb)) AS item;

    v_total_cost := ROUND((v_base_price * COALESCE((p_adjustments->>'global_margin')::NUMERIC, 1.0) 
                  + COALESCE((p_adjustments->>'delivery_cost')::NUMERIC, 0)
                  + COALESCE((p_adjustments->>'service_cost')::NUMERIC, 0)) * 1.20);

    -- 3. SNAPSHOT (Save current state to history BEFORE update)
    INSERT INTO public.calculation_versions (
        calculation_id,
        version_number,
        snapshot_data,
        created_by,
        change_reason
    )
    SELECT 
        id,
        COALESCE(version_number, 1),
        jsonb_build_object(
            'results', COALESCE(results, '{}'::jsonb),
            'adjustments', COALESCE(manager_adjustments, '{}'::jsonb),
            'total_cost', COALESCE(total_cost_value, 0)
        ),
        v_current_user_id,
        'Expert adjustment'
    FROM public.calculations
    WHERE id = p_calculation_id
    ON CONFLICT (calculation_id, version_number) DO NOTHING;

    -- 4. ATOMIC UPDATE (Optimistic Lock)
    UPDATE public.calculations
    SET results = p_results,
        manager_adjustments = p_adjustments,
        total_cost_value = v_total_cost,
        version_number = COALESCE(v_server_version, 1) + 1,
        updated_at = NOW()
    WHERE id = p_calculation_id 
    AND (version_number = p_current_version OR (version_number IS NULL AND p_current_version = 1))
    RETURNING * INTO v_updated_record;

    -- 5. CONFLICT / IDEMPOTENCY HANDLING
    IF v_updated_record.id IS NULL THEN
        -- Check if it was already updated (Idempotency for network retries)
        IF v_server_version = p_current_version + 1 THEN
            SELECT * INTO v_updated_record FROM public.calculations WHERE id = p_calculation_id;
            RETURN v_updated_record;
        END IF;

        RAISE EXCEPTION 'CONCURRENCY_CONFLICT: Project was modified (Server v%, Client v%)', COALESCE(v_server_version, 1), p_current_version;
    END IF;

    RETURN v_updated_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Admin tool: Clear history
CREATE OR REPLACE FUNCTION public.fn_clear_calculation_versions(p_calculation_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Only assigned manager or admin can clear history
    IF NOT EXISTS (
        SELECT 1 FROM public.calculations 
        WHERE id = p_calculation_id 
        AND (manager_id = auth.uid() OR public.is_admin())
    ) THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    DELETE FROM public.calculation_versions WHERE calculation_id = p_calculation_id;
    
    -- Reset version number on calculation
    UPDATE public.calculations SET version_number = 1 WHERE id = p_calculation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Benchmark Views for Intelligence Dashboard
CREATE OR REPLACE VIEW public.v_venue_efficiency_benchmarks AS
SELECT 
    v.id as venue_id,
    v.name as venue_name,
    v.type as venue_type,
    v.total_area,
    c.id as calculation_id,
    c.total_cost_value,
    (c.total_cost_value / NULLIF(v.total_area, 0)) as cost_per_m2,
    (c.total_cost_value / NULLIF(v.staff_count, 0)) as cost_per_staff,
    c.created_at as calculation_date
FROM public.venues v
JOIN public.calculations c ON v.id = c.venue_id
WHERE c.status IN ('paid', 'completed', 'ready', 'invoice');

-- 5. Anomaly Detection Helper (Standard Deviations)
CREATE OR REPLACE VIEW public.v_sector_averages AS
SELECT 
    venue_type,
    AVG(cost_per_m2) as avg_cost_per_m2,
    STDDEV(cost_per_m2) as stddev_cost_per_m2,
    COUNT(*) as sample_size
FROM public.v_venue_efficiency_benchmarks
GROUP BY venue_type;

NOTIFY pgrst, 'reload schema';
