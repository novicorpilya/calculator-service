-- ============================================================
-- Migration: Fix Payment Rejection Flow
-- Date: 2026-01-18
-- ============================================================

-- 1. Add template for PAYMENT_REJECTED status
INSERT INTO public.sys_message_templates (trigger_status, body_markdown, action_config)
VALUES 
(
    'PAYMENT_REJECTED', 
    E'Внимание, {{organizationName}}! ⚠️\n\nПодтверждение оплаты по заказу №{{projectNo}} отклонено.\n\n━━━━━━━━━━━━━━━━━━━\n\n❌ *Менеджер не смог подтвердить ваш платеж по предоставленному чеку.*\n\nПожалуйста, перепроверьте данные и загрузите корректный чек об оплате в деталях проекта. Если у вас возникли вопросы, вы можете написать менеджеру в чате.',
    '{"type": "alert_card", "severity": "error", "title": "Оплата отклонена", "description": "Загрузите корректный чек об оплате"}'
)
ON CONFLICT (trigger_status) DO UPDATE SET
    body_markdown = EXCLUDED.body_markdown,
    action_config = EXCLUDED.action_config;

-- 2. Update the perform_calculation_action function to correctly handle reject_payment
CREATE OR REPLACE FUNCTION perform_calculation_action(
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
BEGIN
    -- 1. Определяем новый статус на основе действия
    CASE p_action_type
        WHEN 'assign' THEN 
            v_new_status := 'expert';
            v_manager_id := (p_payload->>'manager_id')::UUID;
        WHEN 'submit' THEN v_new_status := 'sent';
        WHEN 'approve' THEN v_new_status := 'invoice';
        WHEN 'reject' THEN v_new_status := 'changes';
        WHEN 'resolve' THEN v_new_status := 'revision';
        WHEN 'submit_payment' THEN v_new_status := 'payment_review';
        WHEN 'accept_payment' THEN v_new_status := 'paid';
        WHEN 'reject_payment' THEN v_new_status := 'payment_rejected'; -- FIXED: was 'invoice'
        WHEN 'start_processing' THEN v_new_status := 'processing';
        WHEN 'send_to_warehouse' THEN v_new_status := 'sent_to_warehouse';
        WHEN 'mark_ready' THEN v_new_status := 'ready';
        WHEN 'start_shipping' THEN v_new_status := 'shipping';
        WHEN 'finish_project' THEN v_new_status := 'completed';
        ELSE v_new_status := NULL;
    END CASE;

    -- 2. Обновляем расчет
    IF v_new_status IS NOT NULL THEN
        UPDATE public.calculations
        SET status = v_new_status,
            manager_id = COALESCE(v_manager_id, manager_id),
            updated_at = NOW(),
            last_status_change_at = NOW()
        WHERE id = p_calculation_id;
    ELSE
        UPDATE public.calculations SET updated_at = NOW() WHERE id = p_calculation_id;
    END IF;

    -- 3. Работа с шаблонами сообщений
    -- ADDED 'payment_rejected' to the list
    IF v_new_status IN ('expert', 'paid', 'payment_review', 'payment_rejected', 'invoice', 'processing', 'sent_to_warehouse', 'ready', 'shipping', 'completed') THEN
        -- Получаем данные для подстановки
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

        -- Ищем шаблон по статусу или действию
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

            -- Определяем message_type из конфига
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
                COALESCE(v_calc_record.manager_id, v_calc_record.user_id),
                p_calculation_id,
                v_template_body,
                v_message_type,
                jsonb_build_object('is_system', true, 'trigger', v_new_status) || COALESCE(v_template_action_config, '{}'::jsonb)
            );
        END IF;
    END IF;

    RETURN QUERY SELECT * FROM public.calculations WHERE id = p_calculation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
