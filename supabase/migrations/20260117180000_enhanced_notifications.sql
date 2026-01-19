-- ============================================================
-- Migration: Enhanced Real-time Notifications (Senior Team Lead Edition)
-- Date: 2026-01-17
-- Description: Improves the bell notification system to handle messages, 
--              new leads, and document generation.
-- ============================================================

-- 1. ADD LOGGING TRIGGERS FOR MESSAGES & DOCUMENTS
-- These tables weren't automatically logging to audit_logs yet.

-- Messages logging
CREATE OR REPLACE FUNCTION public.fn_log_message_to_audit()
RETURNS TRIGGER AS $$
BEGIN
    -- Log only human messages (skip system scripts)
    IF (NEW.metadata->>'is_system' IS NULL OR NEW.metadata->>'is_system' = 'false') THEN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (
            NEW.sender_id,
            'message_sent',
            'message',
            NEW.id::text,
            jsonb_build_object(
                'calculation_id', NEW.calculation_id,
                'content_preview', substring(NEW.content from 1 for 50)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_message_to_audit ON public.messages;
CREATE TRIGGER trg_log_message_to_audit
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_message_to_audit();

-- Documents logging
CREATE OR REPLACE FUNCTION public.fn_log_document_to_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
        NEW.created_by,
        'document_generated',
        'document',
        NEW.id::text,
        jsonb_build_object(
            'calculation_id', NEW.calculation_id,
            'type', NEW.type,
            'file_name', NEW.file_name
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_document_to_audit ON public.documents;
CREATE TRIGGER trg_log_document_to_audit
    AFTER INSERT ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_document_to_audit();


-- 2. REFACTORED NOTIFICATION ENGINE
-- Handles more events and delivers to the right people.

CREATE OR REPLACE FUNCTION public.fn_create_event_notifications()
RETURNS TRIGGER AS $$
DECLARE
    calc_row RECORD;
    sender_profile RECORD;
    mgr_record RECORD;
    msg_row RECORD;
    doc_row RECORD;
BEGIN
    -- SENIOR SAFETY: Notification failure must NEVER block the main transaction
    BEGIN
        -- CASE A: CALCULATION EVENTS (Status changes, Assignments)
        IF (NEW.entity_type = 'calculation') THEN
            SELECT * INTO calc_row FROM public.calculations WHERE id = NEW.entity_id::uuid;
            IF FOUND THEN
                -- 1. Notify ALL Managers about a NEW LEAD (Status: Draft -> Sent)
                IF (NEW.action = 'calculation_status_updated' AND calc_row.status = 'sent') THEN
                    FOR mgr_record IN SELECT id FROM public.profiles WHERE role IN ('manager', 'admin') LOOP
                        IF (mgr_record.id != NEW.user_id OR NEW.user_id IS NULL) THEN
                            INSERT INTO public.notifications (user_id, title, message, type, link)
                            VALUES (
                                mgr_record.id,
                                '🆕 Новая заявка!',
                                'Поступил новый запрос от «' || COALESCE(calc_row.organization_name, 'Проект') || '»',
                                'alert',
                                '/dashboard/pipeline'
                            );
                        END IF;
                    END LOOP;
                END IF;

                -- 2. Notify CLIENT when status changes (excluding draft/sent/revision)
                --    Note: 'revision' means client sent it back, so THEY changed it.
                IF (NEW.action = 'calculation_status_updated' AND calc_row.status NOT IN ('draft', 'sent', 'revision')) THEN
                    INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (
                        calc_row.user_id,
                        'Статус проекта обновлен',
                        'Проект «' || COALESCE(calc_row.organization_name, '...') || '» теперь в статусе: ' || calc_row.status,
                        'info',
                        '/dashboard/calculations/' || calc_row.id
                    );
                END IF;

                -- 3. Notify MANAGER:
                --    a) When specifically assigned
                --    b) When client returns project from changes (status: 'revision')
                IF (NEW.action = 'calculation_assigned') THEN
                    INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (
                        calc_row.manager_id,
                        '💼 Вам назначен проект',
                        'Вы назначены ответственным за проект «' || COALESCE(calc_row.organization_name, '...') || '»',
                        'success',
                        '/dashboard/pipeline'
                    );
                ELSIF (NEW.action = 'calculation_status_updated' AND calc_row.status = 'revision' AND calc_row.manager_id IS NOT NULL) THEN
                     INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (
                        calc_row.manager_id,
                        '✏️ Клиент внес правки',
                        'Проект «' || COALESCE(calc_row.organization_name, '...') || '» возвращен на проверку (Revision)',
                        'alert',
                        '/dashboard/pipeline'
                    );
                ELSIF (NEW.action = 'calculation_status_updated' AND calc_row.status = 'payment_review' AND calc_row.manager_id IS NOT NULL) THEN
                     INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (
                        calc_row.manager_id,
                        '💸 Оплата на проверке',
                        'Клиент прикрепил чек к проекту «' || COALESCE(calc_row.organization_name, '...') || '»',
                        'alert',
                        '/dashboard/pipeline'
                    );
                END IF;
            END IF;
        END IF;

        -- CASE B: MESSAGE EVENTS
        IF (NEW.entity_type = 'message') THEN
            SELECT * INTO msg_row FROM public.messages WHERE id = NEW.entity_id::uuid;
            IF FOUND THEN
                SELECT TRIM(CONCAT(first_name, ' ', last_name)) as name, role 
                INTO sender_profile FROM public.profiles WHERE id = msg_row.sender_id;
                
                IF FOUND THEN
                    IF (msg_row.calculation_id IS NOT NULL) THEN
                        SELECT * INTO calc_row FROM public.calculations WHERE id = msg_row.calculation_id;
                        IF FOUND THEN
                            IF (sender_profile.role IN ('manager', 'admin')) THEN
                                INSERT INTO public.notifications (user_id, title, message, type, link)
                                VALUES (calc_row.user_id, '💬 Новое сообщение', 
                                    COALESCE(sender_profile.name, 'Менеджер') || ': ' || COALESCE(NEW.details->>'content_preview', '...'),
                                    'info', '/dashboard/calculations/' || calc_row.id);
                            ELSIF (calc_row.manager_id IS NOT NULL AND msg_row.sender_id != calc_row.manager_id) THEN
                                INSERT INTO public.notifications (user_id, title, message, type, link)
                                VALUES (calc_row.manager_id, '💬 Сообщение от клиента', 
                                    '«' || COALESCE(calc_row.organization_name, '...') || '»: ' || COALESCE(NEW.details->>'content_preview', '...'),
                                    'info', '/dashboard/pipeline');
                            END IF;
                        END IF;
                    ELSIF (msg_row.receiver_id IS NOT NULL) THEN
                        INSERT INTO public.notifications (user_id, title, message, type, link)
                        VALUES (msg_row.receiver_id, '💬 Личное сообщение',
                            COALESCE(sender_profile.name, 'Пользователь') || ': ' || COALESCE(NEW.details->>'content_preview', '...'),
                            'info', '/dashboard/chat');
                    END IF;
                END IF;
            END IF;
        END IF;

        -- CASE C: DOCUMENT EVENTS
        IF (NEW.entity_type = 'document') THEN
            SELECT * INTO doc_row FROM public.documents WHERE id = NEW.entity_id::uuid;
            IF FOUND THEN
                SELECT * INTO calc_row FROM public.calculations WHERE id = doc_row.calculation_id;
                IF FOUND THEN
                    INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (
                        calc_row.user_id,
                        '📄 Документ готов',
                        'Для проекта «' || COALESCE(calc_row.organization_name, '...') || '» сформирован ' || 
                        CASE WHEN doc_row.type = 'kp' THEN 'Коммерческое предложение' 
                             WHEN doc_row.type = 'invoice' THEN 'Счет на оплату'
                             ELSE 'Новый документ' END,
                        'success',
                        '/dashboard/calculations/' || calc_row.id
                    );
                END IF;
            END IF;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- Log to console just in case, but let the primary action succeed
        RAISE WARNING 'Notification trigger failed for audit_log %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger to audit_logs
DROP TRIGGER IF EXISTS trg_audit_to_notifications ON public.audit_logs;
CREATE TRIGGER trg_audit_to_notifications
    AFTER INSERT ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.fn_create_event_notifications();

-- Refresh the public cache for PostgREST
NOTIFY pgrst, 'reload schema';
