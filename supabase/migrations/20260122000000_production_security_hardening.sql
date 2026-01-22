-- ============================================================
-- PRODUCTION SECURITY HARDENING
-- Purpose: Restrict cross-manager editing and profile leakage
-- ============================================================

-- 1. HARDEN CALCULATIONS UPDATE
DROP POLICY IF EXISTS "calc_update_optimized" ON public.calculations;

CREATE POLICY "calc_update_hardened" ON public.calculations
    FOR UPDATE USING (
        -- Owner
        auth.uid() = user_id 
        OR 
        -- Assigned Manager
        auth.uid() = manager_id
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
        (auth.uid() = user_id AND status IN ('draft', 'changes'))
        OR 
        -- Managers/Admins can update
        public.get_my_role() IN ('manager', 'admin')
    );

-- 2. HARDEN PROFILE SELECT (Prevent total leakage)
DROP POLICY IF EXISTS "profiles_select_production" ON public.profiles;

CREATE POLICY "profiles_select_hardened" ON public.profiles
    FOR SELECT USING (
        -- Own profile
        auth.uid() = id 
        OR 
        -- Staff can see everything
        public.get_my_role() IN ('manager', 'admin')
        OR 
        -- Clients can ONLY see staff (managers/admins), not other clients
        (
            role IN ('manager', 'admin')
        )
    );
