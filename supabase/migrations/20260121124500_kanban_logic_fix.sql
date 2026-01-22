-- FIX: RECURSIVE RLS POLICIES & KANBAN VISIBILITY
-- This file fixes the "406 Not Acceptable" error and the recursive profile checks.

-- 1. Ensure helper functions are non-recursive (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('manager', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Profiles Policy (Clean)
DROP POLICY IF EXISTS "Users can view profiles of their contacts" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visibility" ON public.profiles;
CREATE POLICY "Profiles visibility" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id 
        OR public.is_manager_or_admin()
    );

-- 3. Calculations Policies (The core fix for 406 Error)
DROP POLICY IF EXISTS "Managers update pipeline" ON public.calculations;
DROP POLICY IF EXISTS "Managers can update unassigned calculations" ON public.calculations;
DROP POLICY IF EXISTS "Managers can update assigned calculations" ON public.calculations;
DROP POLICY IF EXISTS "Manage calculations for managers and admins" ON public.calculations;
DROP POLICY IF EXISTS "Managers view pipeline" ON public.calculations;
DROP POLICY IF EXISTS "Managers can view all pipeline" ON public.calculations;
DROP POLICY IF EXISTS "Admins can update all calculations" ON public.calculations;

-- SELECT: Managers must see everything in pipeline to avoid 406 after update
CREATE POLICY "Managers_Select_All" ON public.calculations
    FOR SELECT USING (
        public.is_manager_or_admin()
        AND (status != 'draft' OR user_id = auth.uid() OR manager_id = auth.uid())
    );

-- UPDATE: Managers can move any pipeline card
CREATE POLICY "Managers_Update_All" ON public.calculations
    FOR UPDATE USING (
        public.is_manager_or_admin()
        AND status != 'draft'
    )
    WITH CHECK (public.is_manager_or_admin());

-- ALL: Admin override
CREATE POLICY "Admins_All" ON public.calculations
    FOR ALL USING (public.is_admin());
