-- ============================================================
-- PRODUCTION SECURITY HARDENING & ARCHITECTURAL REMEDIATION
-- Version: 2.0.0 | Date: 2026-01-19
-- Author: Principal Engineer
-- ============================================================

-- 1. STRICT STATUS MODEL (ENUM-like check)
ALTER TABLE public.calculations DROP CONSTRAINT IF EXISTS check_valid_status;
ALTER TABLE public.calculations ADD CONSTRAINT check_valid_status CHECK (
    status IN (
        'draft',              -- Черновик (клиент)
        'sent',               -- Отправлено эксперту (лид)
        'expert',             -- В работе у эксперта
        'changes',            -- Требуются правки (от клиента)
        'revision',           -- На проверке после правок
        'invoice',            -- Выставлен счет
        'payment_review',     -- Оплата на проверке
        'paid',               -- Оплачено
        'payment_rejected',   -- Оплата отклонена
        'processing',         -- В сборке
        'sent_to_warehouse',  -- Отправлено на склад
        'ready',              -- Готов к отгрузке
        'shipping',           -- В доставке
        'completed',          -- Завершено
        'closed'              -- В архиве
    )
);

-- 2. HARDENED HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('manager', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. SECURE perform_calculation_action
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
    -- 1. Must be authenticated
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Fetch current project state and check permissions
    SELECT * INTO v_calc_record FROM public.calculations WHERE id = p_calculation_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    -- Only owner, assigned manager or admin can perform actions
    IF NOT (v_calc_record.user_id = v_current_user_id OR v_calc_record.manager_id = v_current_user_id OR public.is_admin()) THEN
        -- Allow anyone to 'submit' if it's their project
        IF NOT (p_action_type = 'submit' AND v_calc_record.user_id = v_current_user_id) THEN
             -- Special case: Managers can 'assign' themselves to unassigned projects
             IF NOT (p_action_type = 'assign' AND v_calc_record.manager_id IS NULL AND public.is_manager_or_admin()) THEN
                RAISE EXCEPTION 'Access denied';
             END IF;
        END IF;
    END IF;

    -- 1. Определяем новый статус на основе действия
    CASE p_action_type
        WHEN 'assign' THEN 
            v_new_status := 'expert';
            v_manager_id := COALESCE((p_payload->>'manager_id')::UUID, v_current_user_id);
        WHEN 'submit' THEN v_new_status := 'sent';
        WHEN 'approve' THEN v_new_status := 'invoice';
        WHEN 'reject' THEN v_new_status := 'changes';
        WHEN 'resolve' THEN v_new_status := 'revision';
        WHEN 'submit_payment' THEN v_new_status := 'payment_review';
        WHEN 'accept_payment' THEN v_new_status := 'paid';
        WHEN 'reject_payment' THEN v_new_status := 'invoice';
        WHEN 'start_processing' THEN v_new_status := 'processing';
        WHEN 'send_to_warehouse' THEN v_new_status := 'sent_to_warehouse';
        WHEN 'mark_ready' THEN v_new_status := 'ready';
        WHEN 'start_shipping' THEN v_new_status := 'shipping';
        WHEN 'finish_project' THEN v_new_status := 'completed';
        WHEN 'archive' THEN v_new_status := 'closed';
        WHEN 'restore' THEN v_new_status := 'completed';
        ELSE v_new_status := NULL;
    END CASE;

    -- 2. Обновляем расчет
    UPDATE public.calculations
    SET status = COALESCE(v_new_status, status),
        manager_id = COALESCE(v_manager_id, manager_id),
        updated_at = NOW(),
        last_status_change_at = CASE WHEN v_new_status IS NOT NULL THEN NOW() ELSE last_status_change_at END
    WHERE id = p_calculation_id;

    -- 3. Работа с шаблонами сообщений
    IF v_new_status IS NOT NULL THEN
        -- Re-fetch for updated manager/names context
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

-- 4. SECURE adjust_calculation_expert
CREATE OR REPLACE FUNCTION public.adjust_calculation_expert(
    p_calculation_id UUID,
    p_results JSONB,
    p_adjustments JSONB,
    p_current_version INT
)
RETURNS VOID AS $$
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
    UPDATE public.calculations
    SET results = p_results,
        manager_adjustments = p_adjustments,
        version_number = version_number + 1,
        updated_at = NOW()
    WHERE id = p_calculation_id 
    AND version_number = p_current_version;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conflict: calculation was modified by another session';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. SECURE LOCKING FUNCTIONS
CREATE OR REPLACE FUNCTION public.acquire_calculation_lock(p_calculation_id UUID)
RETURNS SETOF public.calculations AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    -- [SECURITY CHECK]
    IF NOT (public.is_manager_or_admin()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.calculations
    SET locked_at = NOW(),
        locked_by = v_user_id,
        lock_expires_at = NOW() + INTERVAL '10 minutes'
    WHERE id = p_calculation_id
    AND (locked_by IS NULL OR locked_by = v_user_id OR lock_expires_at < NOW());

    RETURN QUERY SELECT * FROM public.calculations WHERE id = p_calculation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.release_calculation_lock(p_calculation_id UUID)
RETURNS SETOF public.calculations AS $$
BEGIN
    -- No strict security check needed for release if it's your lock, but still checking role
    UPDATE public.calculations
    SET locked_at = NULL,
        locked_by = NULL,
        lock_expires_at = NULL
    WHERE id = p_calculation_id
    AND (locked_by = auth.uid() OR public.is_admin());

    RETURN QUERY SELECT * FROM public.calculations WHERE id = p_calculation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. HARDEN RLS FOR PROFILES (PREVENT DATA LEAK)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

CREATE POLICY "profiles_select_strict" ON public.profiles FOR SELECT TO public
    USING (
        id = auth.uid()                        -- View own
        OR public.is_admin()                   -- Admin sees all
        OR (
            public.is_manager_or_admin()       -- Manager sees:
            AND EXISTS (
                SELECT 1 FROM public.calculations 
                WHERE (user_id = profiles.id AND manager_id = auth.uid()) -- Their clients
                OR (profiles.role = 'manager')                            -- All fellow managers
            )
        )
    );

-- 7. NOTIFICATIONS REALTIME FIX
-- Ensure notifications can only be inserted by system or authenticated user for themselves
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Cleanup old scripts that shouldn't be loose
-- (Will be handled by manual cleanup or just ignored as they are now shadowed by secure RPCs)

-- 8. PERFORMANCE VIEWS (OFFLOAD AGGREGATION TO DB)
CREATE OR REPLACE VIEW public.v_manager_stats_summary AS
SELECT 
    manager_id,
    COUNT(*) AS total_projects,
    COUNT(*) FILTER (WHERE status NOT IN ('draft', 'completed', 'closed')) AS active_projects,
    SUM(total_cost_value) FILTER (WHERE status IN ('completed', 'closed')) AS total_revenue,
    AVG(total_cost_value) FILTER (WHERE status IN ('completed', 'closed')) AS avg_check,
    CASE 
        WHEN COUNT(*) FILTER (WHERE status != 'draft') > 0 
        THEN (COUNT(*) FILTER (WHERE status IN ('completed', 'closed'))::FLOAT / COUNT(*) FILTER (WHERE status != 'draft')) * 100 
        ELSE 0 
    END AS conversion_rate
FROM public.calculations
GROUP BY manager_id;

-- Helper to find stale projects without fetching all
CREATE OR REPLACE VIEW public.v_stale_projects AS
SELECT 
    id,
    manager_id,
    user_id,
    organization_name,
    status,
    updated_at,
    total_cost_value,
    EXTRACT(DAY FROM NOW() - updated_at) AS days_in_status
FROM public.calculations
WHERE status IN ('invoice', 'sent', 'payment_review');

NOTIFY pgrst, 'reload schema';
