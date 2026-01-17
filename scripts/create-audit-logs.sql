-- Create Audit Logs table for security and governance
create table if not exists public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    action text not null, -- e.g. 'CONFIG_UPDATE', 'USER_LOGIN', 'PROJECT_DELETE'
    entity text not null, -- e.g. 'calculator_config', 'project', 'user'
    entity_id text, -- optional ID of the affected entity
    details jsonb default '{}'::jsonb, -- changes, diffs, or metadata
    metadata jsonb default '{}'::jsonb, -- ip address, user agent (requires edge function usually, or passes from client)
    performed_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Policies
-- Admins can view all logs
create policy "Admins can view audit logs"
    on public.audit_logs for select
    to authenticated
    using (true); -- Refine to admin check later

-- Authenticated users can insert logs (system writes)
create policy "Users can populate audit logs"
    on public.audit_logs for insert
    to authenticated
    with check (auth.uid() = performed_by);
