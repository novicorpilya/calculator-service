-- ============================================================
-- ENTERPRISE HARDENING: ROLE PROTECTION & SIGNUP SECURITY
-- Version: 1.1.0 | Date: 2026-01-22
-- Purpose: Prevent role injection and unauthorized role escalation
-- ============================================================

-- 1. FIX: Role Injection in handle_new_user()
-- We MUST NOT trust NEW.raw_user_meta_data->>'role' from public signups.
-- This is a classic Supabase security vulnerability.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        'client' -- ALWAYS default to client for public signups. 
                 -- Admins/Managers should be created via admin dashboard or invite flow.
    )
    ON CONFLICT (id) DO UPDATE SET 
        email = EXCLUDED.email,
        first_name = COALESCE(profiles.first_name, EXCLUDED.first_name);
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. FIX: Unauthorized Role Escalation via Profile Update
-- Current RLS allows users to update their own role column.

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "profiles_update_optimized" ON public.profiles;

-- Create hardened update policies
-- A. Users can update their own NON-SENSITIVE info
CREATE POLICY "profiles_update_self_safe" ON public.profiles
    FOR UPDATE 
    USING ((SELECT auth.uid()) = id)
    WITH CHECK (
        (SELECT auth.uid()) = id 
        AND (
            -- Ensure role DOES NOT CHANGE if not an admin
            role = (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
            OR 
            -- Admin can change roles
            (SELECT public.get_my_role()) = 'admin'
        )
    );

-- 3. FIX: Search Path Hardening (Defense in Depth)
-- Ensure all remaining security-sensitive triggers have fixed search paths
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_my_role() SET search_path = public;


-- 4. ENTERPRISE FEATURE: Invitation Token Role Assignment
-- Since we disabled 'role' metadata for safety, the invite flow needs a secure way
-- to assign the correct role. We'll add an RPC for this that validates the token.

CREATE OR REPLACE FUNCTION public.assign_role_via_invitation(
    p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    -- 1. Find and validate invitation
    SELECT * INTO v_invitation 
    FROM public.invitations 
    WHERE token = p_token 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND accepted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 2. Update user profile role
    UPDATE public.profiles 
    SET role = v_invitation.role 
    WHERE id = (SELECT auth.uid());
    
    -- 3. Mark invitation as accepted
    UPDATE public.invitations 
    SET accepted_at = NOW(),
        accepted_by = (SELECT auth.uid())
    WHERE id = v_invitation.id;
    
    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_role_via_invitation(TEXT) TO authenticated;


-- 5. AUDIT LOGGING: Log Role Changes
CREATE OR REPLACE FUNCTION public.fn_log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role != NEW.role THEN
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
        VALUES (
            (SELECT auth.uid()),
            'ROLE_CHANGE',
            'profile',
            NEW.id,
            jsonb_build_object('role', OLD.role),
            jsonb_build_object('role', NEW.role)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_log_profile_changes ON public.profiles;
CREATE TRIGGER tr_log_profile_changes
    AFTER UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_profile_changes();

NOTIFY pgrst, 'reload schema';
