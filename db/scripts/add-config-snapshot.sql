-- Add calculator_config_snapshot to calculations table
-- This allows point-in-time calculation logic preservation

ALTER TABLE public.calculations 
ADD COLUMN IF NOT EXISTS calculator_config_snapshot jsonb;

COMMENT ON COLUMN public.calculations.calculator_config_snapshot IS 'Snapshot of calculator settings (formulas, coefficients) used at the time of project creation/save';
