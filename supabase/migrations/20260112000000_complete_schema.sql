-- ============================================================
-- COMPLETE SCHEMA: Calculator Service
-- Version: 1.0.1 | Date: 2026-01-14
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    organization_name TEXT,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'manager', 'client')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function to check role without RLS recursion (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('manager', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of their contacts" ON public.profiles;

CREATE POLICY "Users can view profiles of their contacts" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR public.is_manager_or_admin()
        OR id IN (
            SELECT user_id FROM public.calculations WHERE manager_id = auth.uid()
            UNION
            SELECT manager_id FROM public.calculations WHERE user_id = auth.uid()
        )
        OR id IN (
            SELECT CASE WHEN sender_id = auth.uid() THEN receiver_id ELSE sender_id END
            FROM public.messages
            WHERE (sender_id = auth.uid() OR receiver_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- 3. TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. CALCULATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES auth.users(id),
    organization_name TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'draft',
    zone_details JSONB DEFAULT '[]'::jsonb,
    total_area NUMERIC DEFAULT 0,
    zones_count INT DEFAULT 0,
    staff_count INT DEFAULT 0,
    daily_visitors INT DEFAULT 0,
    sanitary_level TEXT,
    intensity_level TEXT,
    replacement_cycle TEXT,
    results JSONB,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    total_cost_value NUMERIC DEFAULT 0,
    total_items_count INT DEFAULT 0,
    version_number INT DEFAULT 1,
    manager_adjustments JSONB DEFAULT '{}'::jsonb,
    locked_at TIMESTAMPTZ,
    locked_by UUID,
    lock_expires_at TIMESTAMPTZ,
    final_snapshot JSONB,
    receipt_path TEXT,
    project_number SERIAL
);

-- RLS for calculations
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own calculations" ON public.calculations;
CREATE POLICY "Users can view own calculations" ON public.calculations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own calculations" ON public.calculations;
CREATE POLICY "Users can insert own calculations" ON public.calculations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calculations" ON public.calculations;
CREATE POLICY "Users can update own calculations" ON public.calculations
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calculations" ON public.calculations;
CREATE POLICY "Users can delete own calculations" ON public.calculations
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can view assigned calculations" ON public.calculations;
CREATE POLICY "Managers can view assigned calculations" ON public.calculations
    FOR SELECT USING (auth.uid() = manager_id);

DROP POLICY IF EXISTS "Managers can update assigned calculations" ON public.calculations;
CREATE POLICY "Managers can update assigned calculations" ON public.calculations
    FOR UPDATE USING (auth.uid() = manager_id);

DROP POLICY IF EXISTS "Managers can view unassigned calculations" ON public.calculations;
CREATE POLICY "Managers can view unassigned calculations" ON public.calculations
    FOR SELECT USING (
        manager_id IS NULL 
        AND status != 'draft'
        AND public.is_manager_or_admin()
    );

-- ============================================================
-- 5. MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id),
    calculation_id UUID REFERENCES public.calculations(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    voice_url TEXT,
    voice_duration NUMERIC,
    is_read BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES public.messages(id),
    message_type TEXT DEFAULT 'text',
    metadata JSONB DEFAULT '{}'::jsonb,
    event_reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: message is either project-based OR direct, not both
    CONSTRAINT chat_type_isolation CHECK (
        (calculation_id IS NOT NULL AND receiver_id IS NULL) OR
        (calculation_id IS NULL AND receiver_id IS NOT NULL) OR
        (calculation_id IS NULL AND receiver_id IS NULL)
    )
);

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
CREATE POLICY "Users can view messages they sent or received" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id 
        OR auth.uid() = receiver_id
        OR calculation_id IN (SELECT id FROM public.calculations WHERE user_id = auth.uid() OR manager_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Index for faster message lookups
CREATE INDEX IF NOT EXISTS idx_messages_calculation ON public.messages(calculation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_event_ref ON public.messages(event_reference_id);

-- ============================================================
-- 6. SYSTEM MESSAGE TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sys_message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_status TEXT UNIQUE NOT NULL,
    body_markdown TEXT NOT NULL,
    action_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sys_message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Templates are viewable by authenticated" ON public.sys_message_templates;
CREATE POLICY "Templates are viewable by authenticated" ON public.sys_message_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Seed initial templates
INSERT INTO public.sys_message_templates (trigger_status, body_markdown, action_config)
VALUES 
(
    'EXPERT', 
    E'Здравствуйте! 👋\n\nВаш проект #{{projectNo}} («{{organizationName}}») принят в работу.\nМеня зовут {{managerName}}, я ваш персональный эксперт.\n\n━━━━━━━━━━━━━━━━━━━\n\n📋 *Что я сделаю в рамках аудита:*\n\n🔍 **Проверю нормы** расхода\n💬 **Оптимизирую** список товаров\n💰 **Подготовлю окончательное** КП\n\nОбычно это занимает **от 1 до 4 часов**.',
    '{"type": "welcome_card"}'
),
(
    'PAID', 
    E'Добрый день, {{organizationName}}! 🎉\n\nВаша оплата по заказу №{{projectNo}} успешно получена и подтверждена ✅\n\n━━━━━━━━━━━━━━━━━━━\n\n📋 *План реализации:*',
    '{"type": "roadmap_card", "steps": ["Закупка", "Сборка", "Логистика", "Отправка"], "description": "Команда закупки начала работу над вашим заказом"}'
)
ON CONFLICT (trigger_status) DO UPDATE SET
    body_markdown = EXCLUDED.body_markdown,
    action_config = EXCLUDED.action_config;

-- ============================================================
-- 7. CALCULATION AUDIT LOG (for event-driven messaging)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.calculation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID REFERENCES public.calculations(id) ON DELETE CASCADE,
    user_id UUID,
    type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed BOOLEAN DEFAULT false
);

-- ============================================================
-- 8. AUDIT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_log_calculation_change()
RETURNS TRIGGER AS $$
DECLARE
    event_type TEXT;
BEGIN
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            IF (NEW.status = 'sent') THEN
                event_type := 'calculation.submitted';
            ELSE
                event_type := 'calculation.created';
            END IF;
        ELSIF (TG_OP = 'UPDATE') THEN
            IF (OLD.status IS DISTINCT FROM NEW.status) THEN
                event_type := 'calculation.' || NEW.status;
            ELSIF (OLD.manager_id IS NULL AND NEW.manager_id IS NOT NULL) THEN
                event_type := 'calculation.assigned';
            ELSE
                RETURN NEW;
            END IF;
        ELSE
            RETURN NEW;
        END IF;

        INSERT INTO public.calculation_audit_log (calculation_id, user_id, type, payload, processed)
        VALUES (
            NEW.id,
            COALESCE(auth.uid(), NEW.user_id),
            event_type,
            jsonb_build_object(
                'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
                'new_status', NEW.status,
                'manager_id', NEW.manager_id,
                'organization_name', NEW.organization_name
            ),
            false
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Audit log failed: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_calculation_audit_log ON public.calculations;
CREATE TRIGGER trg_calculation_audit_log
    AFTER INSERT OR UPDATE ON public.calculations
    FOR EACH ROW EXECUTE FUNCTION public.fn_log_calculation_change();
