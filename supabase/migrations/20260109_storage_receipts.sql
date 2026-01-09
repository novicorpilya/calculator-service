-- ============================================================
-- STORAGE SETUP: Receipts Bucket & Security
-- ============================================================

-- 1. Создаем бакет для чеков (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'receipts', 
    'receipts', 
    false, 
    10485760, -- 10MB
    '{application/pdf,image/jpeg,image/png}'
)
ON CONFLICT (id) DO UPDATE SET 
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = '{application/pdf,image/jpeg,image/png}';

-- 2. Удаляем старые политики если есть
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Managers can view all receipts" ON storage.objects;

-- 3. Policy: Загрузка (только аутентифицированные пользователи)
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'receipts'
);

-- 4. Policy: Просмотр своих чеков
CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'receipts' AND (auth.uid()::text = (storage.foldername(name))[1])
);

-- 5. Policy: Менеджеры могут смотреть всё
CREATE POLICY "Managers can view all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'receipts' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
);
