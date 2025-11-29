/*
  # Fix All RLS Policies with Staff Checks

  ## Problem
  Multiple tables have RLS policies that query the staff table,
  which now only allows viewing own record, causing policies to fail.

  ## Solution
  Update all RLS policies to use the is_staff_with_role() function
  that safely checks staff roles with SECURITY DEFINER.

  ## Tables Updated
  - members
  - borrow_records
  - fines
  - book_requests
  - book_reservations
  - book_reviews
  - onboarding_forms
*/

-- ============================================
-- MEMBERS TABLE
-- ============================================

DROP POLICY IF EXISTS "Staff can view all members" ON members;
DROP POLICY IF EXISTS "Admins and librarians can insert members" ON members;
DROP POLICY IF EXISTS "Admins and librarians can update members" ON members;
DROP POLICY IF EXISTS "Admins can delete members" ON members;

CREATE POLICY "Staff can view all members"
  ON members FOR SELECT
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

CREATE POLICY "Admins and librarians can insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian']::staff_role[])
  );

CREATE POLICY "Admins and librarians can update members"
  ON members FOR UPDATE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian']::staff_role[])
  )
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian']::staff_role[])
  );

CREATE POLICY "Admins can delete members"
  ON members FOR DELETE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin']::staff_role[])
  );

-- ============================================
-- BORROW_RECORDS TABLE
-- ============================================

DROP POLICY IF EXISTS "Staff can view all borrow records" ON borrow_records;
DROP POLICY IF EXISTS "Staff can insert borrow records" ON borrow_records;
DROP POLICY IF EXISTS "Staff can update borrow records" ON borrow_records;

CREATE POLICY "Staff can view all borrow records"
  ON borrow_records FOR SELECT
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

CREATE POLICY "Staff can insert borrow records"
  ON borrow_records FOR INSERT
  TO authenticated
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

CREATE POLICY "Staff can update borrow records"
  ON borrow_records FOR UPDATE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  )
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

-- ============================================
-- FINES TABLE
-- ============================================

DROP POLICY IF EXISTS "Staff can view all fines" ON fines;
DROP POLICY IF EXISTS "Staff can insert fines" ON fines;
DROP POLICY IF EXISTS "Staff can update fines" ON fines;

CREATE POLICY "Staff can view all fines"
  ON fines FOR SELECT
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

CREATE POLICY "Staff can insert fines"
  ON fines FOR INSERT
  TO authenticated
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

CREATE POLICY "Staff can update fines"
  ON fines FOR UPDATE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  )
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

-- ============================================
-- BOOK_REQUESTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Staff can view all book requests" ON book_requests;
DROP POLICY IF EXISTS "Staff can update book requests" ON book_requests;

CREATE POLICY "Staff can view all book requests"
  ON book_requests FOR SELECT
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

CREATE POLICY "Staff can update book requests"
  ON book_requests FOR UPDATE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  )
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

-- ============================================
-- BOOK_RESERVATIONS TABLE
-- ============================================

DROP POLICY IF EXISTS "Staff can view all reservations" ON book_reservations;
DROP POLICY IF EXISTS "Staff can update reservations" ON book_reservations;
DROP POLICY IF EXISTS "Staff can delete reservations" ON book_reservations;

CREATE POLICY "Staff can view all reservations"
  ON book_reservations FOR SELECT
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

CREATE POLICY "Staff can update reservations"
  ON book_reservations FOR UPDATE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  )
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

CREATE POLICY "Staff can delete reservations"
  ON book_reservations FOR DELETE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

-- ============================================
-- BOOK_REVIEWS TABLE
-- ============================================

DROP POLICY IF EXISTS "Staff can view all reviews" ON book_reviews;
DROP POLICY IF EXISTS "Staff can update reviews" ON book_reviews;
DROP POLICY IF EXISTS "Staff can delete reviews" ON book_reviews;

CREATE POLICY "Staff can view all reviews"
  ON book_reviews FOR SELECT
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

CREATE POLICY "Staff can update reviews"
  ON book_reviews FOR UPDATE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  )
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

CREATE POLICY "Staff can delete reviews"
  ON book_reviews FOR DELETE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

-- ============================================
-- ONBOARDING_FORMS TABLE
-- ============================================

DROP POLICY IF EXISTS "Staff can view all onboarding forms" ON onboarding_forms;
DROP POLICY IF EXISTS "Staff can update onboarding forms" ON onboarding_forms;

CREATE POLICY "Staff can view all onboarding forms"
  ON onboarding_forms FOR SELECT
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );

CREATE POLICY "Staff can update onboarding forms"
  ON onboarding_forms FOR UPDATE
  TO authenticated
  USING (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  )
  WITH CHECK (
    is_staff_with_role(ARRAY['superadmin', 'admin', 'librarian', 'assistant']::staff_role[])
  );
