/*
  # Add INSERT policy for profiles and recreate trigger

  1. Changes
    - Add INSERT policy for profiles table to allow authenticated users to create their own profile
    - Recreate the handle_new_user function with proper error handling
    - Recreate the trigger on auth.users

  2. Security
    - Users can only insert their own profile (id must match auth.uid())
    - Function uses SECURITY DEFINER to bypass RLS during trigger execution
*/

-- Add INSERT policy for profiles
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Recreate the function with proper security
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();