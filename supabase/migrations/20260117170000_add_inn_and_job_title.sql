-- Migration: Add INN and Job Title to Profiles
-- Date: 2026-01-17

-- 1. Add columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS inn TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- 2. Update handle_new_user trigger to include more metadata from signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        first_name, 
        last_name, 
        organization_name, 
        inn, 
        job_title, 
        phone, 
        address,
        role
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'organization_name',
        NEW.raw_user_meta_data->>'inn',
        NEW.raw_user_meta_data->>'job_title',
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'address',
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        organization_name = COALESCE(EXCLUDED.organization_name, profiles.organization_name),
        inn = COALESCE(EXCLUDED.inn, profiles.inn),
        job_title = COALESCE(EXCLUDED.job_title, profiles.job_title),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        address = COALESCE(EXCLUDED.address, profiles.address);
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
