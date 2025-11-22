/*
  # Fix search_path for functions accessing multiple schemas

  1. Changes
    - Update confirm_user_email function to include auth schema in search_path
    - Update reset_user_password function to include auth schema in search_path
    - Both functions need access to both auth.users and public.profiles

  2. Security
    - Maintains SECURITY DEFINER for proper permissions
    - Explicit search_path prevents security issues
*/

-- Fix confirm_user_email function
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Check if caller is at least head_librarian
  SELECT role INTO caller_role
  FROM profiles
  WHERE id = auth.uid();

  IF caller_role NOT IN ('head_librarian', 'admin', 'superadmin') THEN
    RAISE EXCEPTION 'Only head librarians and above can confirm user emails';
  END IF;

  -- Confirm the user's email
  UPDATE auth.users
  SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Fix reset_user_password function
CREATE OR REPLACE FUNCTION public.reset_user_password(user_id uuid, new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  caller_role text;
  encrypted_pw text;
BEGIN
  -- Check if caller is superadmin
  SELECT role INTO caller_role
  FROM profiles
  WHERE id = auth.uid();

  IF caller_role != 'superadmin' THEN
    RETURN json_build_object('success', false, 'message', 'Only superadmins can reset passwords');
  END IF;

  -- Encrypt the password using crypt
  encrypted_pw := crypt(new_password, gen_salt('bf'));

  -- Update the user's password
  UPDATE auth.users
  SET 
    encrypted_password = encrypted_pw,
    updated_at = NOW()
  WHERE id = user_id;

  RETURN json_build_object('success', true, 'message', 'Password reset successfully');
END;
$$;
