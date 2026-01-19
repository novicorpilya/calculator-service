-- AI Insight Events: Tracking for measurable AI coaching
CREATE TABLE IF NOT EXISTS public.ai_insight_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    insight_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('shown', 'clicked', 'dismissed', 'converted')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.ai_insight_events ENABLE ROW LEVEL SECURITY;

-- Managers can insert their own events
CREATE POLICY "Managers can insert own events" ON public.ai_insight_events
    FOR INSERT WITH CHECK (auth.uid() = manager_id);

-- Managers can view own events
CREATE POLICY "Managers can view own events" ON public.ai_insight_events
    FOR SELECT USING (auth.uid() = manager_id);

-- Admins can view all
CREATE POLICY "Admins can view all events" ON public.ai_insight_events
    FOR SELECT USING (public.is_manager_or_admin());

-- Index for analytics queries
CREATE INDEX idx_ai_events_manager_created ON public.ai_insight_events(manager_id, created_at);
CREATE INDEX idx_ai_events_type ON public.ai_insight_events(event_type);
