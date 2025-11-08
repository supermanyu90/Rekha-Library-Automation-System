/*
  # Add trigger to auto-create user profiles
  
  1. New Functions
    - `handle_new_user` - Automatically creates a profile when a new user signs up
  
  2. New Triggers
    - Trigger on auth.users INSERT to create corresponding profile
  
  3. Security
    - Function runs with security definer privileges
    - Automatically extracts full_name from user metadata
    - Sets default role to 'member'
*/

-- Create function to handle new user signup
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

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
