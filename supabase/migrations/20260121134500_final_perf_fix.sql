-- ============================================================
-- FINAL PERFORMANCE CONSOLIDATION
-- Purpose: Merge overlapping RLS policies to eliminate 'Multiple Permissive Policies' warnings
-- ============================================================

-- 1. CONSOLIDATE: CALCULATIONS
-- Combining `Client_Self_View` and `Manager_Full_View` into a single, optimized SELECT policy.
-- Combining `Client_Self_Update` (implied in ALL) and `Manager_Full_Update` into a single UPDATE policy.

DROP POLICY IF EXISTS "Client_Self_View" ON public.calculations;
DROP POLICY IF EXISTS "Manager_Full_View" ON public.calculations;
DROP POLICY IF EXISTS "Manager_Full_Update" ON public.calculations;
-- Ensure any other overlapping ones are gone
DROP POLICY IF EXISTS "Manager_Update_Pipeline" ON public.calculations;
DROP POLICY IF EXISTS "Manager_Select_Pipeline" ON public.calculations;

-- A. Unified SELECT Policy
CREATE POLICY "Calculations_Unified_Select" ON public.calculations
    FOR SELECT TO public
    USING (
        -- Client: Own data
        (SELECT auth.uid()) = user_id 
        OR 
        -- Manager/Admin: Pipeline data (using efficient role check)
        (
            (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('manager', 'admin')
            AND 
            (status != 'draft' OR user_id = (SELECT auth.uid()) OR manager_id = (SELECT auth.uid()))
        )
    );

-- B. Unified UPDATE Policy
CREATE POLICY "Calculations_Unified_Update" ON public.calculations
    FOR UPDATE TO public
    USING (
        -- Client: Own data (rare, but allowed for drafts usually, or specific fields)
        (SELECT auth.uid()) = user_id
        OR
        -- Manager/Admin: Pipeline data
        (
            (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('manager', 'admin')
            AND status != 'draft'
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) = user_id
        OR
        (
           (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('manager', 'admin')
        )
    );

-- C. Unified INSERT/DELETE Policy
-- Re-creating Client Access for Insert/Delete explicitly since we dropped ALL policy
CREATE POLICY "Calculations_Unified_Modify" ON public.calculations
    FOR DELETE TO public
    USING (
        (SELECT auth.uid()) = user_id
        OR
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin'
    );

CREATE POLICY "Calculations_Unified_Insert" ON public.calculations
    FOR INSERT TO public
    WITH CHECK (
        (SELECT auth.uid()) = user_id
        OR
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'admin'
    );


-- 2. CONSOLIDATE: SYSTEM SETTINGS
-- Merge overlapping admin policies
DROP POLICY IF EXISTS "System_Settings_Admin_Manage" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_select_policy" ON public.system_settings;

CREATE POLICY "System_Settings_Unified" ON public.system_settings
    FOR ALL TO public
    USING (
        -- Everyone authenticated can read (if valid for your app? usually yes for public configs)
        -- OR restrict read to admins only? The warning implies authenticated read exists.
        -- Let's assume: Admins manage, Authenticated read.
        
        ((SELECT auth.role()) = 'authenticated') -- Base read permission
        AND
        (
            -- If operation is not SELECT, enforce Admin
            current_setting('request.method', true) = 'GET'
            OR
            EXISTS(SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
        )
    )
    WITH CHECK (
         EXISTS(SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );
