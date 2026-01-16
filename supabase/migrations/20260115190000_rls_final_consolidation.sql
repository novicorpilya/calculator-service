-- ============================================================
-- RLS FINAL CONSOLIDATION & PERFORMANCE POLISH
-- Date: 2026-01-15
-- Goal: Eliminate "Multiple Permissive Policies" warnings by 
-- avoiding overlapping ALL and command-specific policies.
-- ============================================================

-- 1. Refine public.inventory_items
DROP POLICY IF EXISTS "inventory_manage_policy" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_select_policy" ON public.inventory_items;

-- Select is open to all (or as defined)
CREATE POLICY "inventory_select_policy" ON public.inventory_items 
    FOR SELECT TO public 
    USING (true);

-- Management is restricted to admins only, for non-SELECT actions
CREATE POLICY "inventory_insert_policy" ON public.inventory_items 
    FOR INSERT TO public 
    WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "inventory_update_policy" ON public.inventory_items 
    FOR UPDATE TO public 
    USING ((SELECT public.is_admin()));

CREATE POLICY "inventory_delete_policy" ON public.inventory_items 
    FOR DELETE TO public 
    USING ((SELECT public.is_admin()));


-- 2. Refine public.suppliers
DROP POLICY IF EXISTS "suppliers_manage_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_select_policy" ON public.suppliers;

-- Consolidated SELECT policy
CREATE POLICY "suppliers_select_policy" ON public.suppliers 
    FOR SELECT TO public 
    USING (status = 'active' OR (SELECT public.is_admin()));

-- Management for admins only
CREATE POLICY "suppliers_insert_policy" ON public.suppliers 
    FOR INSERT TO public 
    WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "suppliers_update_policy" ON public.suppliers 
    FOR UPDATE TO public 
    USING ((SELECT public.is_admin()));

CREATE POLICY "suppliers_delete_policy" ON public.suppliers 
    FOR DELETE TO public 
    USING ((SELECT public.is_admin()));


-- 3. Refine public.system_logs
DROP POLICY IF EXISTS "system_logs_admin_policy" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_authenticated_insert" ON public.system_logs;
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_manage_policy" ON public.system_logs;

-- Command-specific policies to avoid overlap
CREATE POLICY "system_logs_select_policy" ON public.system_logs 
    FOR SELECT TO public 
    USING ((SELECT public.is_admin()));

CREATE POLICY "system_logs_insert_policy" ON public.system_logs 
    FOR INSERT TO authenticated 
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "system_logs_update_policy" ON public.system_logs 
    FOR UPDATE TO public 
    USING ((SELECT public.is_admin()));

CREATE POLICY "system_logs_delete_policy" ON public.system_logs 
    FOR DELETE TO public 
    USING ((SELECT public.is_admin()));
