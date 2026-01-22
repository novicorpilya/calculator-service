-- ============================================================
-- Migration: Partner Table RLS Policies
-- Description: Enable RLS and add policies for admin access to partners table
-- ============================================================

-- 1. Enable RLS on partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 2. Admin full access policy (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins have full access to partners"
ON public.partners
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- 3. Grant necessary permissions to authenticated users (RLS will filter)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;

-- 4. Also ensure partner_leads has proper RLS for admins
-- (Already has RLS enabled from previous migration, just need admin policy)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'partner_leads' 
        AND policyname = 'Admins have full access to partner_leads'
    ) THEN
        CREATE POLICY "Admins have full access to partner_leads"
        ON public.partner_leads
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        );
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_leads TO authenticated;
