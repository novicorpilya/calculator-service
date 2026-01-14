-- Финальное исправление политики безопасности для статуса прочтения
DROP POLICY IF EXISTS "Allow users to update messages status" ON public.messages;

-- Разрешаем отправителю и получателю обновлять сообщение.
-- Это необходимо для того, чтобы получатель мог проставить флаг is_read = true.
CREATE POLICY "Allow users to update messages status" ON public.messages
    FOR UPDATE USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    )
    WITH CHECK (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Позволяем видеть все сообщения участникам проекта или личного чата
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
CREATE POLICY "Users can view messages they sent or received" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id 
        OR auth.uid() = receiver_id
        OR (calculation_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.calculations 
            WHERE id = calculation_id AND (user_id = auth.uid() OR manager_id = auth.uid())
        ))
    );
