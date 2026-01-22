-- ============================================================
-- FIX: AUTO-ASSIGN MANAGER ON ANY STATUS TRANSITION
-- Purpose: Allow manager_id to be set via payload for any action, not just 'assign'
-- ============================================================

CREATE OR REPLACE FUNCTION public.perform_calculation_action(
    p_calculation_id UUID,
    p_action_type TEXT,
    p_message TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF public.calculations AS $$
DECLARE
    v_manager_id UUID;
    v_new_status TEXT;
    v_template_body TEXT;
    v_template_action_config JSONB;
    v_calc_record RECORD;
    v_message_type TEXT := 'text';
    v_current_user_id UUID := auth.uid();
BEGIN
    -- [SECURITY CHECK] 
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_calc_record FROM public.calculations WHERE id = p_calculation_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    -- Permission check (simplified for managers)
    IF NOT (v_calc_record.user_id = v_current_user_id OR v_calc_record.manager_id = v_current_user_id OR public.is_manager_or_admin()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Check if manager_id is being explicitly set in payload (for auto-assignment on drag)
    IF p_payload ? 'manager_id' THEN
        v_manager_id := (p_payload->>'manager_id')::UUID;
    END IF;

    -- Determine new status based on action
    CASE p_action_type
        WHEN 'assign' THEN 
            v_new_status := 'expert';
            -- If no explicit manager_id in payload for 'assign', use current user
            IF v_manager_id IS NULL THEN
                v_manager_id := v_current_user_id;
            END IF;
        WHEN 'expert' THEN v_new_status := 'expert';
        WHEN 'submit' THEN v_new_status := 'sent';
        WHEN 'approve' THEN v_new_status := 'invoice';
        WHEN 'reject' THEN v_new_status := 'changes';
        WHEN 'resolve' THEN v_new_status := 'revision';
        WHEN 'submit_payment' THEN v_new_status := 'payment_review';
        WHEN 'accept_payment' THEN v_new_status := 'paid';
        WHEN 'reject_payment' THEN v_new_status := 'payment_rejected';
        WHEN 'start_processing' THEN v_new_status := 'processing';
        WHEN 'send_to_warehouse' THEN v_new_status := 'sent_to_warehouse';
        WHEN 'mark_ready' THEN v_new_status := 'ready';
        WHEN 'start_shipping' THEN v_new_status := 'shipping';
        WHEN 'finish_project' THEN v_new_status := 'completed';
        WHEN 'archive' THEN v_new_status := 'closed';
        WHEN 'restore' THEN v_new_status := 'completed';
        ELSE v_new_status := NULL;
    END CASE;

    -- Update calculation
    UPDATE public.calculations
    SET status = COALESCE(v_new_status, status),
        manager_id = COALESCE(v_manager_id, manager_id),
        updated_at = NOW(),
        last_status_change_at = CASE WHEN v_new_status IS NOT NULL THEN NOW() ELSE last_status_change_at END
    WHERE id = p_calculation_id;

    -- System messages
    IF v_new_status IS NOT NULL THEN
        SELECT 
            c.project_number, 
            c.organization_name, 
            TRIM(CONCAT(mp.first_name, ' ', mp.last_name)) as manager_name,
            cp.first_name as client_name,
            c.manager_id,
            c.user_id
        INTO v_calc_record
        FROM public.calculations c
        LEFT JOIN public.profiles mp ON mp.id = c.manager_id
        LEFT JOIN public.profiles cp ON cp.id = c.user_id
        WHERE c.id = p_calculation_id;

        SELECT body_markdown, action_config 
        INTO v_template_body, v_template_action_config
        FROM public.sys_message_templates 
        WHERE trigger_status = UPPER(v_new_status)
           OR trigger_status = UPPER(p_action_type);

        IF v_template_body IS NOT NULL THEN
            v_template_body := replace(v_template_body, '{{projectNo}}', v_calc_record.project_number::text);
            v_template_body := replace(v_template_body, '{{organizationName}}', v_calc_record.organization_name);
            v_template_body := replace(v_template_body, '{{managerName}}', COALESCE(v_calc_record.manager_name, 'Эксперт'));
            v_template_body := replace(v_template_body, '{{clientName}}', COALESCE(v_calc_record.client_name, 'Клиент'));

            IF v_template_action_config IS NOT NULL AND v_template_action_config ? 'type' THEN
                v_message_type := v_template_action_config->>'type';
            END IF;

            INSERT INTO public.messages (
                sender_id,
                calculation_id,
                content,
                message_type,
                metadata
            ) VALUES (
                v_current_user_id,
                p_calculation_id,
                v_template_body,
                v_message_type,
                jsonb_build_object('is_system', true, 'trigger', v_new_status) || COALESCE(v_template_action_config, '{}'::jsonb)
            );
        END IF;
    END IF;

    RETURN QUERY SELECT * FROM public.calculations WHERE id = p_calculation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
