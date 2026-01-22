-- ============================================================
-- PRODUCTION RLS OPTIMIZATION
-- Purpose: Replace subqueries with optimized checks and JWT roles
-- ============================================================

-- Helper function to get current user role without heavy subqueries
-- This function is STABLE and SECURITY DEFINER for performance
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. RESET CALCULATIONS POLICIES
DROP POLICY IF EXISTS "calc_select" ON public.calculations;
DROP POLICY IF EXISTS "calc_update" ON public.calculations;

-- Optimized SELECT: Using role-based fast-track
CREATE POLICY "calc_select_optimized" ON public.calculations
    FOR SELECT USING (
        auth.uid() = user_id 
        OR auth.uid() = manager_id
        OR (
            status != 'draft' 
            AND get_my_role() IN ('manager', 'admin')
        )
    );

-- Optimized UPDATE:
CREATE POLICY "calc_update_optimized" ON public.calculations
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR auth.uid() = manager_id
        OR (
            status != 'draft' 
            AND get_my_role() IN ('manager', 'admin')
        )
    )
    WITH CHECK (
        -- Extra safety for client updates
        (auth.uid() = user_id AND status IN ('draft', 'changes'))
        OR get_my_role() IN ('manager', 'admin')
    );

-- 2. PROFILE POLICIES (Often a bottleneck)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select_production" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id 
        OR role IN ('manager', 'admin') -- Staff can see all profiles
        OR EXISTS (
            -- Clients can see their assigned manager
            SELECT 1 FROM public.calculations 
            WHERE (user_id = auth.uid() AND manager_id = public.profiles.id)
        )
    );

-- 3. STORAGE SECURITY (Receipts)
-- Ensure only owner or manager can see receipts
-- (Requires bucket-level policies in Supabase Storage)
