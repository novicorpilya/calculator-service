-- FIX SUPABASE REALTIME & PERMISSIONS
-- Run this script in the Supabase SQL Editor to resolve CHANNEL_ERROR

-- 1. Enable Realtime for the 'calculations' table
DO $$
BEGIN
  -- We ensure 'calculations' is included in the realtime stream
  ALTER PUBLICATION supabase_realtime ADD TABLE calculations;
EXCEPTION
  WHEN OTHERS THEN
    -- Table might already be in publication or publication does not exist
    NULL;
END $$;

-- 2. Ensure REPLICA IDENTITY is set to FULL
-- This is CRITICAL for 'postgres_changes' to work correctly with all data fields
ALTER TABLE public.calculations REPLICA IDENTITY FULL;

-- 3. Verify RLS Policies for Managers
-- Managers must be able to SELECT calculations to subscribe to their changes
DO $$
BEGIN
    -- Check if RLS is enabled
    ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

    -- Drop existing to avoid conflicts
    DROP POLICY IF EXISTS "Managers can view all calculations" ON public.calculations;
    
    -- Create policy for managers
    CREATE POLICY "Managers can view all calculations" 
    ON public.calculations
    FOR SELECT 
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (role = 'manager' OR role = 'admin')
      )
    );

    -- Ensure clients can also see their own
    DROP POLICY IF EXISTS "Clients can view own calculations" ON public.calculations;
    CREATE POLICY "Clients can view own calculations"
    ON public.calculations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
END $$;

-- 4. Grant Realtime permissions to the 'authenticated' role
GRANT SELECT ON public.calculations TO authenticated;
