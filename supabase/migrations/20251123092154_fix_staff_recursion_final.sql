/*
  # Fix Staff Infinite Recursion - Final Solution

  ## Problem
  Any policy on the staff table that queries the staff table causes infinite recursion.
  
  ## Solution
  Use a bypass approach with SECURITY DEFINER function that bypasses RLS.
  
  The key is that SECURITY DEFINER functions bypass RLS, so they won't trigger recursion.

  ## Changes
  1. Drop existing policies first
  2. Drop old helper function
  3. Create new helper function with SECURITY DEFINER
  4. Create new policies using the helper function
*/

-- Drop all existing staff policies first
DROP POLICY IF EXISTS "Staff can view all staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can insert staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can update staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can delete staff" ON staff;

-- Now we can drop the old helper function
DROP FUNCTION IF EXISTS public.get_user_role();

-- Create a SECURITY DEFINER function that bypasses RLS
-- This function will NOT trigger RLS policies when it queries staff table
CREATE OR REPLACE FUNCTION public.check_staff_access(check_user_id uuid)
RETURNS TABLE(has_access boolean, user_role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (user_id IS NOT NULL) as has_access,
    role as user_role
  FROM public.staff
  WHERE user_id = check_user_id
  LIMIT 1;
END;
$$;

-- Staff can view all staff if they have a staff record
CREATE POLICY "Staff can view all staff"
  ON staff FOR SELECT
  TO authenticated
  USING (
    (SELECT has_access FROM public.check_staff_access(auth.uid()))
  );

-- Superadmins and admins can insert staff
CREATE POLICY "Superadmins and admins can insert staff"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin')
  );

-- Superadmins and admins can update staff
CREATE POLICY "Superadmins and admins can update staff"
  ON staff FOR UPDATE
  TO authenticated
  USING (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin')
  )
  WITH CHECK (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin')
  );

-- Superadmins and admins can delete staff
CREATE POLICY "Superadmins and admins can delete staff"
  ON staff FOR DELETE
  TO authenticated
  USING (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin')
  );
