-- ============================================================
-- FIX: 406 ERROR RECOVERY
-- Purpose: Restore stable RLS policies for Calculations. 
-- We prioritize functionality over linter warnings about "multiple policies".
-- ============================================================

-- 1. Cleanup all experimental unified policies
DROP POLICY IF EXISTS "Calculations_Unified_Select" ON public.calculations;
DROP POLICY IF EXISTS "Calculations_Unified_Update" ON public.calculations;
DROP POLICY IF EXISTS "Calculations_Unified_Insert" ON public.calculations;
DROP POLICY IF EXISTS "Calculations_Unified_Modify" ON public.calculations;
DROP POLICY IF EXISTS "Calculations_Unified_Delete" ON public.calculations;

-- 2. RESET TO STABLE MANAGER POLICIES
-- Manager Select: explicit and permissive for pipeline
CREATE POLICY "Manager_Select_Stable" ON public.calculations
    FOR SELECT TO public
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('manager', 'admin')
        AND (status != 'draft' OR user_id = auth.uid() OR manager_id = auth.uid())
    );

-- Manager Update: explicit and permissive for pipeline
CREATE POLICY "Manager_Update_Stable" ON public.calculations
    FOR UPDATE TO public
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('manager', 'admin')
        AND status != 'draft'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('manager', 'admin')
    );

-- 3. RESET TO STABLE CLIENT POLICIES
-- Client Select
CREATE POLICY "Client_Select_Stable" ON public.calculations
    FOR SELECT TO public
    USING (auth.uid() = user_id);

-- Client Update
CREATE POLICY "Client_Update_Stable" ON public.calculations
    FOR UPDATE TO public
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. COMMON OPERATIONS
-- Insert
CREATE POLICY "Common_Insert_Stable" ON public.calculations
    FOR INSERT TO public
    WITH CHECK (auth.uid() = user_id);

-- Delete
CREATE POLICY "Common_Delete_Stable" ON public.calculations
    FOR DELETE TO public
    USING (
        auth.uid() = user_id 
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
