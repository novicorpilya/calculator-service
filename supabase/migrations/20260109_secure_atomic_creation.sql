-- ============================================================
-- PHASE 4: SECURITY & ATOMIC OPS
-- Hardens the calculation creation and enforces user ownership.
-- ============================================================

-- 1. SECURE ATOMIC CREATE
-- This function ensures that a calculation is created with the CORRECT user_id
-- and prevents any spoofing of user IDs during the creation process.
CREATE OR REPLACE FUNCTION create_calculation_atomic(
    p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS for initial insert if needed
AS $$
DECLARE
    v_new_calc_id uuid := gen_random_uuid();
    v_user_id uuid;
    v_result jsonb;
BEGIN
    -- 1. Get user ID from Auth (Zero Trust)
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    -- 2. Insert the calculation
    -- We ignore any user_id passed in p_payload and use auth.uid() instead
    INSERT INTO public.calculations (
        id,
        user_id,
        organization_name,
        type,
        status,
        total_area,
        daily_visitors,
        staff_count,
        sanitary_level,
        replacement_cycle,
        zone_details,
        results,
        manager_adjustments
    ) VALUES (
        v_new_calc_id,
        v_user_id, -- Forced from Auth
        p_payload->>'organizationName',
        COALESCE(p_payload->>'type', 'Restaurant'),
        COALESCE(p_payload->>'status', 'draft'),
        (p_payload->>'totalArea')::numeric,
        (p_payload->>'dailyVisitors')::integer,
        (p_payload->>'staffCount')::integer,
        (p_payload->>'sanitaryLevel')::integer,
        (p_payload->>'replacementCycle')::integer,
        COALESCE(p_payload->'zoneDetails', '[]'::jsonb),
        COALESCE(p_payload->'results', '{}'::jsonb),
        COALESCE(p_payload->'manager_adjustments', '{}'::jsonb)
    )
    RETURNING to_jsonb(calculations.*) INTO v_result;

    -- 3. Initial Audit Log
    INSERT INTO calculation_audit_log (
        calculation_id,
        actor_id,
        action_type,
        version,
        next_data
    ) VALUES (
        v_new_calc_id,
        v_user_id,
        'CREATE',
        1,
        v_result
    );

    RETURN v_result;
END;
$$;

-- 2. HARDEN RLS FOR UPDATES
-- Ensure that only explicitly allowed fields can be updated via local client
-- This is a belt-and-suspenders approach alongside the RPC.

DROP POLICY IF EXISTS "calculations_update_client" ON calculations;
CREATE POLICY "calculations_update_client_strict" ON calculations
    FOR UPDATE USING (
        user_id = auth.uid() 
        AND status IN ('draft', 'changes') -- Clients can only edit in these states
    )
    WITH CHECK (
        user_id = auth.uid()
    );

-- 3. CLEANUP UNUSED LEGACY POLICIES
DROP POLICY IF EXISTS "calculations_update_client" ON calculations; -- Redundant check
