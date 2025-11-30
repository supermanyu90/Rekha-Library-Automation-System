/*
  # Create Issue Requests Table

  ## Purpose
  Allow members to request books to be issued to them. Staff will review and approve these requests,
  then create actual borrow records.

  ## Tables
  - `issue_requests`
    - `id` (primary key)
    - `member_id` (references members)
    - `book_id` (references books)
    - `status` (enum: pending, approved, rejected, fulfilled)
    - `request_date` (timestamp)
    - `reviewed_by` (references staff, nullable)
    - `reviewed_at` (timestamp, nullable)
    - `review_notes` (text, nullable)
    - `created_at` (timestamp)

  ## Security
  - Enable RLS
  - Members can insert their own issue requests
  - Members can view their own issue requests
  - Staff can view all issue requests
  - Staff can update issue requests (approve/reject/fulfill)
*/

-- Create enum for issue request status
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_request_status') THEN
    CREATE TYPE issue_request_status AS ENUM ('pending', 'approved', 'rejected', 'fulfilled');
  END IF;
END $$;

-- Create issue_requests table
CREATE TABLE IF NOT EXISTS issue_requests (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id),
  book_id INTEGER NOT NULL REFERENCES books(id),
  status issue_request_status NOT NULL DEFAULT 'pending',
  request_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by INTEGER REFERENCES staff(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE issue_requests ENABLE ROW LEVEL SECURITY;

-- Members can insert their own issue requests
CREATE POLICY "Members can create issue requests"
  ON issue_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM members m 
      WHERE m.id = issue_requests.member_id 
      AND m.user_id = auth.uid()
      AND m.status = 'active'
    )
  );

-- Members can view their own issue requests
CREATE POLICY "Members can view own issue requests"
  ON issue_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM members m 
      WHERE m.id = issue_requests.member_id 
      AND m.user_id = auth.uid()
    )
  );

-- Staff can view all issue requests
CREATE POLICY "Staff can view all issue requests"
  ON issue_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM staff s 
      WHERE s.user_id = auth.uid()
    )
  );

-- Staff can update issue requests
CREATE POLICY "Staff can update issue requests"
  ON issue_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM staff s 
      WHERE s.user_id = auth.uid() 
      AND s.role IN ('superadmin', 'admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM staff s 
      WHERE s.user_id = auth.uid() 
      AND s.role IN ('superadmin', 'admin', 'librarian')
    )
  );

-- Staff can delete issue requests
CREATE POLICY "Staff can delete issue requests"
  ON issue_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM staff s 
      WHERE s.user_id = auth.uid() 
      AND s.role IN ('superadmin', 'admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_issue_requests_member_id ON issue_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_issue_requests_book_id ON issue_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_issue_requests_status ON issue_requests(status);
