-- Create a function to delete a user from profiles and auth.users
-- This must be run by a service_role key or via a Postgres function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION delete_user_v1(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
    -- Profile deletion is usually handled by ON DELETE CASCADE if set up, 
    -- but we'll be explicit about the auth user.
    -- Delete from public.profiles (if not cascade)
    DELETE FROM public.profiles WHERE id = user_id_param;
    
    -- Delete from auth.users (This requires elevated privileges)
    DELETE FROM auth.users WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
