-- COMPLETE REALTIME FIX FOR ALL TABLES
-- Run this script in Supabase SQL Editor to enable real-time updates
-- This fixes CHANNEL_ERROR and enables real-time for messages and calculations

-- ============================================
-- 1. ENABLE REALTIME FOR MESSAGES TABLE
-- ============================================

DO $$
BEGIN
  -- Add messages table to realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN
    -- Table already in publication
    NULL;
  WHEN undefined_object THEN
    -- Publication doesn't exist, create it
    CREATE PUBLICATION supabase_realtime FOR TABLE messages;
END $$;

-- Set REPLICA IDENTITY to FULL for messages
-- This allows Realtime to send all column values in updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.messages TO authenticated;

-- ============================================
-- 2. ENABLE REALTIME FOR CALCULATIONS TABLE
-- ============================================

DO $$
BEGIN
  -- Add calculations table to realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE calculations;
EXCEPTION
  WHEN duplicate_object THEN
    -- Table already in publication
    NULL;
  WHEN undefined_object THEN
    -- Publication doesn't exist, add to existing
    NULL;
END $$;

-- Set REPLICA IDENTITY to FULL for calculations
ALTER TABLE public.calculations REPLICA IDENTITY FULL;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.calculations TO authenticated;

-- ============================================
-- 3. VERIFY RLS POLICIES
-- ============================================

-- Ensure RLS is enabled on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Ensure RLS is enabled on calculations
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. MESSAGES RLS POLICIES
-- ============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages they sent" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages they received" ON public.messages;

-- Create comprehensive message viewing policy
CREATE POLICY "Users can view their messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id OR
  calculation_id IN (
    SELECT id FROM public.calculations 
    WHERE user_id = auth.uid() OR manager_id = auth.uid()
  )
);

-- ============================================
-- 5. CALCULATIONS RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Managers can view all calculations" ON public.calculations;
DROP POLICY IF EXISTS "Clients can view own calculations" ON public.calculations;

-- Managers and admins can view all
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

-- Clients can view their own
CREATE POLICY "Clients can view own calculations"
ON public.calculations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 6. VERIFY SETUP
-- ============================================

-- Check which tables are in realtime publication
SELECT 
  pt.schemaname,
  pt.tablename 
FROM pg_publication_tables pt
WHERE pt.pubname = 'supabase_realtime';

-- Check replica identity settings
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  CASE c.relreplident
    WHEN 'd' THEN 'default'
    WHEN 'n' THEN 'nothing'
    WHEN 'f' THEN 'full'
    WHEN 'i' THEN 'index'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname IN ('messages', 'calculations')
AND n.nspname = 'public';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Realtime setup complete!';
  RAISE NOTICE '📡 Tables enabled: messages, calculations';
  RAISE NOTICE '🔒 RLS policies updated';
  RAISE NOTICE '🔄 Replica identity set to FULL';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANT: Restart your application to apply changes';
END $$;
