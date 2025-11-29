/*
  # Fix Staff RLS Circular Dependency

  ## Problem
  The "Staff can view all staff" policy has a circular dependency:
  - It checks if user exists in staff table to allow viewing staff table
  - But you can't check if you're in staff table without viewing it first
  
  ## Solution
  Add a separate policy that allows users to view their own staff record
  based on user_id match, without requiring a subquery to staff table.
  
  ## Changes
  1. Add new policy "Staff can view own record" with direct user_id check
  2. Keep existing "Staff can view all staff" for viewing other records
*/

-- Add policy to allow staff to view their own record (breaks circular dependency)
CREATE POLICY "Staff can view own record"
  ON staff FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- The existing "Staff can view all staff" policy remains for viewing other staff records
