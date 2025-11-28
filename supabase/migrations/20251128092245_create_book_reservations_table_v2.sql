/*
  # Create Book Reservations Table

  ## Description
  Creates a table for members to reserve books. Members can reserve books that are currently
  unavailable. Librarians can view and manage reservations, fulfilling them when books become available.

  ## New Tables
  - `book_reservations`
    - `id` (serial, primary key) - Unique identifier
    - `member_id` (integer, required) - Member who made the reservation
    - `book_id` (integer, required) - Book being reserved
    - `status` (reservation_status, default 'pending') - Reservation status
    - `reservation_date` (timestamptz, default now()) - When reserved
    - `fulfilled_by` (integer, optional) - Staff who fulfilled the reservation
    - `fulfilled_at` (timestamptz, optional) - When fulfilled
    - `cancelled_at` (timestamptz, optional) - When cancelled
    - `notes` (text, optional) - Additional notes

  ## Enums
  - `reservation_status`: pending, fulfilled, cancelled

  ## Security
  - Enable RLS on book_reservations table
  - Members can view their own reservations
  - Members can create reservations
  - Staff can view all reservations
  - Only librarian, admin, and superadmin can update reservations

  ## Indexes
  - Index on member_id for member lookups
  - Index on book_id for book lookups
  - Index on status for filtering
*/

-- Create reservation_status enum
DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('pending', 'fulfilled', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create book_reservations table
CREATE TABLE IF NOT EXISTS book_reservations (
  id serial PRIMARY KEY,
  member_id integer NOT NULL REFERENCES members(id),
  book_id integer NOT NULL REFERENCES books(id),
  status reservation_status DEFAULT 'pending' NOT NULL,
  reservation_date timestamptz DEFAULT now() NOT NULL,
  fulfilled_by integer REFERENCES staff(id),
  fulfilled_at timestamptz,
  cancelled_at timestamptz,
  notes text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_book_reservations_member_id ON book_reservations(member_id);
CREATE INDEX IF NOT EXISTS idx_book_reservations_book_id ON book_reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_reservations_status ON book_reservations(status);

-- Enable RLS
ALTER TABLE book_reservations ENABLE ROW LEVEL SECURITY;

-- Members can view their own reservations
CREATE POLICY "Members can view own reservations"
  ON book_reservations FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
    OR
    (SELECT has_access FROM public.check_staff_access(auth.uid()))
  );

-- Members can create their own reservations
CREATE POLICY "Members can create reservations"
  ON book_reservations FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Only librarian, admin, and superadmin can update reservations
CREATE POLICY "Staff can update reservations"
  ON book_reservations FOR UPDATE
  TO authenticated
  USING (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin', 'librarian')
  )
  WITH CHECK (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin', 'librarian')
  );

-- Only superadmin and admin can delete reservations
CREATE POLICY "Superadmin and admin can delete reservations"
  ON book_reservations FOR DELETE
  TO authenticated
  USING (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin')
  );
