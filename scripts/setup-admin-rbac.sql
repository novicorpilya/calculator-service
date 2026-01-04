-- ADMIN EMPOWERMENT: RBAC & Full Control
-- Run this SQL in Supabase Editor to grant Admins absolute power over users and deals

-- 1. Extend Profiles with Status (for Blocking)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='status') THEN
        ALTER TABLE public.profiles ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked'));
    END IF;
END $$;

-- 2. Create helper function to check if current user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2b. Helper to check if user is active (not blocked)
CREATE OR REPLACE FUNCTION public.is_active()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CALCULATIONS: Full Admin Control (View, Edit, Delete All)
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all calculations" ON public.calculations;
CREATE POLICY "Admins can manage all calculations"
    ON public.calculations
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Ensure existing user policies don't conflict and check for active status
DROP POLICY IF EXISTS "Users can manage own calculations" ON public.calculations;
CREATE POLICY "Users can manage own calculations"
    ON public.calculations
    FOR ALL
    TO authenticated
    USING ((auth.uid() = user_id OR auth.uid() = manager_id) AND public.is_active())
    WITH CHECK ((auth.uid() = user_id OR auth.uid() = manager_id) AND public.is_active());

-- 4. PROFILES: Full Admin Control (View, Update status, Delete All)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Blocking Logic: Prevent blocked users from doing anything
-- We can add a global check or specific policies. 
-- For now, let's ensure they can't even view their own data if blocked
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id AND status = 'active');

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id AND status = 'active')
  WITH CHECK (auth.uid() = id AND status = 'active');

-- 6. RPC for Admin to block/unblock user
CREATE OR REPLACE FUNCTION public.set_user_status(user_id_param UUID, new_status TEXT)
RETURNS VOID AS $$
BEGIN
    IF public.is_admin() THEN
        UPDATE public.profiles SET status = new_status WHERE id = user_id_param;
    ELSE
        RAISE EXCEPTION 'Access denied';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
