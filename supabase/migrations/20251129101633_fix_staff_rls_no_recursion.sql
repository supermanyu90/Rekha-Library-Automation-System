/*
  # Fix Staff RLS - Simple Direct Policies Only

  ## Problem
  Any policy that includes a subquery to the staff table causes infinite recursion.

  ## Solution
  Create the simplest possible policies:
  1. For SELECT: Users can only view their own record (direct user_id match)
  2. For INSERT/UPDATE/DELETE: Use service role or edge functions instead
  
  This means the frontend can only query for the current user's staff record,
  which is all we need for authentication. Admin operations on staff table
  will need to use service role.

  ## Changes
  - Drop ALL existing policies
  - Create only one simple SELECT policy with direct user_id check
  - No other policies (use service role for admin operations)
*/

-- Drop all existing policies on staff table
DROP POLICY IF EXISTS "Staff members can view own record" ON staff;
DROP POLICY IF EXISTS "Staff members can view all staff" ON staff;
DROP POLICY IF EXISTS "Admins can insert staff" ON staff;
DROP POLICY IF EXISTS "Admins can update staff" ON staff;
DROP POLICY IF EXISTS "Admins can delete staff" ON staff;

-- Single simple policy: users can ONLY view their own staff record
CREATE POLICY "View own staff record only"
  ON staff FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- For INSERT/UPDATE/DELETE operations on staff table,
-- use service role key or edge functions with elevated privileges
