-- Setup Supabase database schema for PRODUCTION
-- Run this SQL in Supabase SQL Editor
-- This version includes RLS (Row Level Security) policies

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  organization_name VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  role VARCHAR(50) DEFAULT 'manager' CHECK (role IN ('client', 'manager', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_organization_idx ON public.profiles(organization_name);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- 3. Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to call function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 7. ENABLE Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 9. RLS Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 10. RLS Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 11. RLS Policy: Users can insert their own profile (for trigger)
-- Note: The trigger function uses SECURITY DEFINER, so it bypasses RLS
-- But we still need this policy for direct inserts if needed
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 12. RLS Policy: Admins can view all profiles (optional - uncomment if needed)
-- CREATE POLICY "Admins can view all profiles"
--   ON public.profiles
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   );

-- 13. RLS Policy: Admins can update all profiles (optional - uncomment if needed)
-- CREATE POLICY "Admins can update all profiles"
--   ON public.profiles
--   FOR UPDATE
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   );

-- 14. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Notes for production:
-- 1. Make sure email confirmation is enabled in Supabase Dashboard > Authentication > Settings
-- 2. Configure password requirements in Supabase Dashboard > Authentication > Settings
-- 3. Enable rate limiting in Supabase Dashboard > Settings > API
-- 4. Set up proper CORS settings if using custom domain
-- 5. Enable email templates customization in Supabase Dashboard > Authentication > Email Templates

