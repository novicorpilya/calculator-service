-- Query to list all active triggers in the database
-- Run this in the Supabase Dashboard -> SQL Editor

SELECT 
    event_object_schema as schema_name,
    event_object_table as table_name,
    trigger_name,
    action_orientation as trigger_type,
    action_timing as timing,
    event_manipulation as event,
    action_statement as function_call
FROM information_schema.triggers
WHERE event_object_schema IN ('public', 'auth') -- We check 'auth' because profile creation usually happens on auth.users
ORDER BY event_object_schema, event_object_table, trigger_name;

-- Specific query to check for the profile creation trigger on auth.users
-- This is likely where the issue lies (e.g., duplicates or missing triggers)
SELECT 
    tgname as trigger_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
AND c.relname = 'users';
