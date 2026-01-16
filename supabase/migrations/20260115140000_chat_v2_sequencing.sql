-- ============================================================
-- CHAT V2: Sequencing, Tombstones and Reliability
-- ============================================================

-- 1. Add server_seq_id to messages
-- Using BIGSERIAL to ensure monotonic incrementing sequence
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS server_seq_id BIGSERIAL;

-- Create index for delta fetching
CREATE INDEX IF NOT EXISTS idx_messages_seq_id ON public.messages(server_seq_id);

-- 2. Create Tombstones table for tracking deleted messages
-- This allows clients to sync deletions after being offline
CREATE TABLE IF NOT EXISTS public.chat_tombstones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    sender_id UUID,
    receiver_id UUID,
    calculation_id UUID,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    server_seq_id BIGINT -- The seq_id the message had before deletion
);

CREATE INDEX IF NOT EXISTS idx_chat_tombstones_deleted_at ON public.chat_tombstones(deleted_at);

-- 3. Trigger to auto-populate tombstones on delete
CREATE OR REPLACE FUNCTION public.fn_create_chat_tombstone()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.chat_tombstones (
        message_id, 
        sender_id, 
        receiver_id, 
        calculation_id, 
        server_seq_id
    )
    VALUES (
        OLD.id, 
        OLD.sender_id, 
        OLD.receiver_id, 
        OLD.calculation_id, 
        OLD.server_seq_id
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_chat_tombstone ON public.messages;
CREATE TRIGGER trg_chat_tombstone
    BEFORE DELETE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.fn_create_chat_tombstone();
