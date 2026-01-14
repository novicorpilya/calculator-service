-- ============================================================
-- ADMIN ROLES HARDENING
-- Version: 1.1.0 | Date: 2026-01-14
-- ============================================================

-- 1. Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Hardening Profiles RLS
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());

-- 3. Hardening Calculations RLS
DROP POLICY IF EXISTS "Admins can view all calculations" ON public.calculations;
CREATE POLICY "Admins can view all calculations" ON public.calculations
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all calculations" ON public.calculations;
CREATE POLICY "Admins can update all calculations" ON public.calculations
    FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete calculations" ON public.calculations;
CREATE POLICY "Admins can delete calculations" ON public.calculations
    FOR DELETE USING (public.is_admin());

-- 4. Hardening Messages RLS
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" ON public.messages
    FOR SELECT USING (public.is_admin());

-- 5. Hardening Venues RLS (Assuming table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'venues') THEN
        ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view own venues" ON public.venues;
        CREATE POLICY "Users can view own venues" ON public.venues
            FOR SELECT USING (auth.uid() = owner_id OR public.is_admin());
            
        DROP POLICY IF EXISTS "Users can insert own venues" ON public.venues;
        CREATE POLICY "Users can insert own venues" ON public.venues
            FOR INSERT WITH CHECK (auth.uid() = owner_id);
            
        DROP POLICY IF EXISTS "Users can update own venues" ON public.venues;
        CREATE POLICY "Users can update own venues" ON public.venues
            FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());
    END IF;
END $$;
