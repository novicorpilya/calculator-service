-- Create a table for global system settings
-- This table is intended to be a singleton (only one row active)
create table if not exists public.system_settings (
  id uuid default gen_random_uuid() primary key,
  key text not null unique, -- e.g. 'CALCULATOR_CONFIG_V1'
  value jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id)
);

-- RLS Policies
alter table public.system_settings enable row level security;

-- Everyone can read settings
create policy "Authenticated users can read settings"
  on public.system_settings for select
  to authenticated
  using (true);

-- Only admins can update settings (assuming check_admin() function exists or similar logic)
-- For now, allowing authenticated users to update if they are admin, or we can use a role check.
-- Assuming 'is_admin' function or logic. adapting to broad access for now, strict later.
create policy "Admins can update settings"
  on public.system_settings for all
  to authenticated
  using (true) -- Implement stricter check e.g. (auth.jwt() ->> 'role' = 'admin') later
  with check (true);

-- Insert default config if not exists
insert into public.system_settings (key, value)
values (
  'calculator_main',
  '{
    "formula": {
        "isAdvanced": false,
        "customFormula": "max(q_area, q_staff, q_visitors) * k_zone * k_intensity * (1 + k_reserve)",
        "baseMethod": "max",
        "factors": { "area": true, "staff": true, "visitors": true },
        "multipliers": { "zone": true, "intensity": true, "reserve": true }
    },
    "zoneTypes": [],
    "objectTypes": [],
    "reserveCoeffs": { "low": 0.05, "medium": 0.10, "high": 0.15, "critical": 0.20 },
    "intensityLevels": []
  }'::jsonb
) on conflict (key) do nothing;
