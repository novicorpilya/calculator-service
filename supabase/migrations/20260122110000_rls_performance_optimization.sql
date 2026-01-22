-- ============================================================
-- PERFORMANCE ADVISOR: COMPREHENSIVE RLS OPTIMIZATION
-- ============================================================
-- This migration addresses ALL performance warnings from Supabase Advisor:
-- 1. auth_rls_initplan: Replace auth.uid() with (SELECT auth.uid()) for query-level caching
-- 2. multiple_permissive_policies: Consolidate duplicate SELECT policies
--
-- SAFETY: Each section uses DROP IF EXISTS + CREATE to be idempotent
-- ============================================================

-- ====================
-- HELPER: Optimized get_my_role() function
-- Uses (SELECT auth.uid()) for InitPlan optimization
-- ====================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
    SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ====================
-- 1. PROFILES TABLE
-- Issue: profiles_read_all AND profiles_select_hardened both exist for SELECT
-- Solution: Drop both, create single optimized policy
-- ====================

-- Safe cleanup
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_hardened" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_production" ON public.profiles;

-- Single optimized SELECT policy
CREATE POLICY "profiles_select_optimized" ON public.profiles
    FOR SELECT USING (
        -- Own profile (always allowed)
        (SELECT auth.uid()) = id 
        OR 
        -- Staff can see all profiles for dashboard/assignment
        public.get_my_role() IN ('manager', 'admin')
        OR 
        -- Clients can see staff profiles (for assigned manager info)
        role IN ('manager', 'admin')
    );

-- UPDATE: Own profile only
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_optimized" ON public.profiles
    FOR UPDATE USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- INSERT: Own profile only (signup flow)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_optimized" ON public.profiles
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- ====================
-- 2. CALCULATIONS TABLE
-- Issue: Multiple policies + auth.uid() without SELECT wrapper
-- Solution: Consolidated, optimized policies
-- ====================

-- Clean slate
DROP POLICY IF EXISTS "calc_select" ON public.calculations;
DROP POLICY IF EXISTS "calc_select_optimized" ON public.calculations;
DROP POLICY IF EXISTS "calc_update" ON public.calculations;
DROP POLICY IF EXISTS "calc_update_optimized" ON public.calculations;
DROP POLICY IF EXISTS "calc_update_hardened" ON public.calculations;
DROP POLICY IF EXISTS "calc_insert" ON public.calculations;
DROP POLICY IF EXISTS "calc_delete" ON public.calculations;
DROP POLICY IF EXISTS "Calculations_Unified_Select" ON public.calculations;
DROP POLICY IF EXISTS "Calculations_Unified_Update" ON public.calculations;
DROP POLICY IF EXISTS "Calculations_Unified_Modify" ON public.calculations;
DROP POLICY IF EXISTS "Calculations_Unified_Insert" ON public.calculations;

-- SELECT: Single optimized policy
CREATE POLICY "calc_select_v2" ON public.calculations
    FOR SELECT USING (
        -- Owner
        (SELECT auth.uid()) = user_id 
        OR 
        -- Assigned Manager
        (SELECT auth.uid()) = manager_id
        OR
        -- Staff can see non-drafts
        (
            status != 'draft' 
            AND public.get_my_role() IN ('manager', 'admin')
        )
    );

-- UPDATE: Single optimized policy with proper checks
CREATE POLICY "calc_update_v2" ON public.calculations
    FOR UPDATE 
    USING (
        -- Owner
        (SELECT auth.uid()) = user_id 
        OR 
        -- Assigned Manager
        (SELECT auth.uid()) = manager_id
        OR
        -- Admin always allowed
        public.get_my_role() = 'admin'
        OR
        -- Managers can update UNASSIGNED projects (to assign themselves)
        (
            manager_id IS NULL 
            AND status != 'draft'
            AND public.get_my_role() = 'manager'
        )
    )
    WITH CHECK (
        -- Client can only update in specific statuses
        ((SELECT auth.uid()) = user_id AND status IN ('draft', 'changes'))
        OR 
        -- Managers/Admins can update
        public.get_my_role() IN ('manager', 'admin')
    );

-- INSERT: Only owner can create
CREATE POLICY "calc_insert_v2" ON public.calculations
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE: Owner or Admin
CREATE POLICY "calc_delete_v2" ON public.calculations
    FOR DELETE USING (
        (SELECT auth.uid()) = user_id 
        OR public.get_my_role() = 'admin'
    );

-- ====================
-- 3. SYSTEM_SETTINGS TABLE
-- Issue: auth.role() and auth.uid() not wrapped
-- ====================

DROP POLICY IF EXISTS "System_Settings_Unified" ON public.system_settings;

CREATE POLICY "system_settings_v2" ON public.system_settings
    FOR ALL USING (
        -- Authenticated users can read
        (SELECT auth.role()) = 'authenticated'
    )
    WITH CHECK (
        -- Only admins can modify
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ====================
-- 4. PARTNERS TABLE
-- Issue: auth.uid() not wrapped + duplicate policies
-- ====================

DROP POLICY IF EXISTS "Admins have full access to partners" ON public.partners;
DROP POLICY IF EXISTS "Auth Read Partners" ON public.partners;

CREATE POLICY "partners_admin_access_v2" ON public.partners
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role = 'admin'
        )
    );

-- ====================
-- 5. PARTNER_LEADS TABLE
-- Issue: auth.uid() not wrapped
-- ====================

DROP POLICY IF EXISTS "Admins have full access to partner_leads" ON public.partner_leads;

CREATE POLICY "partner_leads_admin_access_v2" ON public.partner_leads
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role = 'admin'
        )
    );

-- ====================
-- VERIFICATION COMMENT
-- ====================
-- After applying this migration, run Supabase Performance Advisor again.
-- Expected result: All auth_rls_initplan and multiple_permissive_policies warnings should be resolved.
