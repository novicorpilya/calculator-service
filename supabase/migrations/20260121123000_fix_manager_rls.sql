-- FIX: RECURSIVE RLS POLICIES
-- The previous migration caused infinite recursion because profiles policy called calculations, 
-- and calculations policy called profiles.
-- We solve this using SECURITY DEFINER functions which bypass RLS.

-- 1. Ensure we have is_admin function (Security Definer avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Managers policy to use existing is_manager_or_admin() function
DROP POLICY IF EXISTS "Managers can update unassigned calculations" ON public.calculations;
CREATE POLICY "Managers can update unassigned calculations" ON public.calculations
    FOR UPDATE USING (
        public.is_manager_or_admin() 
        AND manager_id IS NULL
        AND status != 'draft'
    );

-- 3. Update Assigned Managers policy
DROP POLICY IF EXISTS "Managers can update assigned calculations" ON public.calculations;
CREATE POLICY "Managers can update assigned calculations" ON public.calculations
    FOR UPDATE USING (
        auth.uid() = manager_id
        OR public.is_admin()
    );

-- 4. Fix the Admin "Global" policy to use the non-recursive function
DROP POLICY IF EXISTS "Admins can update all calculations" ON public.calculations;
CREATE POLICY "Admins can update all calculations" ON public.calculations
    FOR ALL USING (
        public.is_admin()
    );
