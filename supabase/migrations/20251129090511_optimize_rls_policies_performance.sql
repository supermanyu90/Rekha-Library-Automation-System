/*
  # Optimize RLS Policies for Performance

  ## Changes
  Optimize all RLS policies to use (select auth.function()) instead of auth.function()
  This prevents re-evaluation of auth functions for each row, significantly improving performance.

  ## Tables Updated
  1. members - 2 policies
  2. staff - 4 policies
  3. book_requests - 3 policies
  4. onboarding_forms - 3 policies
  5. book_reservations - 4 policies
  6. book_reviews - 6 policies

  ## Performance Impact
  - Reduces database load by caching auth function results
  - Improves query performance at scale
*/

-- Drop and recreate members policies
DROP POLICY IF EXISTS "Members can view own data" ON members;
DROP POLICY IF EXISTS "Members can update own data" ON members;

CREATE POLICY "Members can view own data"
  ON members FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Members can update own data"
  ON members FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Drop and recreate staff policies
DROP POLICY IF EXISTS "Staff can view all staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can insert staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can update staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can delete staff" ON staff;

CREATE POLICY "Staff can view all staff"
  ON staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Superadmins and admins can insert staff"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Superadmins and admins can update staff"
  ON staff FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Superadmins and admins can delete staff"
  ON staff FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin')
    )
  );

-- Drop and recreate book_requests policies
DROP POLICY IF EXISTS "Staff can view all book requests" ON book_requests;
DROP POLICY IF EXISTS "Superadmin, admin, and librarian can update book requests" ON book_requests;
DROP POLICY IF EXISTS "Superadmin and admin can delete book requests" ON book_requests;

CREATE POLICY "Staff can view all book requests"
  ON book_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Superadmin, admin, and librarian can update book requests"
  ON book_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin', 'librarian')
    )
  );

CREATE POLICY "Superadmin and admin can delete book requests"
  ON book_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin')
    )
  );

-- Drop and recreate onboarding_forms policies
DROP POLICY IF EXISTS "Staff can view all onboarding forms" ON onboarding_forms;
DROP POLICY IF EXISTS "Superadmin, admin, and librarian can update onboarding forms" ON onboarding_forms;
DROP POLICY IF EXISTS "Superadmin and admin can delete onboarding forms" ON onboarding_forms;

CREATE POLICY "Staff can view all onboarding forms"
  ON onboarding_forms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Superadmin, admin, and librarian can update onboarding forms"
  ON onboarding_forms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin', 'librarian')
    )
  );

CREATE POLICY "Superadmin and admin can delete onboarding forms"
  ON onboarding_forms FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin')
    )
  );

-- Drop and recreate book_reservations policies
DROP POLICY IF EXISTS "Members can view own reservations" ON book_reservations;
DROP POLICY IF EXISTS "Members can create reservations" ON book_reservations;
DROP POLICY IF EXISTS "Staff can update reservations" ON book_reservations;
DROP POLICY IF EXISTS "Superadmin and admin can delete reservations" ON book_reservations;

CREATE POLICY "Members can view own reservations"
  ON book_reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m 
      WHERE m.id = book_reservations.member_id 
      AND m.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Members can create reservations"
  ON book_reservations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m 
      WHERE m.id = book_reservations.member_id 
      AND m.user_id = (select auth.uid())
      AND m.status = 'active'
    )
  );

CREATE POLICY "Staff can update reservations"
  ON book_reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Superadmin and admin can delete reservations"
  ON book_reservations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin')
    )
  );

-- Drop and recreate book_reviews policies
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON book_reviews;
DROP POLICY IF EXISTS "Members can create reviews" ON book_reviews;
DROP POLICY IF EXISTS "Members can update own pending reviews" ON book_reviews;
DROP POLICY IF EXISTS "Staff can update all reviews" ON book_reviews;
DROP POLICY IF EXISTS "Superadmin and admin can delete reviews" ON book_reviews;

CREATE POLICY "Anyone can view approved reviews"
  ON book_reviews FOR SELECT
  TO authenticated
  USING (
    status = 'approved' OR
    EXISTS (
      SELECT 1 FROM members m 
      WHERE m.id = book_reviews.member_id 
      AND m.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Members can create reviews"
  ON book_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m 
      WHERE m.id = book_reviews.member_id 
      AND m.user_id = (select auth.uid())
      AND m.status = 'active'
    )
  );

CREATE POLICY "Members can update own pending reviews"
  ON book_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members m 
      WHERE m.id = book_reviews.member_id 
      AND m.user_id = (select auth.uid())
    ) AND status = 'pending'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m 
      WHERE m.id = book_reviews.member_id 
      AND m.user_id = (select auth.uid())
    ) AND status = 'pending'
  );

CREATE POLICY "Staff can update all reviews"
  ON book_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Superadmin and admin can delete reviews"
  ON book_reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.user_id = (select auth.uid())
      AND s.role IN ('superadmin', 'admin')
    )
  );
