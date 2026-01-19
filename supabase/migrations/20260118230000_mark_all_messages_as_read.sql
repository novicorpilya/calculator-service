-- Migration: mark_all_as_read_v3 (Fixed types)
-- Marks both direct and project messages as read for a given user

CREATE OR REPLACE FUNCTION mark_all_messages_as_read(
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Mark all direct messages sent TO this user as read
    UPDATE public.messages
    SET is_read = true
    WHERE receiver_id = p_user_id
      AND is_read = false;

    -- 2. Mark all project messages in projects where this user is manager or owner
    -- (and sender is NOT this user)
    -- Both m.calculation_id and c.id are UUID, so we compare directly.
    UPDATE public.messages m
    SET is_read = true
    FROM public.calculations c
    WHERE m.calculation_id = c.id
      AND m.is_read = false
      AND m.sender_id != p_user_id
      AND (c.user_id = p_user_id OR c.manager_id = p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION mark_all_messages_as_read(UUID) TO authenticated;

COMMENT ON FUNCTION mark_all_messages_as_read IS 'Mark all unread direct and project messages as read for a specific user';
