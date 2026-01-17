-- ============================================================
-- ADMIN SUPPORT TABLES AND RPCS
-- Version: 1.2.0 | Date: 2026-01-16
-- ============================================================

-- 1. Add status column to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked'));
    END IF;
END $$;

-- 2. Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('client', 'manager', 'admin')),
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb
);

-- 4. RLS for invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view invitations" ON public.invitations;
CREATE POLICY "Admins can view invitations" ON public.invitations
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert invitations" ON public.invitations;
CREATE POLICY "Admins can insert invitations" ON public.invitations
    FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete invitations" ON public.invitations;
CREATE POLICY "Admins can delete invitations" ON public.invitations
    FOR DELETE USING (public.is_admin());

-- 5. RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit_logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit_logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated can insert audit_logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit_logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. RPC: set_user_status
CREATE OR REPLACE FUNCTION public.set_user_status(user_id_param UUID, new_status TEXT)
RETURNS VOID AS $$
BEGIN
    -- Check if current user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can change user status';
    END IF;

    UPDATE public.profiles
    SET status = new_status, updated_at = NOW()
    WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: delete_user_v1
CREATE OR REPLACE FUNCTION public.delete_user_v1(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if current user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can delete users';
    END IF;

    -- Delete from public.profiles
    -- Note: This doesn't delete from auth.users unless there's a trigger or more permissions.
    -- But for the dashboard to stop showing them, this is the first step.
    DELETE FROM public.profiles WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
