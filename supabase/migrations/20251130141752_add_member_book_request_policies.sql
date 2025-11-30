/*
  # Add Member Book Request Policies

  ## Problem
  Members cannot view their own book requests. The book_requests table only has policies
  for staff to view all requests and for anyone to insert requests.

  ## Solution
  Add a SELECT policy that allows members to view their own book requests
  based on their email address.

  ## Security
  - Members can only see their own requests (matched by requester_email)
  - Staff can still see all requests (existing policy)
  - Members cannot modify or delete requests once submitted
*/

-- Allow members to view their own book requests
CREATE POLICY "Members can view own book requests"
  ON book_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM members 
      WHERE members.user_id = auth.uid() 
      AND members.email = book_requests.requester_email
    )
  );
