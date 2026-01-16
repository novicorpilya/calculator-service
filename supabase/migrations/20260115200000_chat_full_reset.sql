-- ============================================================
-- DIRECT CHAT 2.0: FULL SETTINGS RESET & RE-INITIALIZATION
-- Date: 2026-01-15
-- Description: Drops and recreates all Chat-related logic 
-- (Policies, Triggers, Functions) for a clean state.
-- ============================================================

-- 1. CLEANUP: Drop all known chat-related policies
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('messages', 'chat_read_markers', 'chat_tombstones')
    ) LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP; 
END $$;

-- 2. CLEANUP: Drop triggers and functions
DROP TRIGGER IF EXISTS trg_chat_tombstone ON public.messages;
DROP FUNCTION IF EXISTS public.fn_create_chat_tombstone();
DROP FUNCTION IF EXISTS public.mark_messages_as_read(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_chat_recipients_v2(UUID);

-- 3. RE-INIT: Core Chat Tables (Ensure sequences and columns exist)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS server_seq_id BIGSERIAL;
CREATE INDEX IF NOT EXISTS idx_messages_seq_id ON public.messages(server_seq_id);

-- 4. RE-INIT: Functions (with security hardening)
CREATE OR REPLACE FUNCTION public.fn_create_chat_tombstone()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.chat_tombstones (message_id, sender_id, receiver_id, calculation_id, server_seq_id)
    VALUES (OLD.id, OLD.sender_id, OLD.receiver_id, OLD.calculation_id, OLD.server_seq_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog, temp;

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_calculation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.chat_read_markers (user_id, calculation_id, last_read_at)
    VALUES (p_user_id, p_calculation_id, NOW())
    ON CONFLICT (user_id, calculation_id) DO UPDATE SET last_read_at = NOW();

    UPDATE public.messages SET is_read = true
    WHERE calculation_id = p_calculation_id AND sender_id != p_user_id AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog, temp;

CREATE OR REPLACE FUNCTION public.get_chat_recipients_v2(p_user_id UUID)
RETURNS TABLE (id UUID, organization_name TEXT, role TEXT, first_name TEXT, last_name TEXT, last_message JSONB) AS $$
BEGIN
    RETURN QUERY
    WITH user_chats AS (
        SELECT DISTINCT CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END as contact_id
        FROM public.messages WHERE calculation_id IS NULL AND (sender_id = p_user_id OR receiver_id = p_user_id)
    ),
    latest_messages AS (
        SELECT DISTINCT ON (contact_id) contact_id,
            jsonb_build_object('content', content, 'created_at', created_at, 'sender_id', sender_id, 'image_url', image_url, 'voice_url', voice_url) as lm_json
        FROM (
            SELECT CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END as contact_id,
                   content, created_at, sender_id, image_url, voice_url
            FROM public.messages WHERE calculation_id IS NULL AND (sender_id = p_user_id OR receiver_id = p_user_id)
        ) sub ORDER BY contact_id, created_at DESC
    )
    SELECT p.id, p.organization_name, p.role, p.first_name, p.last_name, COALESCE(lm.lm_json, NULL) as last_message
    FROM user_chats uc
    JOIN public.profiles p ON p.id = uc.contact_id
    LEFT JOIN latest_messages lm ON lm.contact_id = uc.contact_id
    ORDER BY (lm.lm_json->>'created_at')::timestamptz DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog, temp;

-- 5. RE-INIT: Trigger
CREATE TRIGGER trg_chat_tombstone BEFORE DELETE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.fn_create_chat_tombstone();

-- 6. RE-INIT: Optimized RLS Policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_tombstones ENABLE ROW LEVEL SECURITY;

-- Messages Policies
CREATE POLICY "msg_select" ON public.messages FOR SELECT TO public
    USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()) OR (SELECT public.is_admin()) OR (calculation_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.calculations WHERE id = calculation_id AND (user_id = (SELECT auth.uid()) OR manager_id = (SELECT auth.uid())))));

CREATE POLICY "msg_insert" ON public.messages FOR INSERT TO public
    WITH CHECK (sender_id = (SELECT auth.uid()));

CREATE POLICY "msg_update" ON public.messages FOR UPDATE TO public
    USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- Read Markers Policies
CREATE POLICY "marker_all" ON public.chat_read_markers FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- Tombstones Policies
CREATE POLICY "tombstone_select" ON public.chat_tombstones FOR SELECT TO public
    USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
