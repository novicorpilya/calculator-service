-- Fix RLS for profiles to allow collaboration
-- 1. Allow all authenticated users to view basic profile info (names and roles)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Ensure clients can see projects they created and managers can see projects assigned to them
-- (Existing policies for calculations should already handle this, but let's double check if needed)
-- ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Users can view relevant calculations" ON public.calculations;
-- CREATE POLICY "Users can view relevant calculations"
--   ON public.calculations
--   FOR SELECT
--   TO authenticated
--   USING (
--     auth.uid() = user_id OR 
--     auth.uid() = manager_id OR
--     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
--   );
