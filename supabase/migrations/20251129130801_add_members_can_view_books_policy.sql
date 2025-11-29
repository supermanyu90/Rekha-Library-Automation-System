/*
  # Add Members Can View Books Policy

  ## Problem
  Members cannot browse books because there's no RLS policy allowing them to SELECT from the books table.
  Only staff can currently view books.

  ## Solution
  Add a SELECT policy that allows active members to view all books in the catalog.

  ## Security
  - Only active members (status = 'active') can view books
  - Pending or suspended members cannot browse
  - All books are visible to active members (public catalog)
*/

-- Create helper function to check if user is an active member
CREATE OR REPLACE FUNCTION is_active_member()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM members 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  );
$$;

-- Allow active members to view all books
CREATE POLICY "Active members can view all books"
  ON books FOR SELECT
  TO authenticated
  USING (is_active_member());
