-- REMOVE AI INFRASTRUCTURE
-- This migration removes all tables, views, and indexes related to AI features

-- 1. Drop Views
DROP VIEW IF EXISTS public.ai_feedback_summary;
DROP VIEW IF EXISTS public.ai_metrics_summary;

-- 2. Drop Tables (order matters because of foreign keys)
DROP TABLE IF EXISTS public.ai_insight_feedback;
DROP TABLE IF EXISTS public.ai_insight_events;

-- 3. Cleanup logic - if there are any specific functions for AI, they should be dropped here
-- No specific PL/pgSQL functions for AI were found in recent migrations.
