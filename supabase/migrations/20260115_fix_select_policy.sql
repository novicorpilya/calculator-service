-- Migration: Fix SELECT policy for messages
-- Ensures users can read messages where they are sender, receiver, or participant of calculation

-- Drop any broken SELECT policy
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can select their messages" ON messages;
DROP POLICY IF EXISTS "Enable read access for users" ON messages;

-- Create proper SELECT policy
-- Users can see messages where:
-- 1. They are the sender
-- 2. They are the receiver (direct messages)
-- 3. They are a participant of the calculation (project messages)
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT
    USING (
        sender_id = auth.uid()
        OR receiver_id = auth.uid()
        OR (
            calculation_id IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM calculations c 
                WHERE c.id::text = messages.calculation_id 
                AND (c.user_id = auth.uid() OR c.manager_id = auth.uid())
            )
        )
    );

COMMENT ON POLICY "Users can view their messages" ON messages IS 
    'Users can see: their sent messages, received messages, or project chat messages they participate in';
