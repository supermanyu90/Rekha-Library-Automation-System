-- Add function to confirm user email
-- Allows admins to bypass email confirmation for new members
-- Function runs with security definer privileges

CREATE OR REPLACE FUNCTION confirm_user_email(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION confirm_user_email(uuid) TO authenticated;