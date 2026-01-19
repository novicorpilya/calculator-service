-- ============================================================
-- AI ENTERPRISE FEATURES: A/B Testing, Feedback, Conversion
-- ============================================================

-- 1. Add variant column to existing events table for A/B testing
ALTER TABLE public.ai_insight_events 
ADD COLUMN IF NOT EXISTS variant TEXT DEFAULT 'A' CHECK (variant IN ('A', 'B'));

-- 2. Add conversion tracking columns
ALTER TABLE public.ai_insight_events 
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS conversion_entity_id UUID,
ADD COLUMN IF NOT EXISTS conversion_value NUMERIC;

-- 3. Feedback table
CREATE TABLE IF NOT EXISTS public.ai_insight_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    insight_id TEXT NOT NULL,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    variant TEXT DEFAULT 'A',
    UNIQUE(manager_id, insight_id) -- One vote per insight per manager
);

-- RLS for feedback
ALTER TABLE public.ai_insight_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers insert own feedback" ON public.ai_insight_feedback
    FOR INSERT WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers view own feedback" ON public.ai_insight_feedback
    FOR SELECT USING (auth.uid() = manager_id);

CREATE POLICY "Admins view all feedback" ON public.ai_insight_feedback
    FOR SELECT USING (public.is_manager_or_admin());

-- 4. Aggregated metrics view for Admin Dashboard
CREATE OR REPLACE VIEW public.ai_metrics_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    variant,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT manager_id) as unique_managers,
    COUNT(DISTINCT insight_id) as unique_insights,
    SUM(CASE WHEN converted_at IS NOT NULL THEN 1 ELSE 0 END) as conversions,
    SUM(COALESCE(conversion_value, 0)) as conversion_revenue
FROM public.ai_insight_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), variant, event_type
ORDER BY date DESC, variant, event_type;

-- 5. Feedback summary view
CREATE OR REPLACE VIEW public.ai_feedback_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    variant,
    COUNT(*) as total_feedback,
    SUM(CASE WHEN is_helpful THEN 1 ELSE 0 END) as helpful_count,
    SUM(CASE WHEN NOT is_helpful THEN 1 ELSE 0 END) as not_helpful_count,
    ROUND(100.0 * SUM(CASE WHEN is_helpful THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) as helpful_rate
FROM public.ai_insight_feedback
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), variant
ORDER BY date DESC;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_events_variant ON public.ai_insight_events(variant);
CREATE INDEX IF NOT EXISTS idx_ai_events_conversion ON public.ai_insight_events(converted_at) WHERE converted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_feedback_helpful ON public.ai_insight_feedback(is_helpful);
