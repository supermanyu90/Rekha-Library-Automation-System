/*
  # Fix Books RLS Policies

  ## Problem
  Books table RLS policies query the staff table with EXISTS checks,
  but staff table now only allows viewing own record, causing policies to fail.

  ## Solution
  1. Create a security definer function that bypasses RLS to check staff role
  2. Update all books policies to use this function instead of direct staff queries

  ## Changes
  - Create is_staff_with_role() function with SECURITY DEFINER
  - Drop and recreate all books RLS policies using the new function
*/

-- Create a function to check if current user is staff with specific roles
CREATE OR REPLACE FUNCTION is_staff_with_role(allowed_roles staff_role[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role staff_role;
BEGIN
  -- Get the user's role from staff table (bypasses RLS with SECURITY DEFINER)
  SELECT role INTO user_role
  FROM staff
  WHERE user_id = auth.uid();
  
  -- Return true if user has one of the allowed roles
  RETURN user_role = ANY(allowed_roles);
END;
$$;

-- Drop existing books policies
DROP POLICY IF EXISTS "Staff can view all books" ON books;
DROP POLICY IF EXISTS "Admins and librarians can insert books" ON books;
DROP POLICY IF EXISTS "Admins and librarians can update books" ON books;
DROP POLICY IF EXISTS "Admins can delete books" ON books;

-- Recreate policies using the safe function

-- SELECT: Any staff member can view books
CREATE POLICY "Staff can view all books"
  ON books FOR SELECT
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

-- INSERT: Superadmins, admins, and librarians can add books
CREATE POLICY "Admins and librarians can insert books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian']::staff_role[])
  );

-- UPDATE: Superadmins, admins, and librarians can update books
CREATE POLICY "Admins and librarians can update books"
  ON books FOR UPDATE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian']::staff_role[])
  )
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian']::staff_role[])
  );

-- DELETE: Only superadmins and admins can delete books
CREATE POLICY "Admins can delete books"
  ON books FOR DELETE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin']::staff_role[])
  );
