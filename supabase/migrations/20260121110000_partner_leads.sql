-- ============================================================
-- Migration: Partner Leads tracking
-- Description: Tracks calculations made through external widgets.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.partner_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.partners(id),
    facility_type TEXT,
    area NUMERIC,
    estimated_total NUMERIC,
    client_email TEXT,
    client_phone TEXT,
    full_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
GRANT ALL ON public.partner_leads TO service_role;
