/*
  # Update RLS Policies to Include Superadmin Role

  ## Summary
  This migration updates all Row Level Security policies to include the new
  'superadmin' role, ensuring superadmins have full access to all operations.

  ## Changes
  
  1. Books Table
     - Superadmin can insert, update, and delete books
  
  2. Members Table
     - Superadmin can insert, update, and delete members
  
  3. Staff Table
     - Superadmin can insert, update, and delete staff
  
  4. Borrow Records
     - Superadmin can insert and update records
  
  5. Fines
     - Superadmin can update fines

  ## Security
  - All policies maintain authentication requirement
  - Role-based access control is enforced
  - Superadmin has unrestricted access
*/

-- Books table policies
DROP POLICY IF EXISTS "Staff can view all books" ON books;
CREATE POLICY "Staff can view all books"
  ON books FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and librarians can insert books" ON books;
CREATE POLICY "Admins and librarians can insert books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
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
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
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
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin')
    )
  );

-- Members table policies
DROP POLICY IF EXISTS "Staff can view all members" ON members;
CREATE POLICY "Staff can view all members"
  ON members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and librarians can insert members" ON members;
CREATE POLICY "Admins and librarians can insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
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
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
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
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin')
    )
  );

-- Staff table policies
DROP POLICY IF EXISTS "Staff can view all staff" ON staff;
CREATE POLICY "Staff can view all staff"
  ON staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can insert staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can insert staff" ON staff;
CREATE POLICY "Superadmins and admins can insert staff"
  ON staff FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can update staff" ON staff;
CREATE POLICY "Superadmins and admins can update staff"
  ON staff FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can delete staff" ON staff;
DROP POLICY IF EXISTS "Superadmins and admins can delete staff" ON staff;
CREATE POLICY "Superadmins and admins can delete staff"
  ON staff FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin')
    )
  );

-- Borrow records policies
DROP POLICY IF EXISTS "Staff can view all borrow records" ON borrow_records;
CREATE POLICY "Staff can view all borrow records"
  ON borrow_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and librarians can insert borrow records" ON borrow_records;
CREATE POLICY "Admins and librarians can insert borrow records"
  ON borrow_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
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
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  );

-- Fines policies
DROP POLICY IF EXISTS "Staff can view all fines" ON fines;
CREATE POLICY "Staff can view all fines"
  ON fines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and librarians can update fines" ON fines;
CREATE POLICY "Admins and librarians can update fines"
  ON fines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('superadmin', 'admin', 'librarian')
    )
  );

-- Create a helper view to see all staff with their roles and permissions
CREATE OR REPLACE VIEW staff_with_permissions AS
SELECT 
  s.id,
  s.name,
  s.email,
  s.role,
  s.user_id,
  CASE 
    WHEN s.role = 'superadmin' THEN 'Full system access - all operations'
    WHEN s.role = 'admin' THEN 'Manage books, members, borrowing, fines, staff'
    WHEN s.role = 'librarian' THEN 'Manage books, borrowing, and fines'
    WHEN s.role = 'assistant' THEN 'Read-only access to all data'
    ELSE 'Unknown role'
  END as permissions,
  CASE 
    WHEN s.user_id IS NOT NULL THEN 'Active ✓'
    ELSE 'Pending Auth Setup ✗'
  END as auth_status
FROM staff s
ORDER BY 
  CASE s.role
    WHEN 'superadmin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'librarian' THEN 3
    WHEN 'assistant' THEN 4
  END,
  s.id;

GRANT SELECT ON staff_with_permissions TO authenticated;
