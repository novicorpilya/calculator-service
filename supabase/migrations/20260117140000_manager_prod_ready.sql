-- ============================================================
-- MANAGER PRODUCTION READY FEATURES
-- Version: 1.3.0 | Date: 2026-01-17
-- ============================================================

-- 1. CALCULATION VERSIONS (Snapshots)
CREATE TABLE IF NOT EXISTS public.calculation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID REFERENCES public.calculations(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    
    UNIQUE(calculation_id, version_number)
);

ALTER TABLE public.calculation_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their projects" ON public.calculation_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.calculations 
            WHERE id = calculation_versions.calculation_id 
            AND (user_id = auth.uid() OR manager_id = auth.uid() OR public.is_manager_or_admin())
        )
    );

-- 2. DOCUMENTS (KP, Invoices, Acts)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID REFERENCES public.calculations(id) ON DELETE CASCADE,
    version_id UUID REFERENCES public.calculation_versions(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('kp', 'invoice', 'act', 'other')),
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents of their projects" ON public.documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.calculations 
            WHERE id = documents.calculation_id 
            AND (user_id = auth.uid() OR manager_id = auth.uid() OR public.is_manager_or_admin())
        )
    );

-- 3. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. UPDATE AUDIT LOGS RLS
-- Managers should be able to see audit logs for projects they are assigned to, or all if they are admins
DROP POLICY IF EXISTS "Managers can view related audit logs" ON public.audit_logs;
CREATE POLICY "Managers can view related audit logs" ON public.audit_logs
    FOR SELECT USING (
        public.is_manager_or_admin()
    );

-- 5. SLA TRACKING (Helper columns/functions)
-- Adding SLA related columns to calculations
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calculations' AND column_name = 'last_status_change_at') THEN
        ALTER TABLE public.calculations ADD COLUMN last_status_change_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calculations' AND column_name = 'sla_deadline') THEN
        ALTER TABLE public.calculations ADD COLUMN sla_deadline TIMESTAMPTZ;
    END IF;
END $$;

-- Trigger to update last_status_change_at
CREATE OR REPLACE FUNCTION public.fn_update_calculation_sla()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        NEW.last_status_change_at := NOW();
        
        -- Default SLA: 24 hours for most status changes
        NEW.sla_deadline := NOW() + INTERVAL '24 hours';
        
        -- Specific SLA for 'sent' (new lead): 4 hours
        IF (NEW.status = 'sent') THEN
            NEW.sla_deadline := NOW() + INTERVAL '4 hours';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculation_sla ON public.calculations;
CREATE TRIGGER trg_calculation_sla
    BEFORE UPDATE ON public.calculations
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_calculation_sla();
