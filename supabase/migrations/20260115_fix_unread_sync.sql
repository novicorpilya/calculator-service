-- Migration: Fix mark_messages_as_read to update chat_read_markers
-- Date: 2026-01-15 14:35
-- Issue: Unread counts were not resetting for project chats because markers weren't updated.

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
    p_calculation_id TEXT DEFAULT NULL,
    p_sender_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_current_user_id UUID;
    v_calc_uuid UUID;
BEGIN
    -- Get the authenticated user's ID
    v_current_user_id := auth.uid();
    
    -- Security check: user must be authenticated
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- For project messages: mark as read where user is receiver OR participant
    IF p_calculation_id IS NOT NULL THEN
        -- Try to convert text ID to UUID safely
        BEGIN
            v_calc_uuid := p_calculation_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_calc_uuid := NULL;
        END;

        IF v_calc_uuid IS NOT NULL THEN
            -- 1. Update the marker (for unread count logic)
            INSERT INTO public.chat_read_markers (user_id, calculation_id, last_read_at)
            VALUES (v_current_user_id, v_calc_uuid, NOW())
            ON CONFLICT (user_id, calculation_id) 
            DO UPDATE SET last_read_at = NOW();

            -- 2. Update legacy is_read flag for ticks
            UPDATE public.messages
            SET is_read = true
            WHERE calculation_id = v_calc_uuid
              AND sender_id != v_current_user_id
              AND is_read = false;
        END IF;
    
    -- For direct messages: mark as read where user is the receiver
    ELSIF p_sender_id IS NOT NULL THEN
        UPDATE public.messages
        SET is_read = true
        WHERE sender_id = p_sender_id
          AND receiver_id = v_current_user_id  -- SECURITY: only mark messages sent TO me
          AND is_read = false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog, temp;

COMMENT ON FUNCTION public.mark_messages_as_read IS 
    'Marks messages as read. Updates both chat_read_markers and messages table.';
