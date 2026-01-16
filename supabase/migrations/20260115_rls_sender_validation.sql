-- Migration: Strengthen RLS policies for messages table
-- Ensures that users can only send messages as themselves

-- Drop existing insert policy if it exists (to recreate with stricter rules)
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;

-- Create strict insert policy: sender_id MUST match auth.uid()
CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
    );

-- Ensure users can only update their own messages
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

-- Ensure users can only delete their own messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE
    USING (sender_id = auth.uid());

-- Comment explaining the security model
COMMENT ON POLICY "Users can insert their own messages" ON messages IS 
    'Prevents spoofing: users cannot send messages pretending to be someone else';
