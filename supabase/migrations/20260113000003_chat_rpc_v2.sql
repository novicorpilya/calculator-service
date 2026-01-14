-- ============================================================
-- CHAT RPC FUNCTIONS
-- ============================================================

-- 1. Mark Project Messages as Read
-- Updates or inserts a marker for a specific user in a specific project chat.
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
    p_calculation_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- 1. Сначала обновляем маркер времени последнего прочтения (для счетчиков в списке проектов)
    INSERT INTO public.chat_read_markers (user_id, calculation_id, last_read_at)
    VALUES (p_user_id, p_calculation_id, NOW())
    ON CONFLICT (user_id, calculation_id)
    DO UPDATE SET last_read_at = NOW();

    -- 2. Затем обновляем флаг is_read у самих сообщений (для отображения 2-х галочек у отправителя)
    -- Мы проставляем "прочитано" всем сообщениям в этом проекте, которые отправил НЕ текущий пользователь.
    UPDATE public.messages
    SET is_read = true
    WHERE calculation_id = p_calculation_id
      AND sender_id != p_user_id
      AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Chat Recipients (Direct Chats)
-- Returns a list of users who have exchanged messages with p_user_id,
-- including the most recent message snippet.
DROP FUNCTION IF EXISTS public.get_chat_recipients_v2(UUID);
CREATE OR REPLACE FUNCTION public.get_chat_recipients_v2(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    organization_name TEXT,
    role TEXT,
    first_name TEXT,
    last_name TEXT,
    last_message JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH user_chats AS (
        SELECT DISTINCT 
            CASE 
                WHEN sender_id = p_user_id THEN receiver_id 
                ELSE sender_id 
            END as contact_id
        FROM public.messages
        WHERE 
            calculation_id IS NULL AND
            (sender_id = p_user_id OR receiver_id = p_user_id)
    ),
    latest_messages AS (
        SELECT DISTINCT ON (contact_id)
            contact_id,
            jsonb_build_object(
                'content', content,
                'created_at', created_at,
                'sender_id', sender_id,
                'image_url', image_url,
                'voice_url', voice_url
            ) as lm_json
        FROM (
            SELECT 
                CASE 
                    WHEN sender_id = p_user_id THEN receiver_id 
                    ELSE sender_id 
                END as contact_id,
                content, created_at, sender_id, image_url, voice_url
            FROM public.messages
            WHERE 
                calculation_id IS NULL AND
                (sender_id = p_user_id OR receiver_id = p_user_id)
        ) sub
        ORDER BY contact_id, created_at DESC
    )
    SELECT 
        p.id,
        p.organization_name,
        p.role,
        p.first_name,
        p.last_name,
        COALESCE(lm.lm_json, NULL) as last_message
    FROM user_chats uc
    JOIN public.profiles p ON p.id = uc.contact_id
    LEFT JOIN latest_messages lm ON lm.contact_id = uc.contact_id
    ORDER BY (lm.lm_json->>'created_at')::timestamptz DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
