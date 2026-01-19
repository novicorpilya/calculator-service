-- ============================================================
-- Migration: Fix Lead Notifications for Managers
-- Date: 2026-01-18
-- ============================================================

-- 1. Update fn_log_to_audit_logs to handle INSERT
CREATE OR REPLACE FUNCTION public.fn_log_to_audit_logs()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user (either from auth or from the record if system action)
    current_user_id := auth.uid();
    
    -- Case: INSERT
    IF (TG_OP = 'INSERT') THEN
        -- If project is created immediately in any status other than draft
        IF (NEW.status != 'draft') THEN
            INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
            VALUES (
                current_user_id,
                'calculation_status_updated',
                'calculation',
                NEW.id::text,
                jsonb_build_object(
                    'old_status', NULL,
                    'new_status', NEW.status,
                    'organization_name', NEW.organization_name
                    -- 'is_new_project', true
                )
            );
        END IF;

    -- Case: UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
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
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Make sure the trigger handles INSERT correctly
DROP TRIGGER IF EXISTS trg_log_to_audit_logs ON public.calculations;
CREATE TRIGGER trg_log_to_audit_logs
    AFTER INSERT OR UPDATE ON public.calculations
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_to_audit_logs();

-- 3. Optimization/Fix for fn_create_event_notifications to ensure leads are noticed
-- (This part is already in 20260118000001_fix_notification_labels.sql but we ensure it works with the new INSERT logic)
-- No changes needed if it checks for NEW.action = 'calculation_status_updated' AND calc_row.status = 'sent'
