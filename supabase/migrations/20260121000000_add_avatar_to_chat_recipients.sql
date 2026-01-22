-- Migration: Add avatar_url to get_chat_recipients_v5
-- To support profile images in chat sidebar

CREATE OR REPLACE FUNCTION public.get_chat_recipients_v5(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, temp
AS $$
DECLARE
    result JSONB;
BEGIN
    WITH potential_contacts AS (
        -- 1. Users we already have messages with (Direct Messages history)
        SELECT DISTINCT CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END as contact_id
        FROM public.messages 
        WHERE calculation_id IS NULL AND (sender_id = p_user_id OR receiver_id = p_user_id)
        
        UNION
        
        -- 2. Relevant Project Contacts (Calculations)
        -- If I am a Manager: Show Clients from my calculations
        SELECT user_id as contact_id
        FROM public.calculations
        WHERE manager_id = p_user_id 
          AND user_id IS NOT NULL
        
        UNION
        
        -- If I am a Client: Show Managers from my calculations
        SELECT manager_id as contact_id
        FROM public.calculations
        WHERE user_id = p_user_id 
          AND manager_id IS NOT NULL
        
        UNION
        
        -- 3. Admin logic: Admins see all users
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
            p.avatar_url,
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
