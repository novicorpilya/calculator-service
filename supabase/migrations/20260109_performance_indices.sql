-- ============================================================
-- PHASE 3: DATABASE PERFORMANCE & STORAGE SECURITY (FIXED)
-- Implements Storage RLS and missing indexes.
-- ============================================================

-- 1. STORAGE POLICIES
-- NOTE: Ensure 'receipts' bucket exists
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('receipts', 'receipts', false)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing if any to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Managers can read all receipts" ON storage.objects;

CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'receipts' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'receipts' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Managers can read all receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'receipts' 
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('manager', 'admin')
);


-- 2. PERFORMANCE INDEXES
-- Index for finding unassigned projects
CREATE INDEX IF NOT EXISTS idx_calculations_unassigned 
ON public.calculations (status, created_at DESC) 
WHERE manager_id IS NULL;

-- Index for manager's active workload
CREATE INDEX IF NOT EXISTS idx_calculations_manager_active 
ON public.calculations (manager_id, status) 
WHERE manager_id IS NOT NULL AND status NOT IN ('completed', 'closed');

-- Index for client's dashboard
CREATE INDEX IF NOT EXISTS idx_calculations_user_recent 
ON public.calculations (user_id, updated_at DESC);

-- Index for project numbering (REQUIRES project_number column from fix migration)
CREATE INDEX IF NOT EXISTS idx_calculations_project_number 
ON public.calculations (project_number);
