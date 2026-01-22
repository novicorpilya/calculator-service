-- ============================================================
-- FIX: PROFILES RLS FOR JOINS
-- Purpose: Ensure profiles table is readable for joins in calculations
-- ============================================================

-- Nuclear cleanup for profiles policies
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- Create simple, broad read access for authenticated users
CREATE POLICY "profiles_read_all" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update own profile
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert own profile (for signup flow)
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
