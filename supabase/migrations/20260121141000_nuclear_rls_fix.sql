-- ============================================================
-- NUCLEAR FIX: COMPLETE RLS RESET FOR CALCULATIONS
-- Purpose: Remove ALL policies and create minimal, working set
-- ============================================================

-- STEP 1: NUKE EVERYTHING
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'calculations' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.calculations', pol.policyname);
    END LOOP;
END $$;

-- STEP 2: CREATE MINIMAL WORKING POLICIES

-- SELECT: One policy to rule them all
CREATE POLICY "calc_select" ON public.calculations
    FOR SELECT USING (
        -- Owner
        auth.uid() = user_id 
        OR 
        -- Assigned Manager
        auth.uid() = manager_id
        OR
        -- Any Manager/Admin can see non-drafts
        (
            status != 'draft' 
            AND EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('manager', 'admin')
            )
        )
    );

-- UPDATE: One policy to rule them all  
CREATE POLICY "calc_update" ON public.calculations
    FOR UPDATE USING (
        -- Owner can update own
        auth.uid() = user_id 
        OR 
        -- Assigned Manager can update
        auth.uid() = manager_id
        OR
        -- Any Manager/Admin can update non-drafts in pipeline
        (
            status != 'draft' 
            AND EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('manager', 'admin')
            )
        )
    );

-- INSERT: Only owner can create
CREATE POLICY "calc_insert" ON public.calculations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DELETE: Owner or Admin
CREATE POLICY "calc_delete" ON public.calculations
    FOR DELETE USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
