-- ============================================================
-- RPC PERFORMANCE OPTIMIZATION (Eliminate N+1)
-- Version: 2.1.0 | Date: 2026-01-19
-- ============================================================

-- Fix adjust_calculation_expert to return the updated record
-- This avoids calling getById() immediately after.

DROP FUNCTION IF EXISTS public.adjust_calculation_expert(UUID, JSONB, JSONB, INT);

CREATE OR REPLACE FUNCTION public.adjust_calculation_expert(
    p_calculation_id UUID,
    p_results JSONB,
    p_adjustments JSONB,
    p_current_version INT
)
RETURNS SETOF public.calculations AS $$
DECLARE
    v_current_user_id UUID := auth.uid();
BEGIN
    -- [SECURITY CHECK]
    IF NOT EXISTS (
        SELECT 1 FROM public.calculations 
        WHERE id = p_calculation_id 
        AND (manager_id = v_current_user_id OR public.is_admin())
    ) THEN
        RAISE EXCEPTION 'Only assigned manager or admin can adjust results';
    END IF;

    -- Perform adjustment with version check (optimistic lock)
    RETURN QUERY
    UPDATE public.calculations
    SET results = p_results,
        manager_adjustments = p_adjustments,
        version_number = version_number + 1,
        updated_at = NOW()
    WHERE id = p_calculation_id 
    AND version_number = p_current_version
    RETURNING *;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conflict: calculation was modified by another session';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
