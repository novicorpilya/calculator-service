-- ============================================================
-- CRITICAL: Enable Row Level Security for all tables
-- This migration MUST be applied before production deployment
-- ============================================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Managers/Admins can read all profiles (for user lists)
-- Uses jwt() to avoid recursion
CREATE POLICY "profiles_select_staff" ON profiles
    FOR SELECT USING (
        auth.uid() = id 
        OR 
        (auth.jwt() ->> 'role')::text IN ('manager', 'admin', 'service_role')
    );

-- ============================================
-- 2. CALCULATIONS TABLE
-- ============================================
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

-- Clients can see their own calculations
CREATE POLICY "calculations_select_client" ON calculations
    FOR SELECT USING (user_id = auth.uid());

-- Clients can insert their own calculations
CREATE POLICY "calculations_insert_client" ON calculations
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Clients can update their own calculations
-- (Transition logic is controlled by DB triggers, RLS only checks ownership)
CREATE POLICY "calculations_update_client" ON calculations
    FOR UPDATE USING (user_id = auth.uid());

-- Managers can see calculations assigned to them
CREATE POLICY "calculations_select_manager" ON calculations
    FOR SELECT USING (manager_id = auth.uid());

-- Managers can update assigned calculations
CREATE POLICY "calculations_update_manager" ON calculations
    FOR UPDATE USING (manager_id = auth.uid());

-- Managers can see unassigned calculations (for pool)
CREATE POLICY "calculations_select_unassigned" ON calculations
    FOR SELECT USING (
        manager_id IS NULL 
        AND status != 'draft'
        AND EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
        )
    );

-- Admins can do everything
CREATE POLICY "calculations_admin_all" ON calculations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 3. MESSAGES TABLE
-- ============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages where they are sender or receiver
CREATE POLICY "messages_select_participant" ON messages
    FOR SELECT USING (
        sender_id = auth.uid() OR receiver_id = auth.uid()
    );

-- Users can insert messages where they are sender
CREATE POLICY "messages_insert_sender" ON messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Users can update their own messages
CREATE POLICY "messages_update_sender" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "messages_delete_sender" ON messages
    FOR DELETE USING (sender_id = auth.uid());

-- ============================================
-- 4. VENUES TABLE
-- ============================================
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Users can see their own venues
CREATE POLICY "venues_select_own" ON venues
    FOR SELECT USING (owner_id = auth.uid());

-- Users can insert their own venues
CREATE POLICY "venues_insert_own" ON venues
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update their own venues
CREATE POLICY "venues_update_own" ON venues
    FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete their own venues
CREATE POLICY "venues_delete_own" ON venues
    FOR DELETE USING (owner_id = auth.uid());

-- ============================================
-- 5. INVITATIONS TABLE
-- ============================================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "invitations_admin_only" ON invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Anyone can read their own invitation (via email + token)
-- This is handled by service role in API

-- ============================================
-- 6. AUDIT_LOGS TABLE  
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "audit_logs_select_admin" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Anyone authenticated can insert (for logging)
CREATE POLICY "audit_logs_insert_authenticated" ON audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 7. SYSTEM_LOGS TABLE
-- ============================================
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read system logs
CREATE POLICY "system_logs_select_admin" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Anyone authenticated can insert (for error logging)
CREATE POLICY "system_logs_insert_authenticated" ON system_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 8. INVENTORY_ITEMS TABLE (Public catalog)
-- ============================================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read inventory
CREATE POLICY "inventory_items_select_all" ON inventory_items
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins/managers can modify inventory
CREATE POLICY "inventory_items_modify_staff" ON inventory_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() 
            AND role IN ('manager', 'admin')
        )
    );

-- ============================================
-- 9. SUPPLIERS TABLE (Public catalog)
-- ============================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read suppliers
CREATE POLICY "suppliers_select_all" ON suppliers
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can modify suppliers
CREATE POLICY "suppliers_modify_admin" ON suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 10. CALCULATION_AUDIT_LOG
-- ============================================
ALTER TABLE calculation_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow insert for all (required by triggers firing on user actions)
CREATE POLICY "calculation_audit_log_insert" ON calculation_audit_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users see logs for their participation, managers see all
CREATE POLICY "calculation_audit_log_select" ON calculation_audit_log
    FOR SELECT USING (
        actor_id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin')
        )
    );

-- ============================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================
-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- 
-- Check policies exist:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
