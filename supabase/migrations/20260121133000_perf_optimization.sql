-- ============================================================
-- PERFORMANCE & RLS OPTIMIZATION FIXES
-- Purpose: Resolve Performance Advisor Warnings (auth_rls_initplan, multiple_permissive_policies)
-- ============================================================

-- 1. FIX: `auth_rls_initplan`
-- Replacing direct `auth.uid()` calls with `(SELECT auth.uid())` wrapper to enable query plan caching.
-- This prevents re-evaluation for every row.

-- A. Profiles
DROP POLICY IF EXISTS "Profiles_Update_Own" ON public.profiles;
CREATE POLICY "Profiles_Update_Own" ON public.profiles 
    FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Profiles_Public_Read" ON public.profiles;
CREATE POLICY "Profiles_Public_Read" ON public.profiles 
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

-- B. Calculations (Manager Full View/Update)
DROP POLICY IF EXISTS "Manager_Full_View" ON public.calculations;
CREATE POLICY "Manager_Full_View" ON public.calculations
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('manager', 'admin')
        AND (status != 'draft' OR user_id = (SELECT auth.uid()) OR manager_id = (SELECT auth.uid()))
    );

DROP POLICY IF EXISTS "Manager_Full_Update" ON public.calculations;
CREATE POLICY "Manager_Full_Update" ON public.calculations
    FOR UPDATE USING (
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('manager', 'admin')
        AND status != 'draft'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('manager', 'admin')
    );

-- C. Calculations (Client Self View)
DROP POLICY IF EXISTS "Client_Self_View" ON public.calculations;
CREATE POLICY "Client_Self_View" ON public.calculations
    FOR ALL USING ((SELECT auth.uid()) = user_id);

-- D. Order Items Summaries & Partners
DROP POLICY IF EXISTS "Auth Read Summaries" ON public.order_items_summaries;
CREATE POLICY "Auth Read Summaries" ON public.order_items_summaries
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Auth Read Partners" ON public.partners;
CREATE POLICY "Auth Read Partners" ON public.partners
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

-- E. Audit & System Logs
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "system_logs_insert_policy" ON public.system_logs;
CREATE POLICY "system_logs_insert_policy" ON public.system_logs
    FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- F. System Templates
DROP POLICY IF EXISTS "Templates are viewable by authenticated" ON public.sys_message_templates;
CREATE POLICY "Templates are viewable by authenticated" ON public.sys_message_templates
    FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

-- G. Filter Presets (Manager)
DROP POLICY IF EXISTS "Managers can manage their own presets" ON public.manager_filter_presets;
CREATE POLICY "Managers can manage their own presets" ON public.manager_filter_presets
    FOR ALL USING ((SELECT auth.uid()) = user_id);


-- 2. FIX: `multiple_permissive_policies`
-- Consolidating overlapping policies to reduce policy check overhead.

-- A. Venues: Consolidate `venues_access_policy` and `venues_all_policy`
-- We will keep one robust policy and drop the others.
DROP POLICY IF EXISTS "venues_access_policy" ON public.venues;
DROP POLICY IF EXISTS "venues_all_policy" ON public.venues;

CREATE POLICY "Venue_Access_Consolidated" ON public.venues
    FOR ALL TO public
    USING (
        (SELECT auth.uid()) = owner_id 
        OR EXISTS(SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    )
    WITH CHECK ((SELECT auth.uid()) = owner_id);

-- B. System Settings: Consolidate Admin Modify policies
DROP POLICY IF EXISTS "system_settings_modify_policy" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.system_settings;

CREATE POLICY "System_Settings_Admin_Manage" ON public.system_settings
    FOR ALL USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- C. System Logs: Consolidate Insert policies
DROP POLICY IF EXISTS "system_logs_admin_policy" ON public.system_logs; 
-- Note: keeping system_logs_insert_policy as the single source for authenticated inserts (which includes admins)

-- Note on Calculations:
-- We have `Client_Self_View` and `Manager_Full_View`. These are distinct logic paths for distinct user types.
-- While Supabase flags them as "multiple permissive", combining them into one giant OR condition often makes readability worse vs marginally better performance.
-- However, we can ensure they are mutually exclusive or efficiently structured if needed.
-- In this case, wrapping auth calls (Fix 1) is the biggest win. Combining effectively creates:
-- USING ( (Client check) OR (Manager Check) )
-- which is what the engine does anyway. We will keep them separate for maintainability unless specifically requested to merge.
-- The provided plan focused on Fix 1 first, then Fix 2 where obvious duplicates exist (like venues).
