-- ============================================================
-- SECURITY AUDIT FIXES
-- Purpose: Address Critical Errors and Warnings from Supabase Security Linter
-- ============================================================

-- ------------------------------------------------------------
-- 1. FIX: VIEW SECURITY (Remove SECURITY DEFINER)
-- ------------------------------------------------------------
-- Recreating views as standard views (Security Invoker is default in Postgres 15+, or explicit in others)
-- This ensures they respect the RLS policies of the caller.
ALTER VIEW IF EXISTS public.v_venue_efficiency_benchmarks SET (security_invoker = on);
ALTER VIEW IF EXISTS public.v_manager_stats_summary SET (security_invoker = on);
ALTER VIEW IF EXISTS public.v_inventory_calculation SET (security_invoker = on);
ALTER VIEW IF EXISTS public.v_stale_projects SET (security_invoker = on);
ALTER VIEW IF EXISTS public.v_sector_averages SET (security_invoker = on);


-- ------------------------------------------------------------
-- 2. FIX: ENABLE RLS ON PUBLIC TABLES
-- ------------------------------------------------------------
ALTER TABLE IF EXISTS public.order_items_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partners ENABLE ROW LEVEL SECURITY;

-- Add basic read policy for authenticated users (adjust if needed)
CREATE POLICY "Auth Read Summaries" ON public.order_items_summaries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Auth Read Partners" ON public.partners
    FOR SELECT USING (auth.role() = 'authenticated');


-- ------------------------------------------------------------
-- 3. FIX: MUTABLE SEARCH PATH (SQL Injection Prevention)
-- ------------------------------------------------------------
-- Setting search_path to 'public' for all identified functions.

-- Helper functions
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_manager_or_admin() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Core business logic
ALTER FUNCTION public.perform_calculation_action(UUID, TEXT, TEXT, JSONB) SET search_path = public;
ALTER FUNCTION public.get_client_dashboard_stats(UUID, UUID) SET search_path = public;
ALTER FUNCTION public.apply_smart_reorder(UUID) SET search_path = public;

-- Audit & Logging
-- Audit & Logging
-- Removed non-existent fn_log_to_audit_logs
ALTER FUNCTION public.fn_log_message_to_audit() SET search_path = public;
ALTER FUNCTION public.fn_log_document_to_audit() SET search_path = public;
ALTER FUNCTION public.fn_log_calculation_change() SET search_path = public;

-- Specific triggers/helpers
-- Removed non-existent fn_update_calculation_sla
ALTER FUNCTION public.fn_handle_updated_at() SET search_path = public;
ALTER FUNCTION public.fn_enforce_single_default_preset() SET search_path = public;
ALTER FUNCTION public.bump_calculation_updated_at() SET search_path = public;
-- Removed non-existent delete_user_v1
ALTER FUNCTION public.set_user_status(UUID, TEXT) SET search_path = public;

-- Complex logic (assuming signatures based on naming)
-- Note: If signatures differ, these ALTERs might need adjustment. 
-- Using generic name if unique usually works, but specialized args might be needed.
-- Trying specific signatures where likely known or general otherwise.

-- If these functions have specific overloads, we might need to be more precise.
-- Attempting to target by name where possible in recent PG versions if unique.
-- Safe bet: include args if known or try general block handling? 
-- Postgres requires args for overloading. Let's assume standard signatures found in recent context.

ALTER FUNCTION public.fn_create_event_notifications() SET search_path = public;
-- Removed non-existent fn_sync_order_to_analytics
-- Removed non-existent fn_shadow_map_calculation_to_venue
ALTER FUNCTION public.get_chat_recipients_v3(UUID) SET search_path = public;


-- ------------------------------------------------------------
-- 4. FIX: PERMISSIVE RLS POLICIES
-- ------------------------------------------------------------

-- A. Audit Logs: Restrict INSERT to authenticated users (was 'true')
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- B. System Logs: Restrict INSERT to authenticated users
DROP POLICY IF EXISTS "system_logs_insert_policy" ON public.system_logs;
CREATE POLICY "system_logs_insert_policy" ON public.system_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- C. System Settings: Restrict Admin Update to explicit check
DROP POLICY IF EXISTS "Admins can update settings" ON public.system_settings;
CREATE POLICY "Admins can update settings" ON public.system_settings
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- D. Calculations: Tighten Manager Update
-- Previous fix used 'WITH CHECK (true)', now we enforce role check.
DROP POLICY IF EXISTS "Manager_Full_Update" ON public.calculations;
DROP POLICY IF EXISTS "Manager_Update_Pipeline" ON public.calculations; 
-- (Dropping both potential names from recent attempts)

CREATE POLICY "Manager_Full_Update" ON public.calculations
    FOR UPDATE USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('manager', 'admin')
        AND status != 'draft'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('manager', 'admin')
    );
