/*
  # Create Book Reviews Table

  ## Description
  Creates a table for members to submit reviews for books. Reviews require approval from
  librarians, admins, or superadmins before being published.

  ## New Tables
  - `book_reviews`
    - `id` (serial, primary key) - Unique identifier
    - `member_id` (integer, required) - Member who wrote the review
    - `book_id` (integer, required) - Book being reviewed
    - `rating` (integer, required) - Rating from 1-5
    - `review_text` (text, optional) - Review content
    - `status` (review_status, default 'pending') - Review approval status
    - `reviewed_by` (integer, optional) - Staff who reviewed/approved
    - `reviewed_at` (timestamptz, optional) - When reviewed
    - `review_notes` (text, optional) - Notes from reviewer
    - `created_at` (timestamptz, default now()) - When submitted
    - `updated_at` (timestamptz, default now()) - Last update

  ## Enums
  - `review_status`: pending, approved, rejected

  ## Security
  - Enable RLS on book_reviews table
  - Members can view approved reviews
  - Members can view their own reviews (all statuses)
  - Members can create reviews
  - Staff can view all reviews
  - Only librarian, admin, and superadmin can update reviews

  ## Indexes
  - Index on member_id for member lookups
  - Index on book_id for book lookups
  - Index on status for filtering
*/

-- Create review_status enum
DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create book_reviews table
CREATE TABLE IF NOT EXISTS book_reviews (
  id serial PRIMARY KEY,
  member_id integer NOT NULL REFERENCES members(id),
  book_id integer NOT NULL REFERENCES books(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  status review_status DEFAULT 'pending' NOT NULL,
  reviewed_by integer REFERENCES staff(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_book_reviews_member_id ON book_reviews(member_id);
CREATE INDEX IF NOT EXISTS idx_book_reviews_book_id ON book_reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_book_reviews_status ON book_reviews(status);

-- Enable RLS
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
  ON book_reviews FOR SELECT
  TO authenticated, anon
  USING (
    status = 'approved'
    OR
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
    OR
    (SELECT has_access FROM public.check_staff_access(auth.uid()))
  );

-- Members can create their own reviews
CREATE POLICY "Members can create reviews"
  ON book_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Members can update their own pending reviews
CREATE POLICY "Members can update own pending reviews"
  ON book_reviews FOR UPDATE
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Only librarian, admin, and superadmin can approve/reject reviews
CREATE POLICY "Staff can update all reviews"
  ON book_reviews FOR UPDATE
  TO authenticated
  USING (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin', 'librarian')
  )
  WITH CHECK (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin', 'librarian')
  );

-- Only superadmin and admin can delete reviews
CREATE POLICY "Superadmin and admin can delete reviews"
  ON book_reviews FOR DELETE
  TO authenticated
  USING (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin')
  );
