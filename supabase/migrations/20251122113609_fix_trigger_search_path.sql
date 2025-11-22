/*
  # Fix trigger search_path to include auth schema

  1. Changes
    - Update handle_new_user function to include both 'auth' and 'public' in search_path
    - This allows the trigger to properly access both auth.users and public.profiles

  2. Security
    - Maintains SECURITY DEFINER for proper permissions
    - Explicit search_path prevents security issues
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;