-- Migration: Add UNIQUE constraint on client_message_id to prevent duplicates on retry
-- This ensures idempotent message sending

-- First, clean up any existing duplicates (keep the first one by created_at)
DELETE FROM messages a
USING messages b
WHERE a.client_message_id IS NOT NULL
  AND a.client_message_id = b.client_message_id
  AND a.created_at > b.created_at;

-- Now add the unique constraint (partial - only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_client_message_id_unique 
ON messages (client_message_id) 
WHERE client_message_id IS NOT NULL;

COMMENT ON INDEX idx_messages_client_message_id_unique IS 'Prevents duplicate messages on retry. client_message_id is generated client-side.';
