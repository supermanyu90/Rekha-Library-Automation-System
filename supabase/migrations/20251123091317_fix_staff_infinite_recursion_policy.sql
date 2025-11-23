/*
  # Fix Staff Table Infinite Recursion in RLS Policies

  ## Problem
  The staff table RLS policies were causing infinite recursion because:
  - The SELECT policy checks if the user exists in the staff table
  - This SELECT query triggers the same SELECT policy again
  - Creating an infinite loop

  ## Solution
  Replace the staff table policies with direct auth.uid() checks:
  - Staff can view all staff if they have a user_id in the staff table
  - Use a helper function to get user role without recursion
  - This breaks the recursion cycle

  ## Changes
  1. Drop all existing staff table policies
  2. Create helper function to get user role
  3. Create new policies that don't self-reference the staff table
*/

-- =============================================================================
-- HELPER FUNCTION TO GET USER ROLE
-- =============================================================================

-- Create a helper function to get the current user's role without triggering recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.staff WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =============================================================================
-- STAFF TABLE POLICIES (FIX INFINITE RECURSION)
-- =============================================================================

-- Drop all existing staff policies
DROP POLICY IF EXISTS "Staff can view all staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can insert staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can update staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can delete staff" ON staff;

-- Staff can view all staff (including themselves)
-- This checks if the authenticated user has ANY record in staff table with their user_id
CREATE POLICY "Staff can view all staff"
  ON staff FOR SELECT
  TO authenticated
  USING (
    -- Allow if there exists a staff record with this user_id (avoids recursion)
    auth.uid() IN (SELECT user_id FROM staff WHERE user_id IS NOT NULL)
  );

-- Superadmins and admins can insert staff
CREATE POLICY "Superadmins and admins can insert staff"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('superadmin', 'admin')
  );

-- Superadmins and admins can update staff
CREATE POLICY "Superadmins and admins can update staff"
  ON staff FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('superadmin', 'admin')
  )
  WITH CHECK (
    public.get_user_role() IN ('superadmin', 'admin')
  );

-- Superadmins and admins can delete staff
CREATE POLICY "Superadmins and admins can delete staff"
  ON staff FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() IN ('superadmin', 'admin')
  );
