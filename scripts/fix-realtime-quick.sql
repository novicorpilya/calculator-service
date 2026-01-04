-- QUICK REALTIME FIX (No verification queries)
-- Run this in Supabase SQL Editor to enable real-time updates
-- This is a simplified version without verification queries

-- ============================================
-- 1. ENABLE REALTIME FOR MESSAGES TABLE
-- ============================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
GRANT SELECT ON public.messages TO authenticated;

-- ============================================
-- 2. ENABLE REALTIME FOR CALCULATIONS TABLE
-- ============================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE calculations;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.calculations REPLICA IDENTITY FULL;
GRANT SELECT ON public.calculations TO authenticated;

-- ============================================
-- 3. ENABLE RLS
-- ============================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. MESSAGES RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;

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

DROP POLICY IF EXISTS "Managers can view all calculations" ON public.calculations;
DROP POLICY IF EXISTS "Clients can view own calculations" ON public.calculations;

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

CREATE POLICY "Clients can view own calculations"
ON public.calculations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- DONE!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Realtime enabled successfully!';
  RAISE NOTICE '⚠️ Restart your application to apply changes';
END $$;
