/*
  # Add Password Reset Function

  1. Changes
    - Creates function to reset user passwords
    - Only superadmins can execute this function
    - Uses bcrypt encryption for password security

  2. Security
    - Function runs with SECURITY DEFINER privileges
    - Validates caller role before allowing password reset
    - Grants execute permission to authenticated users (checked internally)
*/

CREATE OR REPLACE FUNCTION reset_user_password(user_id uuid, new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION reset_user_password(uuid, text) TO authenticated;