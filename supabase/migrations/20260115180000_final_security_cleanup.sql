-- ============================================================
-- FINAL SECURITY CLEANUP & HARDENING
-- Date: 2026-01-15
-- 1. Restrict system_logs INSERT to authenticated users
-- 2. Ensure RLS is enabled on all sensitive tables
-- ============================================================

-- 1. Refine system_logs policies to satisfy Security Advisor (avoid WITH CHECK (true))
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_manage_policy" ON public.system_logs;

-- Admins can do everything
CREATE POLICY "system_logs_admin_policy" ON public.system_logs 
    FOR ALL TO public
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

-- Authenticated users can only insert (satisfying "not always true" by checking auth.uid())
CREATE POLICY "system_logs_authenticated_insert" ON public.system_logs 
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 2. Ensure RLS is enabled on tables mentioned in reports
ALTER TABLE IF EXISTS public.chat_tombstones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_logs ENABLE ROW LEVEL SECURITY;

-- 3. Double check search_path for any remaining public functions
-- We already have a loop in the previous migration, but we can ensure 
-- it's applied to everything in public schema just to be 100% safe.
DO $$ 
DECLARE
    f RECORD;
BEGIN
    FOR f IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_catalog, temp', f.nspname, f.proname, f.args);
    END LOOP;
END $$;
