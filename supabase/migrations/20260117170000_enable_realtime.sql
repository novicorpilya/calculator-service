-- Enable Realtime for key tables to ensure scripts and status updates work instantly
-- This is required for postgres_changes to fire.

-- 1. Ensure the publication exists (usually created by Supabase, but let's be safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Add tables to the publication
-- We use 'ALTER PUBLICATION ... ADD TABLE ...' but it fails if already added.
-- So we use a safe way to add them.
DO $$
BEGIN
    -- Add messages if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    -- Add calculations if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'calculations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.calculations;
    END IF;

    -- Add audit_logs just in case
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'audit_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
    END IF;
END $$;

-- 3. Set Replica Identity to FULL for messages and calculations
-- This ensures that UPDATE and DELETE events contain all columns (important for sync)
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.calculations REPLICA IDENTITY FULL;
