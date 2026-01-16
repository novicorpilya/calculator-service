-- Migration: Create get_unread_counts_v2 RPC function
-- This function returns unread message counts for a user:
-- - total: total unread messages
-- - perSender: unread counts grouped by sender (for direct messages)
-- - perProject: unread counts grouped by calculation_id (for project chats)

CREATE OR REPLACE FUNCTION get_unread_counts_v2(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    total_count INT;
    per_sender JSONB;
    per_project JSONB;
BEGIN
    -- Total unread direct messages (where user is receiver)
    SELECT COALESCE(COUNT(*), 0) INTO total_count
    FROM messages
    WHERE receiver_id = user_id_param
      AND sender_id != user_id_param
      AND is_read = false;
    
    -- Unread counts per sender (direct messages)
    SELECT COALESCE(
        jsonb_object_agg(sender_id::text, cnt),
        '{}'::jsonb
    ) INTO per_sender
    FROM (
        SELECT sender_id, COUNT(*) as cnt
        FROM messages
        WHERE receiver_id = user_id_param
          AND sender_id != user_id_param
          AND is_read = false
          AND calculation_id IS NULL
        GROUP BY sender_id
    ) sender_counts;
    
    -- Unread counts per project (calculation chats)
    -- A message is unread for a user if they haven't read it yet
    -- and they are a participant (either the calculation owner or manager)
    SELECT COALESCE(
        jsonb_object_agg(calculation_id::text, cnt),
        '{}'::jsonb
    ) INTO per_project
    FROM (
        SELECT m.calculation_id, COUNT(*) as cnt
        FROM messages m
        JOIN calculations c ON c.id = CAST(m.calculation_id AS UUID)
        WHERE m.calculation_id IS NOT NULL
          AND m.sender_id != user_id_param
          AND m.is_read = false
          AND (c.user_id = user_id_param OR c.manager_id = user_id_param)
        GROUP BY m.calculation_id
    ) project_counts;
    
    -- Add project unread to total
    SELECT total_count + COALESCE(
        (SELECT SUM(value::int) FROM jsonb_each_text(per_project)),
        0
    ) INTO total_count;
    
    -- Build result
    result := jsonb_build_object(
        'total', total_count,
        'perSender', per_sender,
        'perProject', per_project
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_counts_v2(UUID) TO authenticated;

COMMENT ON FUNCTION get_unread_counts_v2 IS 'Get unread message counts for a user (total, per sender, per project)';

-- ============================================================================
-- mark_messages_as_read_v2: Mark direct messages as read
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_messages_as_read_v2(
    p_contact_id UUID,
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE messages
    SET is_read = true
    WHERE sender_id = p_contact_id
      AND receiver_id = p_user_id
      AND is_read = false;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_messages_as_read_v2(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION mark_messages_as_read_v2 IS 'Mark all unread direct messages from a contact as read';

-- ============================================================================
-- mark_project_messages_read: Mark project/calculation messages as read
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_project_messages_read(
    p_project_id TEXT,
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE messages
    SET is_read = true
    WHERE calculation_id = p_project_id
      AND sender_id != p_user_id
      AND is_read = false;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_project_messages_read(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION mark_project_messages_read IS 'Mark all unread project messages as read for a user';
