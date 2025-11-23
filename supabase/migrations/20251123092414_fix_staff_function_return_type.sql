/*
  # Fix Staff Access Function Return Type

  ## Problem
  The check_staff_access function returns TEXT for user_role, but the actual
  column type is staff_role (enum). This causes a type mismatch error.

  ## Solution
  1. Drop all policies that depend on the function
  2. Drop and recreate the function with correct return type
  3. Recreate the policies

  ## Changes
  - Update function return type from text to staff_role
  - Ensure all policies are recreated properly
*/

-- Drop all existing staff policies first
DROP POLICY IF EXISTS "Staff can view all staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can insert staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can update staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can delete staff" ON staff;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.check_staff_access(uuid);

-- Create the function with correct return type for role
CREATE OR REPLACE FUNCTION public.check_staff_access(check_user_id uuid)
RETURNS TABLE(has_access boolean, user_role staff_role)
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

-- Recreate all policies

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
