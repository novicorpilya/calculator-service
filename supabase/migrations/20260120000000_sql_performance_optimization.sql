-- ============================================================
-- SQL PERFORMANCE ADVISOR: RLS OPTIMIZATION & HARDENING
-- Version: 2.2.0 | Date: 2026-01-19
-- ============================================================

-- This migration addresses "auth_rls_initplan" and "multiple_permissive_policies"
-- warnings by optimizing how auth functions are called and consolidating redundant policies.

-- 1. OPTIMIZE HELPER FUNCTIONS
-- Wrapping auth.uid() in SELECT for subquery caching in RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (SELECT auth.uid()) AND role IN ('manager', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. PUBLIC.PROFILES (auth_rls_initplan)
DROP POLICY IF EXISTS "profiles_select_strict" ON public.profiles;
CREATE POLICY "profiles_select_strict" ON public.profiles FOR SELECT TO authenticated
    USING (
        id = (SELECT auth.uid())
        OR (SELECT public.is_admin())
        OR (
            (SELECT public.is_manager_or_admin())
            AND EXISTS (
                SELECT 1 FROM public.calculations 
                WHERE (user_id = profiles.id AND manager_id = (SELECT auth.uid())) 
                OR (profiles.role = 'manager')
            )
        )
    );


-- 3. PUBLIC.NOTIFICATIONS (Consolidation & InitPlan)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;

CREATE POLICY "notifications_select_policy" ON public.notifications FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

CREATE POLICY "notifications_update_policy" ON public.notifications FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_delete_policy" ON public.notifications FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_insert_policy" ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));


-- 4. PUBLIC.DOCUMENTS (InitPlan)
DROP POLICY IF EXISTS "Users can view documents of their projects" ON public.documents;
DROP POLICY IF EXISTS "documents_select_policy" ON public.documents;
CREATE POLICY "documents_select_policy" ON public.documents FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.calculations 
            WHERE id = documents.calculation_id 
            AND (user_id = (SELECT auth.uid()) OR manager_id = (SELECT auth.uid()) OR (SELECT public.is_manager_or_admin()))
        )
    );


-- 5. PUBLIC.CALCULATION_VERSIONS (InitPlan)
DROP POLICY IF EXISTS "Users can view versions of their projects" ON public.calculation_versions;
DROP POLICY IF EXISTS "calculation_versions_select_policy" ON public.calculation_versions;
CREATE POLICY "calculation_versions_select_policy" ON public.calculation_versions FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.calculations 
            WHERE id = calculation_versions.calculation_id 
            AND (user_id = (SELECT auth.uid()) OR manager_id = (SELECT auth.uid()) OR (SELECT public.is_manager_or_admin()))
        )
    );


-- 6. PUBLIC.SYSTEM_SETTINGS (Consolidation & InitPlan)
DROP POLICY IF EXISTS "Anyone authenticated can read settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.system_settings;

DROP POLICY IF EXISTS "system_settings_select_policy" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_modify_policy" ON public.system_settings;

CREATE POLICY "system_settings_select_policy" ON public.system_settings FOR SELECT TO authenticated
    USING (TRUE); -- Any authenticated user can read settings

CREATE POLICY "system_settings_modify_policy" ON public.system_settings FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));


-- 7. PUBLIC.INVENTORY_ITEMS (Consolidation & InitPlan)
DROP POLICY IF EXISTS "Authenticated can read inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_select_policy" ON public.inventory_items;

DROP POLICY IF EXISTS "inventory_items_select_policy" ON public.inventory_items;
CREATE POLICY "inventory_items_select_policy" ON public.inventory_items FOR SELECT TO authenticated
    USING (TRUE);


-- 8. PUBLIC.SUPPLIERS (Consolidation & InitPlan)
DROP POLICY IF EXISTS "Authenticated can read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_select_policy" ON public.suppliers;

CREATE POLICY "suppliers_select_policy" ON public.suppliers FOR SELECT TO authenticated
    USING (TRUE);


-- 9. PUBLIC.AUDIT_LOGS (Consolidation & InitPlan)
DROP POLICY IF EXISTS "Managers can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Managers can view related audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can populate audit logs" ON public.audit_logs;

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;

CREATE POLICY "audit_logs_select_policy" ON public.audit_logs FOR SELECT TO authenticated
    USING ((SELECT public.is_manager_or_admin()));

CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs FOR INSERT TO authenticated
    WITH CHECK (TRUE); -- Allow all authenticated to log actions, or restrict if needed


-- 10. PUBLIC.CALCULATION_REVIEWS (InitPlan)
DROP POLICY IF EXISTS "Users can create reviews for their own projects" ON public.calculation_reviews;
DROP POLICY IF EXISTS "Anyone in the project can read reviews" ON public.calculation_reviews;

DROP POLICY IF EXISTS "calculation_reviews_select_policy" ON public.calculation_reviews;
DROP POLICY IF EXISTS "calculation_reviews_insert_policy" ON public.calculation_reviews;

CREATE POLICY "calculation_reviews_select_policy" ON public.calculation_reviews FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.calculations
            WHERE id = calculation_id 
            AND (user_id = (SELECT auth.uid()) OR manager_id = (SELECT auth.uid()) OR (SELECT public.is_manager_or_admin()))
        )
    );

CREATE POLICY "calculation_reviews_insert_policy" ON public.calculation_reviews FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.calculations
            WHERE id = calculation_id AND user_id = (SELECT auth.uid())
        )
    );



-- 13. PUBLIC.SYSTEM_LOGS (Consolidation & InitPlan)
DROP POLICY IF EXISTS "system_logs_admin_policy" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_authenticated_insert" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_insert_policy" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_select_policy" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_update_policy" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_delete_policy" ON public.system_logs;

CREATE POLICY "system_logs_admin_policy" ON public.system_logs FOR ALL TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "system_logs_insert_policy" ON public.system_logs FOR INSERT TO authenticated
    WITH CHECK (TRUE);


-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
