-- ============================================================
-- ENABLE REALTIME FOR CALCULATIONS
-- Purpose: Allow instant status updates across all clients
-- ============================================================

-- Enable realtime for calculations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.calculations;
