-- PERFORMANCE INDICES: DATABASE SCALING
-- Added missing indices for critical paths in Analytics and Manager Dashboard

-- 1. Calculations table
CREATE INDEX IF NOT EXISTS idx_calculations_manager_id ON public.calculations(manager_id);
CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON public.calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_status ON public.calculations(status);
CREATE INDEX IF NOT EXISTS idx_calculations_created_at ON public.calculations(created_at DESC);

-- 2. Profiles table (frequent joins and role checks)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Composite index for Manager Dashboard KPI queries
-- Used in getKPIData: .eq('manager_id', managerId).neq('status', 'draft')
CREATE INDEX IF NOT EXISTS idx_calculations_manager_status ON public.calculations(manager_id, status);

-- 4. Audit logs (frequent queries by entity_id)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
