/*
  # Fix Function Search Path Security Issue

  ## Changes
  Fix the get_staff_role function to use a stable search_path
  This prevents potential security vulnerabilities from search_path manipulation

  ## Security Impact
  - Prevents search_path injection attacks
  - Ensures function always references correct schema objects
*/

-- Drop and recreate get_staff_role with fixed search_path
DROP FUNCTION IF EXISTS get_staff_role(uuid);

CREATE OR REPLACE FUNCTION get_staff_role(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  staff_role text;
BEGIN
  SELECT role INTO staff_role
  FROM public.staff
  WHERE user_id = user_uuid;
  
  RETURN staff_role;
END;
$$;
