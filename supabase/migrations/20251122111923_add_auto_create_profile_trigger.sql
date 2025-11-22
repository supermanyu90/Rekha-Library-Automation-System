/*
  # Add Auto-Create Profile Trigger

  1. Changes
    - Creates a trigger function to automatically create user profiles
    - Runs when new users sign up via Supabase Auth
    - Extracts full_name from user metadata or defaults to email
    - Assigns default 'member' role

  2. Security
    - Function runs with SECURITY DEFINER privileges
    - Ensures profile creation happens even if RLS is enabled
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'member'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();