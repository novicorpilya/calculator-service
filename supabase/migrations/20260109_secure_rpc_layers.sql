-- ============================================================
-- STEP 5: SECURITY HARDENING (RPC GUARDS)
-- Implements Zero-Trust: verify auth.uid() inside SECURITY DEFINER functions.
-- ============================================================

CREATE OR REPLACE FUNCTION perform_calculation_action(
    p_calculation_id text,
    p_action_type text,
    p_message text DEFAULT NULL,
    p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
AS $$
DECLARE
    v_current_status text;
    v_target_user_id uuid;
    v_target_manager_id uuid;
    v_next_status text;
    v_updated_calc jsonb;
    v_manager_id uuid;
    v_user_role text;
BEGIN
    -- 1. FETCH CONTEXT & PERMISSIONS
    SELECT status, user_id, manager_id 
    INTO v_current_status, v_target_user_id, v_target_manager_id 
    FROM calculations WHERE id::text = p_calculation_id;
    
    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Project not found' USING ERRCODE = 'P0002';
    END IF;

    -- Get caller's role for staff-level actions
    SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();

    -- 2. SECURITY GUARD (Zero Trust)
    -- Rule: Users can only 'submit' or 'resolve' their OWN projects.
    -- Rule: Managers can perform staff actions.
    IF NOT (
        v_target_user_id = auth.uid() -- It's my project
        OR v_target_manager_id = auth.uid() -- I am the assigned manager
        OR v_user_role IN ('manager', 'admin') -- I am a staff member
    ) THEN
        RAISE EXCEPTION 'Access Denied: You do not have permission to act on this project' USING ERRCODE = '42501';
    END IF;

    -- 3. ACTION DISPATCHER
    CASE p_action_type
        WHEN 'assign' THEN
            -- Only staff can assign or reassign
            IF v_user_role NOT IN ('manager', 'admin') THEN
                RAISE EXCEPTION 'Only staff can assign managers';
            END IF;
            
            v_next_status := 'expert';
            v_manager_id := (p_payload->>'manager_id')::uuid;
            
            UPDATE calculations
            SET status = v_next_status, manager_id = v_manager_id, updated_at = NOW()
            WHERE id::text = p_calculation_id
            RETURNING to_jsonb(calculations.*) INTO v_updated_calc;

        WHEN 'log_error' THEN
            SELECT to_jsonb(calculations.*) INTO v_updated_calc FROM calculations WHERE id::text = p_calculation_id;

        -- Mapping friendly actions to statuses
        WHEN 'submit' THEN v_next_status := 'sent';
        WHEN 'approve' THEN v_next_status := 'invoice';
        WHEN 'reject' THEN v_next_status := 'changes';
        WHEN 'resolve' THEN v_next_status := 'revision';
        WHEN 'accept_payment' THEN v_next_status := 'paid';
        ELSE v_next_status := p_action_type;
    END CASE;

    -- 4. STATUS TRANSITION GUARD (Triggers will also catch this, but better safe here)
    IF v_updated_calc IS NULL THEN
        IF NOT validate_status_transition(v_current_status, v_next_status) THEN
            RAISE EXCEPTION 'Invalid transition: % -> % (%)', v_current_status, v_next_status, p_action_type;
        END IF;

        UPDATE calculations
        SET status = v_next_status, updated_at = NOW()
        WHERE id::text = p_calculation_id
        RETURNING to_jsonb(calculations.*) INTO v_updated_calc;
    END IF;

    -- 5. AUDIT LOG (Internal)
    INSERT INTO calculation_audit_log (
        calculation_id,
        actor_id,
        action_type,
        version,
        prev_data,
        next_data,
        diff_summary
    ) VALUES (
        (v_updated_calc->>'id')::uuid,
        auth.uid(),
        'ACTION_' || p_action_type,
        COALESCE((v_updated_calc->>'version_number')::integer, 1),
        jsonb_build_object('status', v_current_status, 'message', p_message),
        v_updated_calc,
        p_payload
    );

    RETURN v_updated_calc;
END;
$$;


-- SECURE EXPERT ADJUSTMENTS
CREATE OR REPLACE FUNCTION adjust_calculation_expert(
    p_calculation_id uuid,
    p_results jsonb,
    p_adjustments jsonb,
    p_current_version integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_calc jsonb;
    v_manager_id uuid;
    v_user_role text;
BEGIN
    -- 1. PERMISSION CHECK
    SELECT manager_id INTO v_manager_id FROM calculations WHERE id = p_calculation_id;
    SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();

    IF NOT (v_manager_id = auth.uid() OR v_user_role = 'admin') THEN
        RAISE EXCEPTION 'Only the assigned manager or admin can adjust results' USING ERRCODE = '42501';
    END IF;

    -- 2. UPDATE
    UPDATE calculations
    SET 
        results = p_results,
        manager_adjustments = p_adjustments,
        version_number = p_current_version
    WHERE id = p_calculation_id
    RETURNING to_jsonb(calculations.*) INTO v_updated_calc;

    RETURN v_updated_calc;
END;
$$;
