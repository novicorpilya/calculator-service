-- FUNCTION: Handle new user creation manually
-- This function will be triggered after a new row is inserted into auth.users

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    role,
    first_name,
    organization_name
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'organization_name'
  );
  return new;
end;
$$;

-- TRIGGER: Attach the function to auth.users
-- This ensures that every time a user signs up via Supabase Auth, a profile is created.

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
