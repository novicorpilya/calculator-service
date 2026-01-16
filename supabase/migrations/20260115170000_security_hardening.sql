-- ============================================================
-- SECURITY HARDENING & AUDITOR REMEDIATION
-- Date: 2026-01-15
-- 1. Fix mutable search_path for all public functions
-- 2. Enable RLS on chat_tombstones
-- 3. Harden system_logs policies
-- ============================================================

-- 1. Fix Mutable Search Path for all mentioned functions
-- Using a dynamic DO block to handle all function signatures automatically
DO $$ 
DECLARE
    f RECORD;
BEGIN
    FOR f IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' 
        AND p.proname IN (
            'is_admin', 
            'fn_create_chat_tombstone', 
            'perform_calculation_action', 
            'validate_shipping_status', 
            'fn_process_system_message', 
            'is_manager_or_admin', 
            'mark_messages_as_read', 
            'get_chat_recipients_v2', 
            'fn_log_calculation_change', 
            'adjust_calculation_expert', 
            'create_calculation_atomic', 
            'acquire_calculation_lock', 
            'release_calculation_lock', 
            'handle_new_user'
        )
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_catalog, temp', f.nspname, f.proname, f.args);
    END LOOP;
END $$;

-- 2. Enable RLS on public.chat_tombstones
ALTER TABLE public.chat_tombstones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_tombstones_select_policy" ON public.chat_tombstones;
CREATE POLICY "chat_tombstones_select_policy" ON public.chat_tombstones FOR SELECT TO public
    USING (
        (SELECT auth.uid()) = sender_id 
        OR (SELECT auth.uid()) = receiver_id
        OR (
            calculation_id IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM public.calculations 
                WHERE id = calculation_id 
                AND (user_id = (SELECT auth.uid()) OR manager_id = (SELECT auth.uid()))
            )
        )
        OR (SELECT public.is_admin())
    );

-- 3. Harden system_logs policies
-- Fix "system_logs_manage_policy" which had WITH CHECK (true)
DROP POLICY IF EXISTS "system_logs_manage_policy" ON public.system_logs;
CREATE POLICY "system_logs_manage_policy" ON public.system_logs 
    FOR ALL TO public
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- 4. Consolidate "Anyone can insert logs" if needed (Ensure it's only INSERT)
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.system_logs;
CREATE POLICY "Anyone can insert logs" ON public.system_logs 
    FOR INSERT TO public
    WITH CHECK (true);
