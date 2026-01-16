-- ============================================================
-- PRODUCTION FINAL FIXES & SCHEMA COMPLETION
-- Date: 2026-01-16
-- Description: Ensures all tables, buckets, and RPCs mentioned 
-- in the code actually exist in the database.
-- ============================================================

-- 1. Profiles: Add missing 'status' column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked'));
    END IF;
END $$;

-- 2. System Logs Table Creation
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for system_logs (matching code expectations)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_logs_admin_policy" ON public.system_logs;
CREATE POLICY "system_logs_admin_policy" ON public.system_logs 
    FOR ALL TO public
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "system_logs_authenticated_insert" ON public.system_logs;
CREATE POLICY "system_logs_authenticated_insert" ON public.system_logs 
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 3. Receipts Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false) 
ON CONFLICT (id) DO UPDATE SET public = false;

-- Policies for receipts
-- Users can upload/view their own receipts (path: userId/calcId/fileName)
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
CREATE POLICY "Users can upload own receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'receipts' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
CREATE POLICY "Users can view own receipts" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'receipts' 
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR (SELECT public.is_manager_or_admin())
    )
);

-- 4. Admin RPC: delete_user_v1
-- Note: This only deletes the profile and triggers cleanup. 
-- Actual auth.users deletion usually requires service_role from edge functions,
-- but for MVP we ensure DB consistency.
CREATE OR REPLACE FUNCTION public.delete_user_v1(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if requester is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can delete users';
    END IF;

    -- Delete profile (cascades or triggers related cleanup)
    DELETE FROM public.profiles WHERE id = user_id_param;
    
    -- In a real Supabase prod environment, you'd call a webhook or 
    -- handle auth.users via a separate service role client.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog, temp;

-- 5. Admin RPC: set_user_status
CREATE OR REPLACE FUNCTION public.set_user_status(user_id_param UUID, new_status TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can change user status';
    END IF;

    UPDATE public.profiles 
    SET status = new_status, updated_at = NOW()
    WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog, temp;
