/*
  # Remove Circular Staff View Policy

  ## Problem
  The "Staff can view all staff" policy causes a 500 error because it has
  a circular dependency - it queries the staff table within the policy
  that controls access to the staff table.

  ## Solution
  1. Drop the circular "Staff can view all staff" policy
  2. Keep "Staff can view own record" for users to see their own data
  3. Add a new simpler policy for staff to view all other staff records
     that uses a function to check staff status without causing recursion

  ## Changes
  - Remove: "Staff can view all staff" (circular dependency)
  - Keep: "Staff can view own record" (simple, direct)
  - Add: "Staff can view all staff records" (using helper function)
*/

-- Drop the problematic circular policy
DROP POLICY IF EXISTS "Staff can view all staff" ON staff;

-- Create a helper function that checks if current user is staff
-- This function uses SECURITY DEFINER to bypass RLS when checking
CREATE OR REPLACE FUNCTION is_staff_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff
    WHERE user_id = auth.uid()
  );
$$;

-- Now create a policy that uses the helper function
CREATE POLICY "Staff can view all staff records"
  ON staff FOR SELECT
  TO authenticated
  USING (is_staff_user());
