/*
  # Fix handle_new_user trigger to prevent duplicate key errors

  1. Changes
    - Updates the trigger function to use INSERT ... ON CONFLICT DO NOTHING
    - Prevents errors when a profile already exists for a user
    - Ensures the trigger doesn't fail during login attempts

  2. Security
    - Maintains SECURITY DEFINER privileges
    - No changes to security posture
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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;