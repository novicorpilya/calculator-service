-- ============================================================
-- FIX: Support Status Transitions from Expert Audit Mode
-- This migration ensures that 'reject' and 'approve' actions
-- work correctly when the calculation is in 'expert' status.
-- ============================================================

-- 1. Ensure the transition validator allows 'expert' -> 'changes' and 'expert' -> 'invoice'
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
        "payment_review": ["paid", "changes"],
        "paid": ["processing"],
        "processing": ["ready"],
        "ready": ["shipping"],
        "shipping": ["completed"],
        "completed": ["closed"],
        "closed": []
    }'::jsonb;
    allowed_array jsonb;
BEGIN
    allowed_array := allowed_transitions->old_status;
    IF allowed_array IS NULL THEN
        -- If status is not in the map, allow no transitions (safety)
        RETURN false;
    END IF;
    
    RETURN (allowed_array ? new_status);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Create the RPC function with UUID support (fixing typical 400 error)
-- We drop existing versions to avoid signature conflicts
DROP FUNCTION IF EXISTS perform_calculation_action(bigint, text, text, jsonb);
DROP FUNCTION IF EXISTS perform_calculation_action(uuid, text, text, jsonb);

CREATE OR REPLACE FUNCTION perform_calculation_action(
    p_calculation_id uuid,
    p_action_type text,
    p_message text DEFAULT NULL,
    p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_status text;
    v_next_status text;
    v_updated_calc jsonb;
BEGIN
    -- Get current status
    SELECT status INTO v_current_status FROM calculations WHERE id = p_calculation_id;
    
    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Project not found' USING ERRCODE = 'P0002';
    END IF;

    -- Map action to next status
    CASE p_action_type
        WHEN 'submit' THEN
            v_next_status := 'sent';
        WHEN 'approve' THEN
            v_next_status := 'invoice';
        WHEN 'reject' THEN
            v_next_status := 'changes';
        WHEN 'resolve' THEN
            v_next_status := 'revision';
        WHEN 'accept_payment' THEN
            v_next_status := 'paid';
        ELSE
            -- Try to use action as target status directly
            v_next_status := p_action_type;
    END CASE;

    -- Validate transition
    IF NOT validate_status_transition(v_current_status, v_next_status) THEN
        RAISE EXCEPTION 'Invalid status transition from "%" to "%" via action "%"', v_current_status, v_next_status, p_action_type;
    END IF;

    -- Execute Update
    UPDATE calculations
    SET 
        status = v_next_status,
        updated_at = NOW()
    WHERE id = p_calculation_id
    RETURNING to_jsonb(calculations.*) INTO v_updated_calc;

    RETURN v_updated_calc;
END;
$$;
