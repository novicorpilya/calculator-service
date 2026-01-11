-- STEP 1: DATABASE ISOLATION & CLEANUP
-- This script enforces strict isolation between Direct and Project chats.

BEGIN;

-- 1. Enforce Chat Type Isolation at the table level
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'chat_type_isolation') THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT chat_type_isolation 
        CHECK (
          (receiver_id IS NULL AND calculation_id IS NOT NULL) OR 
          (receiver_id IS NOT NULL AND calculation_id IS NULL)
        );
    END IF;
END $$;

-- 2. Ensure chat_read_markers structure is optimal
CREATE TABLE IF NOT EXISTS public.chat_read_markers (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  calculation_id UUID REFERENCES public.calculations(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, calculation_id)
);

-- 3. Cleanup Legacy Logic
DROP TRIGGER IF EXISTS on_message_inserted_update_unread ON public.messages;
DROP FUNCTION IF EXISTS public.handle_message_unread_sync();

-- 4. Strict Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_markers ENABLE ROW LEVEL SECURITY;

-- Clean up ALL potential old policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Direct chat visibility" ON public.messages;
DROP POLICY IF EXISTS "Direct chat insert" ON public.messages;
DROP POLICY IF EXISTS "Direct chat update" ON public.messages;
DROP POLICY IF EXISTS "Project chat visibility" ON public.messages;
DROP POLICY IF EXISTS "Project chat insert" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- 4.1 Direct Chat Policies
CREATE POLICY "Direct chat visibility"
ON public.messages FOR SELECT TO authenticated
USING (calculation_id IS NULL AND (auth.uid() = sender_id OR auth.uid() = receiver_id));

CREATE POLICY "Direct chat insert"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (calculation_id IS NULL AND auth.uid() = sender_id);

CREATE POLICY "Direct chat update"
ON public.messages FOR UPDATE TO authenticated
USING (calculation_id IS NULL AND (auth.uid() = sender_id OR auth.uid() = receiver_id))
WITH CHECK (calculation_id IS NULL AND (auth.uid() = sender_id OR auth.uid() = receiver_id));

-- 4.2 Project Chat Policies
CREATE POLICY "Project chat visibility"
ON public.messages FOR SELECT TO authenticated
USING (
  calculation_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.calculations c
      WHERE c.id = messages.calculation_id 
      AND (c.user_id = auth.uid() OR c.manager_id = auth.uid())
    ) OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'manager')
    )
  )
);

CREATE POLICY "Project chat insert"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  calculation_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.calculations c
      WHERE c.id = messages.calculation_id 
      AND (c.user_id = auth.uid() OR c.manager_id = auth.uid())
    ) OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role = 'admin' OR p.role = 'manager')
    )
  )
);

-- 4.3 Policy for markers
DROP POLICY IF EXISTS "Users can manage own markers" ON public.chat_read_markers;
CREATE POLICY "Users can manage own markers"
ON public.chat_read_markers
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMIT;
