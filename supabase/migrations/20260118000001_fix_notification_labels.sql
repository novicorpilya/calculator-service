-- ============================================================
-- Migration: Human-readable Notification Labels & Correct Deep Links
-- Date: 2026-01-18
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_create_event_notifications()
RETURNS TRIGGER AS $$
DECLARE
    calc_row RECORD;
    sender_profile RECORD;
    mgr_record RECORD;
    msg_row RECORD;
    doc_row RECORD;
    v_status_label TEXT;
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
                                '/dashboard/manager?id=' || calc_row.id
                            );
                        END IF;
                    END LOOP;
                END IF;

                -- 2. Notify CLIENT when status changes (excluding draft/sent/revision)
                IF (NEW.action = 'calculation_status_updated' AND calc_row.status NOT IN ('draft', 'sent', 'revision')) THEN
                    -- Map status to Russian label
                    v_status_label := CASE calc_row.status
                        WHEN 'expert' THEN 'На экспертизе'
                        WHEN 'changes' THEN 'Требуют правок'
                        WHEN 'invoice' THEN 'Ожидает оплаты'
                        WHEN 'payment_review' THEN 'Оплата на проверке'
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

                -- 3. Notify MANAGER:
                IF (NEW.action = 'calculation_assigned') THEN
                    INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (
                        calc_row.manager_id,
                        '💼 Вам назначен проект',
                        'Вы назначены ответственным за проект «' || COALESCE(calc_row.organization_name, '...') || '»',
                        'success',
                        '/dashboard/manager?id=' || calc_row.id
                    );
                ELSIF (NEW.action = 'calculation_status_updated' AND calc_row.status = 'revision' AND calc_row.manager_id IS NOT NULL) THEN
                     INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (
                        calc_row.manager_id,
                        '✏️ Клиент внес правки',
                        'Проект «' || COALESCE(calc_row.organization_name, '...') || '» возвращен на проверку (Правки внесены)',
                        'alert',
                        '/dashboard/manager?id=' || calc_row.id
                    );
                ELSIF (NEW.action = 'calculation_status_updated' AND calc_row.status = 'payment_review' AND calc_row.manager_id IS NOT NULL) THEN
                     INSERT INTO public.notifications (user_id, title, message, type, link)
                    VALUES (
                        calc_row.manager_id,
                        '💸 Оплата на проверке',
                        'Клиент прикрепил чек к проекту «' || COALESCE(calc_row.organization_name, '...') || '»',
                        'alert',
                        '/dashboard/manager?id=' || calc_row.id
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
                                    'info', '/dashboard/client?id=' || calc_row.id);
                            ELSIF (calc_row.manager_id IS NOT NULL AND msg_row.sender_id != calc_row.manager_id) THEN
                                INSERT INTO public.notifications (user_id, title, message, type, link)
                                VALUES (calc_row.manager_id, '💬 Сообщение от клиента', 
                                    '«' || COALESCE(calc_row.organization_name, '...') || '»: ' || COALESCE(NEW.details->>'content_preview', '...'),
                                    'info', '/dashboard/manager?id=' || calc_row.id);
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
                        '/dashboard/client?id=' || calc_row.id
                    );
                END IF;
            END IF;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Notification trigger failed for audit_log %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
