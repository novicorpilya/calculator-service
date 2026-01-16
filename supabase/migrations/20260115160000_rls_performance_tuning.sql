-- ============================================================
-- RLS PERFORMANCE OPTIMIZATION & CONSOLIDATION
-- Date: 2026-01-15
-- Optimization: Using (SELECT auth.uid()) for caching and 
-- consolidating multiple permissive policies.
-- ============================================================

-- 0. Update helper functions to be more efficient
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (SELECT auth.uid()) AND role IN ('manager', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Optimized Policies for public.profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view manager profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers read all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO public
    USING (
        (SELECT auth.uid()) = id 
        OR role IN ('manager', 'admin')
        OR (SELECT public.is_manager_or_admin())
    );

CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO public
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO public
    USING (
        (SELECT auth.uid()) = id 
        OR (SELECT public.is_admin())
    );

-- 2. Optimized Policies for public.calculations
DROP POLICY IF EXISTS "Admins can delete calculations" ON public.calculations;
DROP POLICY IF EXISTS "Admins can update all calculations" ON public.calculations;
DROP POLICY IF EXISTS "Admins can view all calculations" ON public.calculations;
DROP POLICY IF EXISTS "Managers can update assigned calculations" ON public.calculations;
DROP POLICY IF EXISTS "Managers can view assigned calculations" ON public.calculations;
DROP POLICY IF EXISTS "Managers can view unassigned calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can delete own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can insert own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can update own calculations" ON public.calculations;
DROP POLICY IF EXISTS "Users can view own calculations" ON public.calculations;

CREATE POLICY "calculations_select_policy" ON public.calculations FOR SELECT TO public
    USING (
        (SELECT auth.uid()) = user_id 
        OR (SELECT auth.uid()) = manager_id 
        OR (manager_id IS NULL AND status != 'draft' AND (SELECT public.is_manager_or_admin()))
        OR (SELECT public.is_admin())
    );

CREATE POLICY "calculations_insert_policy" ON public.calculations FOR INSERT TO public
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "calculations_update_policy" ON public.calculations FOR UPDATE TO public
    USING (
        (SELECT auth.uid()) = user_id 
        OR (SELECT auth.uid()) = manager_id 
        OR (SELECT public.is_admin())
    );

CREATE POLICY "calculations_delete_policy" ON public.calculations FOR DELETE TO public
    USING (
        (SELECT auth.uid()) = user_id 
        OR (SELECT public.is_admin())
    );

-- 3. Optimized Policies for public.messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Allow users to update messages status" ON public.messages;
DROP POLICY IF EXISTS "Direct chat access" ON public.messages;
DROP POLICY IF EXISTS "Project chat access" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;

CREATE POLICY "messages_select_policy" ON public.messages FOR SELECT TO public
    USING (
        (SELECT auth.uid()) = sender_id 
        OR (SELECT auth.uid()) = receiver_id
        OR (
            calculation_id IS NOT NULL 
            AND (
                EXISTS (
                    SELECT 1 FROM public.calculations 
                    WHERE id = calculation_id 
                    AND (user_id = (SELECT auth.uid()) OR manager_id = (SELECT auth.uid()))
                )
                OR (SELECT public.is_manager_or_admin())
            )
        )
        OR (SELECT public.is_admin())
    );

CREATE POLICY "messages_insert_policy" ON public.messages FOR INSERT TO public
    WITH CHECK (
        (SELECT auth.uid()) = sender_id
        OR (
            calculation_id IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM public.calculations 
                WHERE id = calculation_id 
                AND (user_id = (SELECT auth.uid()) OR manager_id = (SELECT auth.uid()))
            )
        )
    );

CREATE POLICY "messages_update_policy" ON public.messages FOR UPDATE TO public
    USING (
        (SELECT auth.uid()) = sender_id 
        OR (SELECT auth.uid()) = receiver_id
        OR (SELECT public.is_admin())
    );

-- 4. Optimized Policies for public.venues
DROP POLICY IF EXISTS "Users can delete own venues" ON public.venues;
DROP POLICY IF EXISTS "Users can insert own venues" ON public.venues;
DROP POLICY IF EXISTS "Users can update own venues" ON public.venues;
DROP POLICY IF EXISTS "Users can view own venues" ON public.venues;

CREATE POLICY "venues_all_policy" ON public.venues FOR ALL TO public
    USING (
        (SELECT auth.uid()) = owner_id 
        OR (SELECT public.is_admin())
    )
    WITH CHECK ((SELECT auth.uid()) = owner_id);

-- 5. Optimized Policies for public.suppliers & inventory_items
DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Anyone can view active suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Anyone can view inventory items" ON public.inventory_items;

CREATE POLICY "suppliers_select_policy" ON public.suppliers FOR SELECT TO public
    USING (status = 'active' OR (SELECT public.is_admin()));

CREATE POLICY "suppliers_manage_policy" ON public.suppliers FOR ALL TO public
    USING ((SELECT public.is_admin()));

CREATE POLICY "inventory_select_policy" ON public.inventory_items FOR SELECT TO public
    USING (true);

CREATE POLICY "inventory_manage_policy" ON public.inventory_items FOR ALL TO public
    USING ((SELECT public.is_admin()));

-- 6. Optimized Policies for small utility tables
DROP POLICY IF EXISTS "Templates are viewable by authenticated" ON public.sys_message_templates;
CREATE POLICY "Templates are viewable by authenticated" ON public.sys_message_templates
    FOR SELECT TO public USING ((SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Admins can view logs" ON public.system_logs;
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.system_logs;
CREATE POLICY "system_logs_manage_policy" ON public.system_logs FOR ALL TO public
    USING ((SELECT public.is_admin()))
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can manage own markers" ON public.chat_read_markers;
CREATE POLICY "chat_read_markers_policy" ON public.chat_read_markers FOR ALL TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
