-- Migration: Improve get_chat_recipients_v2 logic
-- Ensures contacts appear even if no messages exist yet (Manager <-> Client visibility).

DROP FUNCTION IF EXISTS public.get_chat_recipients_v2(UUID);

CREATE OR REPLACE FUNCTION public.get_chat_recipients_v2(p_user_id UUID)
RETURNS TABLE (id UUID, organization_name TEXT, role TEXT, first_name TEXT, last_name TEXT, last_message JSONB) AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Get current user role
    SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;

    RETURN QUERY
    WITH potential_contacts AS (
        -- 1. Users we already have messages with (Direct Messages)
        SELECT DISTINCT CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END as contact_id
        FROM public.messages 
        WHERE calculation_id IS NULL AND (sender_id = p_user_id OR receiver_id = p_user_id)
        
        UNION
        
        -- 2. If 'manager' or 'admin', show ALL 'client' users
        SELECT id as contact_id 
        FROM public.profiles 
        WHERE role = 'client' 
          AND (v_user_role IN ('manager', 'admin'))
        
        UNION
        
        -- 3. If 'client', show ALL 'manager' and 'admin' users
        SELECT id as contact_id 
        FROM public.profiles 
        WHERE role IN ('manager', 'admin') 
          AND (v_user_role = 'client')
        
        UNION

        -- 4. If 'admin', show EVERYONE (except self)
        SELECT id as contact_id 
        FROM public.profiles 
        WHERE id != p_user_id 
          AND (v_user_role = 'admin')
    ),
    latest_messages AS (
        SELECT DISTINCT ON (contact_id) 
            CASE WHEN m.sender_id = p_user_id THEN m.receiver_id ELSE m.sender_id END as contact_id,
            jsonb_build_object(
                'id', m.id,
                'content', m.content, 
                'created_at', m.created_at, 
                'sender_id', m.sender_id, 
                'image_url', m.image_url, 
                'voice_url', m.voice_url,
                'is_read', m.is_read
            ) as lm_json
        FROM public.messages m
        WHERE m.calculation_id IS NULL AND (m.sender_id = p_user_id OR m.receiver_id = p_user_id)
        ORDER BY contact_id, m.created_at DESC
    )
    SELECT 
        p.id, 
        p.organization_name, 
        p.role, 
        p.first_name, 
        p.last_name, 
        COALESCE(lm.lm_json, NULL) as last_message
    FROM potential_contacts pc
    JOIN public.profiles p ON p.id = pc.contact_id
    LEFT JOIN latest_messages lm ON lm.contact_id = pc.contact_id
    WHERE pc.contact_id IS NOT NULL
    -- Ensure we don't return the user themselves
    AND p.id != p_user_id
    ORDER BY (lm.lm_json->>'created_at')::timestamptz DESC NULLS LAST, p.organization_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog, temp;

GRANT EXECUTE ON FUNCTION public.get_chat_recipients_v2(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_chat_recipients_v2 IS 'Get chat recipients. Includes all relevant users based on role, plus anyone with existing message history.';
