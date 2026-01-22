-- ============================================================
-- SECURITY ADVISOR FIX: Immutable Search Path for Functions
-- ============================================================
-- Issue: Function `get_my_role` has a mutable search_path
-- Risk: Search path injection attacks
-- Fix: SET search_path = '' to lock the path
-- ============================================================

-- Drop and recreate with security hardening
DROP FUNCTION IF EXISTS public.get_my_role();

CREATE FUNCTION public.get_my_role()
RETURNS text 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- ====================
-- ADDITIONAL SECURITY HARDENING
-- Check for any other functions that might need the same fix
-- ====================

-- Note: The 'auth_leaked_password_protection' warning is a UI setting.
-- To fix it, go to Supabase Dashboard:
-- Authentication → Settings → Enable "Leaked Password Protection"
-- This checks passwords against HaveIBeenPwned.org database.
