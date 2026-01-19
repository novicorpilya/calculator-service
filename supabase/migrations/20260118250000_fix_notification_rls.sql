-- Migration: Fix Notification RLS (Add DELETE policy)
-- Date: 2026-01-18
-- Description: Allows users to delete their own notifications. 
--              This fixed the issue where "Clear All" or individual deletion
--              would appear to work in UI but items would return after refresh.

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Also ensure managers can insert notifications (for system events, though usually done via service role or trigger)
-- But if the client is doing it directly:
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
