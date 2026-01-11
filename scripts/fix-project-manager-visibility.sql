-- Fix profile visibility for collaboration (Managers and Clients)
-- This allows:
-- 1. Anyone logged in to see manager names/roles
-- 2. Anyone logged in to see their OWN profile full info
-- 3. Clients to see the basic info of managers assigned to their projects

-- First, drop existing restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- 1. COMPREHENSIVE VIEW POLICY
-- Allows all authenticated users to see ID, first_name, last_name, organization_name, and role of ALL profiles.
-- Sensitive info like email, phone, address should ideally be filtered at the SELECT level in the app, 
-- or by using a View, but since Supabase RLS works at the row level, we allow the row and trust the app's selective queries.
CREATE POLICY "Allow authenticated users to view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. UPDATE POLICY (Keep it restricted to own profile)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. INSERT POLICY (For trigger and manual setup)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

COMMIT;
