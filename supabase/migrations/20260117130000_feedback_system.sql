-- Create table for tracking feedback submissions (Rate Limiting & Audit)
create table if not exists public.feedback_logs (
    id uuid default gen_random_uuid() primary key,
    ip_address text,
    email text,
    created_at timestamptz default now(),
    user_agent text
);

-- Secure the table (Admin/Service Role only)
alter table public.feedback_logs enable row level security;

-- Only service role can insert/read (Serverless function uses service role)
-- No public access allowed
create policy "Service role full access"
    on public.feedback_logs
    for all
    to service_role
    using (true)
    with check (true);

-- Index for fast rate limiting lookups
create index idx_feedback_logs_ip_created 
    on public.feedback_logs(ip_address, created_at);
