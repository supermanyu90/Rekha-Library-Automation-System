/*
  # Add Email Confirmation Function

  1. Changes
    - Creates function to confirm user emails
    - Head librarians and above can execute this function
    - Bypasses email confirmation requirement for new members

  2. Security
    - Function runs with SECURITY DEFINER privileges
    - Validates caller role before allowing email confirmation
    - Grants execute permission to authenticated users (checked internally)
*/

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