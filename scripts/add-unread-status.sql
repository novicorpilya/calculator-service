-- Добавляем колонку is_read в таблицу messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Создаем индекс для быстрого поиска непрочитанных сообщений
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;

-- Включаем колонку is_read в Realtime публикацию (если еще не включена)
-- Убеждаемся, что таблица имеет REPLICA IDENTITY FULL для корректной работы обновлений
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 4. Настраиваем права (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть, чтобы не было конфликтов
DROP POLICY IF EXISTS "Users can update their received messages is_read" ON messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;

-- Политика на чтение: только свои сообщения
CREATE POLICY "Users can view their own messages" 
ON messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Политика на обновление статуса прочтения
CREATE POLICY "Users can update their received messages is_read" 
ON messages FOR UPDATE 
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- 5. Оптимизация для списка чатов (уход от N+1)
-- Создаем функцию для получения списка контактов с последним сообщением
CREATE OR REPLACE VIEW chat_summaries AS
WITH last_messages AS (
    SELECT DISTINCT ON (
        CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
        CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END
    ) 
    *
    FROM messages
    ORDER BY 
        CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
        CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END,
        created_at DESC
)
SELECT 
    lm.*,
    p.organization_name,
    p.first_name,
    p.last_name,
    p.role,
    CASE WHEN lm.sender_id = p.id THEN lm.receiver_id ELSE lm.sender_id END as other_user_id
FROM last_messages lm
JOIN profiles p ON p.id = lm.sender_id OR p.id = lm.receiver_id
WHERE p.id != lm.sender_id OR p.id != lm.receiver_id; -- Оптимизированное представление для списка чатов
