-- ============================================================
-- Migration: Projects Reviews & NPS System
-- Date: 2026-01-18
-- ============================================================

CREATE TABLE IF NOT EXISTS public.calculation_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_id UUID NOT NULL REFERENCES public.calculations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(calculation_id) -- One review per project
);

-- RLS Policies
ALTER TABLE public.calculation_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reviews for their own projects"
    ON public.calculation_reviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.calculations
            WHERE id = calculation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone in the project can read reviews"
    ON public.calculation_reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.calculations
            WHERE id = calculation_id 
            AND (user_id = auth.uid() OR manager_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('manager', 'admin')
        )
    );

-- Indexing for analytics
CREATE INDEX idx_reviews_calculation ON public.calculation_reviews(calculation_id);
CREATE INDEX idx_reviews_rating ON public.calculation_reviews(rating);

-- Extend sys_message_templates to include more dynamic data if needed
-- (Optional: We could add a 'version' or 'data_schema' to templates)
