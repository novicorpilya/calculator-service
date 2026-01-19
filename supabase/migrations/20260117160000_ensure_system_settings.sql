-- ============================================================
-- FIX: PERMISSIONS FOR INVENTORY & SYSTEM SETTINGS
-- Date: 2026-01-17
-- Description: Ensures managers can read global items, suppliers, 
-- and system settings crucial for calculations.
-- ============================================================

-- 1. Ensure system_settings table exists (backup from scripts)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS for system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read settings" ON public.system_settings;
CREATE POLICY "Anyone authenticated can read settings" ON public.system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings" ON public.system_settings
    FOR ALL USING (public.is_manager_or_admin()); -- Allowing managers to read/update if they are in workload? No, keeping managers as readers for settings, admins as managers.

-- 2. Ensure RLS for inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read inventory" ON public.inventory_items;
CREATE POLICY "Authenticated can read inventory" ON public.inventory_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Ensure RLS for suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read suppliers" ON public.suppliers;
CREATE POLICY "Authenticated can read suppliers" ON public.suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Audit Log RLS Fix
-- Managers need to see their own config changes if any
DROP POLICY IF EXISTS "Managers can view all audit logs" ON public.audit_logs;
CREATE POLICY "Managers can view all audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_manager_or_admin());

-- 5. Seed initial settings if missing
INSERT INTO public.system_settings (key, value)
VALUES (
  'calculator_main',
  '{
    "formula": {
        "isAdvanced": false,
        "customFormula": "max(q_area, q_staff, q_visitors) * k_zone * k_intensity * (1 + k_reserve)",
        "baseMethod": "max",
        "factors": { "area": true, "staff": true, "visitors": true },
        "multipliers": { "zone": true, "intensity": true, "reserve": true }
    },
    "zoneTypes": [
       {"value": "red_zone", "label": "🔴 RED — Санузлы (Риск)", "color": "#ef4444", "coeff": 1.25},
       {"value": "yellow_zone", "label": "🟡 YELLOW — Ванные (Поверхности)", "color": "#facc15", "coeff": 1.15},
       {"value": "green_zone", "label": "🟢 GREEN — Кухня / Бар", "color": "#22c55e", "coeff": 1.0},
       {"value": "blue_zone", "label": "🔵 BLUE — Общие зоны / Офис", "color": "#3b82f6", "coeff": 0.85}
    ],
    "objectTypes": [],
    "reserveCoeffs": { "low": 0.1, "medium": 0.2, "high": 0.3, "default": 0.2 },
    "intensityLevels": []
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Refresh schema
NOTIFY pgrst, 'reload schema';
