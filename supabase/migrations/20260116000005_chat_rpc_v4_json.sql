-- Migration: get_chat_recipients_v4 returning JSONB
-- This avoids strict table return types which might be causing 400 errors via RPC.

DROP FUNCTION IF EXISTS public.get_chat_recipients_v4(UUID);

CREATE OR REPLACE FUNCTION public.get_chat_recipients_v4(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, temp
AS $$
DECLARE
    result JSONB;
BEGIN
    WITH potential_contacts AS (
        -- 1. Users we already have messages with
        SELECT DISTINCT CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END as contact_id
        FROM public.messages 
        WHERE calculation_id IS NULL AND (sender_id = p_user_id OR receiver_id = p_user_id)
        
        UNION
        
        -- 2. Manager sees Clients
        SELECT id as contact_id 
        FROM public.profiles 
        WHERE role = 'client' 
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role IN ('manager', 'admin'))
        
        UNION
        
        -- 3. Client sees Managers
        SELECT id as contact_id 
        FROM public.profiles 
        WHERE role IN ('manager', 'admin') 
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'client')
        
        UNION

        -- 4. Admin sees everyone
        SELECT id as contact_id 
        FROM public.profiles 
        WHERE id != p_user_id 
          AND EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'admin')
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
    SELECT jsonb_agg(t) INTO result FROM (
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
          AND p.id != p_user_id
        ORDER BY (lm.lm_json->>'created_at')::timestamptz DESC NULLS LAST, p.organization_name ASC
    ) t;

    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_chat_recipients_v4(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_chat_recipients_v4 IS 'Get chat recipients v4 returning JSONB. Solves 400 Bad Request issues.';
