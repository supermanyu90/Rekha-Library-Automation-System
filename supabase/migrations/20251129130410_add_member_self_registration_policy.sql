/*
  # Add Member Self-Registration Policy

  ## Problem
  Member signups from the public home page cannot insert records into the members table
  because there's no RLS policy allowing self-registration.

  ## Solution
  Add an INSERT policy that allows authenticated users to create their own member record
  with pending status and their own user_id.

  ## Security
  - Only allows inserting own user_id (not someone else's)
  - Only allows inserting with status = 'pending' (cannot set themselves as active)
  - User must be authenticated
*/

-- Allow authenticated users to create their own member record
CREATE POLICY "Users can create own member record"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must use their own user_id
    user_id = auth.uid()
    -- Must set status as pending (cannot self-approve)
    AND status = 'pending'
  );
