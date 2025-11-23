/*
  # Optimize RLS Policies for Performance

  ## Summary
  This migration optimizes all Row Level Security policies by wrapping auth.uid()
  calls with SELECT. This prevents the function from being re-evaluated for each row,
  significantly improving query performance at scale.

  ## Changes
  - Replace auth.uid() with (SELECT auth.uid()) in all policies
  - This ensures the function is evaluated once per query instead of once per row

  ## Performance Impact
  - Dramatically improves performance for queries returning multiple rows
  - Reduces database load by eliminating redundant function calls
  - Follows Supabase best practices for RLS optimization
*/

-- =============================================================================
-- BOOKS TABLE POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Staff can view all books" ON books;
CREATE POLICY "Staff can view all books"
  ON books FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins and librarians can insert books" ON books;
CREATE POLICY "Admins and librarians can insert books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  );

DROP POLICY IF EXISTS "Admins and librarians can update books" ON books;
CREATE POLICY "Admins and librarians can update books"
  ON books FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  );

DROP POLICY IF EXISTS "Admins can delete books" ON books;
CREATE POLICY "Admins can delete books"
  ON books FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin')
    )
  );

-- =============================================================================
-- MEMBERS TABLE POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Staff can view all members" ON members;
CREATE POLICY "Staff can view all members"
  ON members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins and librarians can insert members" ON members;
CREATE POLICY "Admins and librarians can insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  );

DROP POLICY IF EXISTS "Admins and librarians can update members" ON members;
CREATE POLICY "Admins and librarians can update members"
  ON members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  );

DROP POLICY IF EXISTS "Admins can delete members" ON members;
CREATE POLICY "Admins can delete members"
  ON members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin')
    )
  );

-- =============================================================================
-- STAFF TABLE POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Staff can view all staff" ON staff;
CREATE POLICY "Staff can view all staff"
  ON staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Superadmins and admins can insert staff" ON staff;
CREATE POLICY "Superadmins and admins can insert staff"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Superadmins and admins can update staff" ON staff;
CREATE POLICY "Superadmins and admins can update staff"
  ON staff FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Superadmins and admins can delete staff" ON staff;
CREATE POLICY "Superadmins and admins can delete staff"
  ON staff FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin')
    )
  );

-- =============================================================================
-- BORROW RECORDS TABLE POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Staff can view all borrow records" ON borrow_records;
CREATE POLICY "Staff can view all borrow records"
  ON borrow_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins and librarians can insert borrow records" ON borrow_records;
CREATE POLICY "Admins and librarians can insert borrow records"
  ON borrow_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  );

DROP POLICY IF EXISTS "Admins and librarians can update borrow records" ON borrow_records;
CREATE POLICY "Admins and librarians can update borrow records"
  ON borrow_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  );

-- =============================================================================
-- FINES TABLE POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Staff can view all fines" ON fines;
CREATE POLICY "Staff can view all fines"
  ON fines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins and librarians can update fines" ON fines;
CREATE POLICY "Admins and librarians can update fines"
  ON fines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = (SELECT auth.uid())
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  );
