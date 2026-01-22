-- ============================================================
-- FIX: MESSAGES VISIBILITY FOR MANAGERS
-- Purpose: Restore full chat access for managers in their pipeline projects
-- ============================================================

-- 1. Drop potentially restrictive policies
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "Messages_CRM_Access" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Allow users to view messages they sent or received" ON public.messages;

-- 2. Unified MESSAGE SELECT Policy
-- Grants access if you are a participant OR if you have access to the related Project.
CREATE POLICY "Messages_Unified_Access" ON public.messages
    FOR SELECT TO public
    USING (
        -- Direct participant
        (SELECT auth.uid()) = sender_id 
        OR 
        (SELECT auth.uid()) = receiver_id
        OR
        -- Project context access
        (
            calculation_id IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM public.calculations c
                WHERE c.id = calculation_id 
                AND (
                    -- I am the client
                    c.user_id = (SELECT auth.uid())
                    OR
                    -- I am a manager/admin (can view all project chats in pipeline)
                    (
                        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('manager', 'admin')
                    )
                )
            )
        )
    );

-- 3. Unified MESSAGE INSERT Policy
CREATE POLICY "Messages_Unified_Insert" ON public.messages
    FOR INSERT TO public
    WITH CHECK (
        -- I can send if I am me :)
        (SELECT auth.uid()) = sender_id
        AND
        -- And if linked to a project, I must have access to that project
        (
            calculation_id IS NULL -- Direct msg case (handled by logic above usually, but safer to allow generic)
            OR
            EXISTS (
                SELECT 1 FROM public.calculations c
                WHERE c.id = calculation_id 
                AND (
                    c.user_id = (SELECT auth.uid())
                    OR
                    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('manager', 'admin')
                )
            )
        )
    );

-- 4. Unified MESSAGE UPDATE Policy
CREATE POLICY "Messages_Unified_Update" ON public.messages
    FOR UPDATE TO public
    USING ((SELECT auth.uid()) = sender_id);
