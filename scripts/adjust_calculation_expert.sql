-- RPC for expert adjustments to a calculation
-- Updates results and manager adjustments while incrementing version

-- DROP first because return type might have changed from SETOF or other types in previous attempts
DROP FUNCTION IF EXISTS public.adjust_calculation_expert(UUID, JSONB, JSONB, INT);

CREATE OR REPLACE FUNCTION public.adjust_calculation_expert(
    p_calculation_id UUID,
    p_results JSONB,
    p_adjustments JSONB,
    p_current_version INT
)
RETURNS VOID AS $$
BEGIN
    -- Check if current user is manager or admin
    IF NOT public.is_manager_or_admin() THEN
        RAISE EXCEPTION 'Only managers or admins can adjust calculations';
    END IF;

    -- Update calculation
    UPDATE public.calculations
    SET 
        results = p_results,
        manager_adjustments = p_adjustments,
        version_number = p_current_version + 1,
        updated_at = NOW()
    WHERE id = p_calculation_id;

    -- Optional: Log to audit trail
    INSERT INTO public.calculation_audit_log (calculation_id, user_id, type, payload)
    VALUES (
        p_calculation_id,
        auth.uid(),
        'calculation.expert_adjustment',
        jsonb_build_object(
            'version', p_current_version + 1,
            'adjustments', p_adjustments
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog, temp;
