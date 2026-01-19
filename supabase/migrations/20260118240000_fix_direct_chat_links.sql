-- Migration: Fix Direct Chat Links & Dashboard Routing
-- Date: 2026-01-18
-- Description: Updates the notification engine to use correct platform deep links.
--              Personal messages now link to /dashboard/[role]?page=chat&contact=[ID]
--              Project messages now link to /dashboard/[role]?id=[UUID]

CREATE OR REPLACE FUNCTION public.fn_create_event_notifications()
RETURNS TRIGGER AS $$
DECLARE
    calc_row RECORD;
    sender_profile RECORD;
    receiver_profile RECORD;
    mgr_record RECORD;
    msg_row RECORD;
    doc_row RECORD;
    v_status_label TEXT;
BEGIN
    BEGIN
        -- CASE A: CALCULATION EVENTS
        IF (NEW.entity_type = 'calculation') THEN
            SELECT * INTO calc_row FROM public.calculations WHERE id = NEW.entity_id::uuid;
            IF FOUND THEN
                
                -- 🚀 ACTION: Notify ALL Managers about a NEW LEAD
                IF (NEW.action = 'calculation_status_updated' AND calc_row.status = 'sent' AND calc_row.manager_id IS NULL) THEN
                    FOR mgr_record IN SELECT id FROM public.profiles WHERE role IN ('manager', 'admin') LOOP
                        IF (mgr_record.id != calc_row.user_id) THEN
                            INSERT INTO public.notifications (user_id, title, message, type, link)
                            VALUES (
                                mgr_record.id,
                                '🆕 Поступила новая заявка!',
                                'Новый расчет от «' || COALESCE(calc_row.organization_name, '...') || '» в общем списке.',
                                'alert',
                                '/dashboard/manager?id=' || calc_row.id
                            );
                        END IF;
                    END LOOP;
                END IF;

                -- 🔔 ACTION: Notify CLIENT about status updates FROM Management
                IF (NEW.action = 'calculation_status_updated' AND calc_row.status NOT IN ('draft', 'sent', 'revision', 'payment_review')) THEN
                    v_status_label := CASE calc_row.status
                        WHEN 'expert' THEN 'На экспертизе'
                        WHEN 'changes' THEN 'Требуют правок'
                        WHEN 'invoice' THEN 'Ожидает оплаты'
                        WHEN 'payment_rejected' THEN 'Оплата отклонена'
                        WHEN 'paid' THEN 'Оплата подтверждена'
                        WHEN 'processing' THEN 'Собираем заказ'
                        WHEN 'sent_to_warehouse' THEN 'Отправлен на склад'
                        WHEN 'ready' THEN 'Готово к отгрузке'
                        WHEN 'shipping' THEN 'Доставка'
                        WHEN 'completed' THEN 'Выполнен'
                        WHEN 'closed' THEN 'Архив'
                        ELSE calc_row.status
                    END;

                    INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (
                        calc_row.user_id,
                        'Статус проекта обновлен',
                        'Проект «' || COALESCE(calc_row.organization_name, '...') || '» теперь в статусе: ' || v_status_label,
                        'info',
                        '/dashboard/client?id=' || calc_row.id
                    );
                END IF;

                -- 👔 ACTION: Individual tasks for assigned manager
                IF (NEW.action = 'calculation_assigned') THEN
                    INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (calc_row.manager_id, '💼 Вам назначен проект', 'Вы назначены ответственным за проект «' || COALESCE(calc_row.organization_name, '...') || '»', 'success', '/dashboard/manager?id=' || calc_row.id);
                ELSIF (NEW.action = 'calculation_status_updated' AND calc_row.status = 'revision' AND calc_row.manager_id IS NOT NULL) THEN
                    INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (calc_row.manager_id, '✏️ Клиент внес правки', 'Проект «' || COALESCE(calc_row.organization_name, '...') || '» возвращен на проверку.', 'alert', '/dashboard/manager?id=' || calc_row.id);
                ELSIF (NEW.action = 'calculation_status_updated' AND calc_row.status = 'payment_review' AND calc_row.manager_id IS NOT NULL) THEN
                    INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (calc_row.manager_id, '💸 Оплата на проверке', 'Клиент прикрепил чек к проекту «' || COALESCE(calc_row.organization_name, '...') || '»', 'alert', '/dashboard/manager?id=' || calc_row.id);
                END IF;
            END IF;
        END IF;

        -- CASE B: MESSAGES
        IF (NEW.entity_type = 'message') THEN
            SELECT * INTO msg_row FROM public.messages WHERE id = NEW.entity_id::uuid;
            IF FOUND THEN
                SELECT TRIM(CONCAT(first_name, ' ', last_name)) as name, role INTO sender_profile FROM public.profiles WHERE id = msg_row.sender_id;
                IF FOUND THEN
                    IF (msg_row.calculation_id IS NOT NULL) THEN
                        SELECT * INTO calc_row FROM public.calculations WHERE id = msg_row.calculation_id;
                        IF FOUND THEN
                            IF (sender_profile.role IN ('manager', 'admin')) THEN
                                INSERT INTO public.notifications (user_id, title, message, type, link)
                                VALUES (calc_row.user_id, '💬 Новое сообщение', COALESCE(sender_profile.name, 'Менеджер') || ': ' || COALESCE(NEW.details->>'content_preview', '...'), 'info', '/dashboard/client?id=' || calc_row.id);
                            ELSIF (calc_row.manager_id IS NOT NULL AND msg_row.sender_id != calc_row.manager_id) THEN
                                INSERT INTO public.notifications (user_id, title, message, type, link)
                                VALUES (calc_row.manager_id, '💬 Сообщение от клиента', '«' || COALESCE(calc_row.organization_name, '...') || '»: ' || COALESCE(NEW.details->>'content_preview', '...'), 'info', '/dashboard/manager?id=' || calc_row.id);
                            END IF;
                        END IF;
                    ELSIF (msg_row.receiver_id IS NOT NULL) THEN
                        -- Identify receiver role for correct dashboard linking
                        SELECT role INTO receiver_profile FROM public.profiles WHERE id = msg_row.receiver_id;
                        
                        INSERT INTO public.notifications (user_id, title, message, type, link)
                        VALUES (
                            msg_row.receiver_id, 
                            '💬 Личное сообщение', 
                            COALESCE(sender_profile.name, 'Пользователь') || ': ' || COALESCE(NEW.details->>'content_preview', '...'), 
                            'info', 
                            CASE 
                                WHEN receiver_profile.role IN ('manager', 'admin') THEN '/dashboard/manager?page=chat&contact=' || msg_row.sender_id
                                ELSE '/dashboard/client?page=chat&contact=' || msg_row.sender_id
                            END
                        );
                    END IF;
                END IF;
            END IF;
        END IF;

        -- CASE C: DOCUMENTS
        IF (NEW.entity_type = 'document') THEN
            SELECT * INTO doc_row FROM public.documents WHERE id = NEW.entity_id::uuid;
            IF FOUND THEN
                SELECT * INTO calc_row FROM public.calculations WHERE id = doc_row.calculation_id;
                IF FOUND THEN
                    INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (calc_row.user_id, '📄 Документ готов', 'Для проекта «' || COALESCE(calc_row.organization_name, '...') || '» сформирован ' || CASE WHEN doc_row.type = 'kp' THEN 'Коммерческое предложение' WHEN doc_row.type = 'invoice' THEN 'Счет на оплату' ELSE 'Новый документ' END, 'success', '/dashboard/client?id=' || calc_row.id);
                END IF;
            END IF;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Notification trigger failed for audit_log %: %', NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
