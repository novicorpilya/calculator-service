-- FIX: Consolidate multiple permissive policies on audit_logs
-- The warning "Multiple Permissive Policies" means there are multiple policies 
-- allowing 'SELECT' for the same role, which is inefficient.

-- 1. Drop existing policies to clean up
drop policy if exists "audit_logs_select_own" on public.audit_logs;
drop policy if exists "audit_logs_select_policy" on public.audit_logs;

-- 2. Create a single, optimized policy
-- This policy allows users to see their own logs, OR managers/admins to see all logs.
create policy "audit_logs_select_unified"
on public.audit_logs
for select
to authenticated
using (
  auth.uid() = user_id 
  or 
  (select role from public.profiles where id = auth.uid()) in ('manager', 'admin')
);
