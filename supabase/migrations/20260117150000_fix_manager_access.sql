-- ============================================================
-- FIX: MANAGER FEATURE ACCESS & MISSING POLICIES
-- Date: 2026-01-17
-- ============================================================

-- 1. ADD MISSING INSERT POLICIES
-- Without these, managers cannot create snapshots or register documents

-- Calculation Versions
DROP POLICY IF EXISTS "Managers can insert versions" ON public.calculation_versions;
CREATE POLICY "Managers can insert versions" ON public.calculation_versions
    FOR INSERT WITH CHECK (public.is_manager_or_admin());

-- Documents
DROP POLICY IF EXISTS "Managers can insert documents" ON public.documents;
CREATE POLICY "Managers can insert documents" ON public.documents
    FOR INSERT WITH CHECK (public.is_manager_or_admin());

-- Notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true); -- Usually internal, but allowing for now

-- 2. AUTO-LOGGING TO AUDIT_LOGS (For Timeline)
-- The old trigger used 'calculation_audit_log' which is NOT used by the new Manager Timeline UI.
-- This trigger will populate the 'audit_logs' table used by ProjectTimeline component.

CREATE OR REPLACE FUNCTION public.fn_log_to_audit_logs()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user (either from auth or from the record if system action)
    current_user_id := auth.uid();
    
    -- Status change log
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (
            current_user_id,
            'calculation_status_updated',
            'calculation',
            NEW.id::text,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'organization_name', NEW.organization_name
            )
        );
    END IF;

    -- Assignment log
    IF (OLD.manager_id IS NULL AND NEW.manager_id IS NOT NULL) THEN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (
            current_user_id,
            'calculation_assigned',
            'calculation',
            NEW.id::text,
            jsonb_build_object(
                'manager_id', NEW.manager_id,
                'organization_name', NEW.organization_name
            )
        );
    END IF;

    -- Expert adjustments log
    IF (OLD.results IS DISTINCT FROM NEW.results AND auth.uid() = NEW.manager_id) THEN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (
            current_user_id,
            'calculation_expert_adjusted',
            'calculation',
            NEW.id::text,
            jsonb_build_object(
                'version', NEW.version_number
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_to_audit_logs ON public.calculations;
CREATE TRIGGER trg_log_to_audit_logs
    AFTER UPDATE ON public.calculations
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_to_audit_logs();

-- 3. AUTO-NOTIFICATIONS TRIGGER
-- Creating notifications based on audit log entries

CREATE OR REPLACE FUNCTION public.fn_create_event_notifications()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id UUID;
    calc_row RECORD;
BEGIN
    -- Only handle calculation events for now
    IF (NEW.entity_type = 'calculation') THEN
        -- Get the calculation details
        SELECT * INTO calc_row FROM public.calculations WHERE id = NEW.entity_id::uuid;
        IF NOT FOUND THEN RETURN NEW; END IF;

        -- 1. Notify CLIENT when status changes (and it's not a draft move)
        IF (NEW.action = 'calculation_status_updated' AND calc_row.status NOT IN ('draft')) THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                calc_row.user_id,
                'Изменение статуса',
                'Статус вашего проекта «' || calc_row.organization_name || '» изменен на: ' || calc_row.status,
                'info',
                '/dashboard/calculations/' || calc_row.id
            );
        END IF;

        -- 2. Notify MANAGER when a project is assigned to them
        IF (NEW.action = 'calculation_assigned') THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                calc_row.manager_id,
                'Новый проект',
                'Вам назначен новый проект: «' || calc_row.organization_name || '»',
                'success',
                '/dashboard/pipeline' -- Or specific link if manager side routing exists
            );
        END IF;
        
        -- 3. Notify MANAGER if project becomes overdue (handled by a separate cron/task usually, 
        -- but we can log a 'system' event for it)
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_to_notifications ON public.audit_logs;
CREATE TRIGGER trg_audit_to_notifications
    AFTER INSERT ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.fn_create_event_notifications();

-- 4. FIX FOR 406 ERROR (If it was caused by specific select or recursion)
-- Ensure SELECT policy for versions doesn't depend on complex functions if possible
DROP POLICY IF EXISTS "Users can view versions of their projects" ON public.calculation_versions;
CREATE POLICY "Users can view versions of their projects" ON public.calculation_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.calculations c 
            WHERE c.id = calculation_versions.calculation_id 
            AND (c.user_id = auth.uid() OR c.manager_id = auth.uid() OR public.is_manager_or_admin())
        )
    );

-- Refresh the public cache for PostgREST
NOTIFY pgrst, 'reload schema';
