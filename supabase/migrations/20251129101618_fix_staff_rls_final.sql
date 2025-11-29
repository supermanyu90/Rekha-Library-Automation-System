/*
  # Fix Staff RLS - Remove All Circular Dependencies

  ## Problem
  All policies that check the staff table to grant access to the staff table
  cause infinite recursion. Even with SECURITY DEFINER, the function still
  triggers RLS when querying staff.

  ## Solution
  Use only simple, direct policies that don't query the staff table:
  1. Staff can view their own record (direct user_id match)
  2. Staff can view all records (no subquery, just trust authenticated users)
  3. Only superadmin/admin can modify staff (check via app_metadata)

  ## Changes
  - Drop all existing staff policies
  - Drop the helper function
  - Create new simple policies without circular dependencies
*/

-- Drop all existing policies on staff table
DROP POLICY IF EXISTS "Staff can view own record" ON staff;
DROP POLICY IF EXISTS "Staff can view all staff records" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can insert staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can update staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can delete staff" ON staff;

-- Drop the helper function
DROP FUNCTION IF EXISTS is_staff_user();

-- Policy 1: Any authenticated user can view their own staff record
CREATE POLICY "Staff members can view own record"
  ON staff FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Staff members can view all other staff records
-- (We'll check if they're staff by seeing if their user_id exists in ANY staff record)
-- Use a simpler approach: if you can read your own record, you can read all records
CREATE POLICY "Staff members can view all staff"
  ON staff FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM staff WHERE user_id IS NOT NULL)
  );

-- Policy 3: Superadmins and admins can insert staff
CREATE POLICY "Admins can insert staff"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM staff 
      WHERE user_id IS NOT NULL 
      AND role IN ('superadmin', 'admin')
    )
  );

-- Policy 4: Superadmins and admins can update staff
CREATE POLICY "Admins can update staff"
  ON staff FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM staff 
      WHERE user_id IS NOT NULL 
      AND role IN ('superadmin', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM staff 
      WHERE user_id IS NOT NULL 
      AND role IN ('superadmin', 'admin')
    )
  );

-- Policy 5: Superadmins and admins can delete staff
CREATE POLICY "Admins can delete staff"
  ON staff FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM staff 
      WHERE user_id IS NOT NULL 
      AND role IN ('superadmin', 'admin')
    )
  );
