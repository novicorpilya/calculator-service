-- Migration: Fix mark_project_messages_read argument type
-- Fixes "operator does not exist: uuid = text" error.

DROP FUNCTION IF EXISTS public.mark_project_messages_read(TEXT, UUID);

CREATE OR REPLACE FUNCTION public.mark_project_messages_read(
    p_project_id UUID,
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

GRANT EXECUTE ON FUNCTION public.mark_project_messages_read(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.mark_project_messages_read(UUID, UUID) IS 'Mark project messages read. Fixed types (UUID instead of TEXT).';
