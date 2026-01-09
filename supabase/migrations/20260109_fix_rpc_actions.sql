-- ============================================================
-- FIX: Robust Calculation Actions RPC
-- 1. Handles 'assign' action (setting manager_id)
-- 2. Handles 'log_error' action (audit only)
-- 3. Supports both UUID and BIGINT by allowing TEXT cast
-- ============================================================

-- Update transition validator to be more permissive for payment flows
CREATE OR REPLACE FUNCTION validate_status_transition(
    old_status text,
    new_status text
) RETURNS boolean AS $$
DECLARE
    allowed_transitions jsonb := '{
        "draft": ["sent"],
        "sent": ["expert", "changes", "invoice"],
        "expert": ["changes", "invoice"],
        "changes": ["revision", "sent"],
        "revision": ["expert", "invoice"],
        "invoice": ["payment_review", "changes"],
        "payment_review": ["paid", "changes", "invoice"],
        "paid": ["processing"],
        "processing": ["ready"],
        "ready": ["shipping"],
        "shipping": ["completed"],
        "completed": ["closed"],
        "closed": []
    }'::jsonb;
    allowed_array jsonb;
BEGIN
    if old_status = new_status THEN RETURN true; END IF;
    allowed_array := allowed_transitions->old_status;
    IF allowed_array IS NULL THEN RETURN false; END IF;
    RETURN (allowed_array ? new_status);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ensure audit log table exists
CREATE TABLE IF NOT EXISTS calculation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID NOT NULL, -- We removed FK for robustness if IDs are mixed types, or use TEXT
    actor_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    version INTEGER NOT NULL,
    prev_data JSONB,
    next_data JSONB,
    diff_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- First, drop the strict UUID version to avoid signature confusion
DROP FUNCTION IF EXISTS perform_calculation_action(uuid, text, text, jsonb);
DROP FUNCTION IF EXISTS perform_calculation_action(bigint, text, text, jsonb);

CREATE OR REPLACE FUNCTION perform_calculation_action(
    p_calculation_id text, -- Use text to accommodate both uuid and bigint
    p_action_type text,
    p_message text DEFAULT NULL,
    p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_calc_id_uuid uuid;
    v_calc_id_int bigint;
    v_current_status text;
    v_next_status text;
    v_updated_calc jsonb;
    v_manager_id uuid;
BEGIN
    -- 1. Parse ID (try UUID, then BigInt)
    BEGIN
        v_calc_id_uuid := p_calculation_id::uuid;
    EXCEPTION WHEN others THEN
        BEGIN
            v_calc_id_int := p_calculation_id::bigint;
        EXCEPTION WHEN others THEN
            RAISE EXCEPTION 'Invalid calculation ID format' USING ERRCODE = 'P0003';
        END;
    END;

    -- 2. Get current state
    IF v_calc_id_uuid IS NOT NULL THEN
        SELECT status INTO v_current_status FROM calculations WHERE id = v_calc_id_uuid;
    ELSE
        SELECT status INTO v_current_status FROM calculations WHERE id::text = p_calculation_id;
    END IF;
    
    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Project not found' USING ERRCODE = 'P0002';
    END IF;

    -- 3. Handle Special Actions
    CASE p_action_type
        WHEN 'assign' THEN
            v_next_status := 'expert';
            v_manager_id := (p_payload->>'manager_id')::uuid;
            
            IF v_manager_id IS NULL THEN
                RAISE EXCEPTION 'manager_id is required for assign action' USING ERRCODE = 'P0004';
            END IF;

            UPDATE calculations
            SET 
                status = v_next_status,
                manager_id = v_manager_id,
                updated_at = NOW()
            WHERE (id = v_calc_id_uuid OR id::text = p_calculation_id)
            RETURNING to_jsonb(calculations.*) INTO v_updated_calc;

        WHEN 'log_error' THEN
            -- Just update the updated_at to trigger audit log if needed, or just return current
            -- Usually we want to record the error in history
            -- For now, just return the current record
            SELECT to_jsonb(calculations.*) INTO v_updated_calc 
            FROM calculations 
            WHERE (id = v_calc_id_uuid OR id::text = p_calculation_id);

        WHEN 'submit' THEN v_next_status := 'sent';
        WHEN 'approve' THEN v_next_status := 'invoice';
        WHEN 'reject' THEN v_next_status := 'changes';
        WHEN 'resolve' THEN v_next_status := 'revision';
        WHEN 'accept_payment' THEN v_next_status := 'paid';
        ELSE
            v_next_status := p_action_type;
    END CASE;

    -- 4. Regular Status Transitions (if not already updated by special action)
    IF v_updated_calc IS NULL THEN
        -- Validate transition
        IF NOT validate_status_transition(v_current_status, v_next_status) THEN
            RAISE EXCEPTION 'Invalid status transition from "%" to "%" via action "%"', v_current_status, v_next_status, p_action_type;
        END IF;

        UPDATE calculations
        SET 
            status = v_next_status,
            updated_at = NOW()
        WHERE (id = v_calc_id_uuid OR id::text = p_calculation_id)
        RETURNING to_jsonb(calculations.*) INTO v_updated_calc;
    END IF;

    -- 5. Always record in audit log
    INSERT INTO calculation_audit_log (
        calculation_id,
        actor_id,
        action_type,
        version,
        prev_data,
        next_data,
        diff_summary
    ) VALUES (
        COALESCE(v_calc_id_uuid, (v_updated_calc->>'id')::uuid),
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
