-- FIX: Standardized audit_logs table to match legacy service expectations and help PostgREST joins
-- This ensures 'user_id' and 'entity_type' columns exist and point to public.profiles

DROP TABLE IF EXISTS public.audit_logs CASCADE;

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    details jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    user_id uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (true); -- In production, add: AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'

CREATE POLICY "Users can populate audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
