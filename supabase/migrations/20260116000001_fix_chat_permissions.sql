-- Migration: Fix permissions for Chat RPC functions
-- The re-initialization migration dropped these functions and recreated them 
-- but might have missed the GRANT statements for the authenticated role.

GRANT EXECUTE ON FUNCTION public.get_chat_recipients_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(UUID, UUID) TO authenticated;

-- Ensure previous functions also have grants (just in case)
GRANT EXECUTE ON FUNCTION public.get_unread_counts_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read_v2(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_project_messages_read(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION public.get_chat_recipients_v2 IS 'Fix: Explicitly granted execute permission to authenticated users';
