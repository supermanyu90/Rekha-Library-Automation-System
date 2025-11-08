/*
  # Add function to reset user passwords
  
  1. New Functions
    - `reset_user_password` - Allows superadmins to reset user passwords
  
  2. Security
    - Function is security definer (runs with creator privileges)
    - Only accessible by authenticated users with superadmin role
    - Updates auth.users table with new encrypted password
*/

-- Create function to reset user password
CREATE OR REPLACE FUNCTION reset_user_password(user_id uuid, new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role user_role;
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_user_password(uuid, text) TO authenticated;
