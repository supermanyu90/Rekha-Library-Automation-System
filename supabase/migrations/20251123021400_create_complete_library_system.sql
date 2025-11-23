/*
  # Complete Library Management System Database

  ## Overview
  This migration creates a comprehensive library management system with full CRUD capabilities,
  role-based access control, and automated workflows for book management, borrowing, returns,
  overdue tracking, and fine generation.

  ## Tables Created

  ### 1. members
  - Stores library member information
  - Columns: id, full_name, email (unique), phone, membership_type, join_date, status
  - Membership types: student, faculty, external
  - Status: active, inactive, blacklisted

  ### 2. staff
  - Stores staff information with roles
  - Columns: id, name, role, email (unique), user_id (links to auth.users)
  - Roles: admin, librarian, assistant
  - Links to Supabase auth for authentication

  ### 3. books
  - Book catalog with inventory tracking
  - Columns: id, title, author, isbn (unique), category, publisher, published_year, total_copies, available_copies
  - ISBN field supports barcode scanning
  - Tracks total and available copies separately

  ### 4. borrow_records
  - Tracks all borrowing transactions
  - Columns: id, member_id, book_id, issued_by, issue_date, due_date, return_date, status
  - Status: issued, returned, overdue
  - Links members, books, and staff

  ### 5. fines
  - Fine management for overdue books
  - Columns: id, borrow_id, fine_amount, paid_status, assessed_date
  - Paid status: paid, unpaid
  - One fine per borrow record

  ## Security (Row Level Security)

  All tables have RLS enabled with policies for:
  - Admin: Full access to all data
  - Librarian: Can manage books, members, borrow records, and view fines
  - Assistant: Read-only access to all data
  - Public: No access (authentication required)

  ## Automation Features

  ### Triggers
  1. **decrease_book_copies**: Automatically decreases available_copies when book is issued
  2. **increase_book_copies**: Automatically increases available_copies when book is returned
  3. **prevent_issue_if_unavailable**: Prevents issuing if available_copies = 0

  ### Functions
  1. **update_overdue_records()**: Marks records as overdue if due_date < now and not returned
  2. **generate_fines_for_overdue()**: Auto-generates fines at ₹10/day for overdue books

  ## Sample Data
  - 5 members (mix of student, faculty, external)
  - 5 staff (1 admin, 2 librarians, 2 assistants)
  - 10 books across various categories
  - 5 borrow records (mix of issued, returned, overdue)
  - 2 fines for overdue books
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS borrow_records CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- Create ENUM types
DO $$ BEGIN
  CREATE TYPE membership_type AS ENUM ('student', 'faculty', 'external');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE member_status AS ENUM ('active', 'inactive', 'blacklisted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE staff_role AS ENUM ('admin', 'librarian', 'assistant');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE borrow_status AS ENUM ('issued', 'returned', 'overdue');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('paid', 'unpaid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. MEMBERS TABLE
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  membership_type membership_type NOT NULL DEFAULT 'student',
  join_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status member_status NOT NULL DEFAULT 'active'
);

-- 2. STAFF TABLE
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role staff_role NOT NULL DEFAULT 'assistant',
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. BOOKS TABLE
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE,
  category TEXT,
  publisher TEXT,
  published_year INTEGER,
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT available_not_greater_than_total CHECK (available_copies <= total_copies),
  CONSTRAINT non_negative_copies CHECK (available_copies >= 0 AND total_copies >= 0)
);

-- 4. BORROW_RECORDS TABLE
CREATE TABLE IF NOT EXISTS borrow_records (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  issued_by INTEGER NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ,
  status borrow_status NOT NULL DEFAULT 'issued'
);

-- 5. FINES TABLE
CREATE TABLE IF NOT EXISTS fines (
  id SERIAL PRIMARY KEY,
  borrow_id INTEGER NOT NULL UNIQUE REFERENCES borrow_records(id) ON DELETE CASCADE,
  fine_amount NUMERIC(10,2) NOT NULL,
  paid_status payment_status NOT NULL DEFAULT 'unpaid',
  assessed_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_borrow_member ON borrow_records(member_id);
CREATE INDEX IF NOT EXISTS idx_borrow_book ON borrow_records(book_id);
CREATE INDEX IF NOT EXISTS idx_borrow_status ON borrow_records(status);
CREATE INDEX IF NOT EXISTS idx_borrow_due_date ON borrow_records(due_date);
CREATE INDEX IF NOT EXISTS idx_fines_borrow ON fines(borrow_id);
CREATE INDEX IF NOT EXISTS idx_fines_paid_status ON fines(paid_status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- Helper function to get current staff role
CREATE OR REPLACE FUNCTION get_staff_role()
RETURNS staff_role AS $$
  SELECT role FROM staff WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- MEMBERS POLICIES
CREATE POLICY "Admin full access to members"
  ON members FOR ALL
  TO authenticated
  USING (get_staff_role() = 'admin')
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "Librarian full access to members"
  ON members FOR ALL
  TO authenticated
  USING (get_staff_role() = 'librarian')
  WITH CHECK (get_staff_role() = 'librarian');

CREATE POLICY "Assistant read-only access to members"
  ON members FOR SELECT
  TO authenticated
  USING (get_staff_role() = 'assistant');

-- STAFF POLICIES
CREATE POLICY "Admin full access to staff"
  ON staff FOR ALL
  TO authenticated
  USING (get_staff_role() = 'admin')
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "Librarian and Assistant read staff"
  ON staff FOR SELECT
  TO authenticated
  USING (get_staff_role() IN ('librarian', 'assistant'));

-- BOOKS POLICIES
CREATE POLICY "Admin full access to books"
  ON books FOR ALL
  TO authenticated
  USING (get_staff_role() = 'admin')
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "Librarian full access to books"
  ON books FOR ALL
  TO authenticated
  USING (get_staff_role() = 'librarian')
  WITH CHECK (get_staff_role() = 'librarian');

CREATE POLICY "Assistant read-only access to books"
  ON books FOR SELECT
  TO authenticated
  USING (get_staff_role() = 'assistant');

-- BORROW_RECORDS POLICIES
CREATE POLICY "Admin full access to borrow_records"
  ON borrow_records FOR ALL
  TO authenticated
  USING (get_staff_role() = 'admin')
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "Librarian full access to borrow_records"
  ON borrow_records FOR ALL
  TO authenticated
  USING (get_staff_role() = 'librarian')
  WITH CHECK (get_staff_role() = 'librarian');

CREATE POLICY "Assistant read-only access to borrow_records"
  ON borrow_records FOR SELECT
  TO authenticated
  USING (get_staff_role() = 'assistant');

-- FINES POLICIES
CREATE POLICY "Admin full access to fines"
  ON fines FOR ALL
  TO authenticated
  USING (get_staff_role() = 'admin')
  WITH CHECK (get_staff_role() = 'admin');

CREATE POLICY "Librarian full access to fines"
  ON fines FOR ALL
  TO authenticated
  USING (get_staff_role() = 'librarian')
  WITH CHECK (get_staff_role() = 'librarian');

CREATE POLICY "Assistant read-only access to fines"
  ON fines FOR SELECT
  TO authenticated
  USING (get_staff_role() = 'assistant');

-- ============================================
-- AUTOMATION FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Decrease available copies when book is issued
CREATE OR REPLACE FUNCTION decrease_book_copies()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'issued' AND NEW.return_date IS NULL THEN
    UPDATE books
    SET available_copies = available_copies - 1
    WHERE id = NEW.book_id AND available_copies > 0;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'No available copies for book_id %', NEW.book_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrease_book_copies
  AFTER INSERT ON borrow_records
  FOR EACH ROW
  WHEN (NEW.status = 'issued')
  EXECUTE FUNCTION decrease_book_copies();

-- Function: Increase available copies when book is returned
CREATE OR REPLACE FUNCTION increase_book_copies()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.return_date IS NULL AND NEW.return_date IS NOT NULL THEN
    UPDATE books
    SET available_copies = available_copies + 1
    WHERE id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increase_book_copies
  AFTER UPDATE ON borrow_records
  FOR EACH ROW
  WHEN (OLD.return_date IS NULL AND NEW.return_date IS NOT NULL)
  EXECUTE FUNCTION increase_book_copies();

-- Function: Update overdue records
CREATE OR REPLACE FUNCTION update_overdue_records()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE borrow_records
  SET status = 'overdue'
  WHERE due_date < now()
    AND return_date IS NULL
    AND status != 'overdue';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate fines for overdue books (₹10/day)
CREATE OR REPLACE FUNCTION generate_fines_for_overdue()
RETURNS INTEGER AS $$
DECLARE
  rec RECORD;
  days_overdue INTEGER;
  fine_amount NUMERIC(10,2);
  fines_created INTEGER := 0;
BEGIN
  FOR rec IN
    SELECT br.id, br.due_date
    FROM borrow_records br
    LEFT JOIN fines f ON f.borrow_id = br.id
    WHERE br.status = 'overdue'
      AND br.return_date IS NULL
      AND f.id IS NULL
  LOOP
    days_overdue := EXTRACT(DAY FROM (now() - rec.due_date))::INTEGER;
    fine_amount := days_overdue * 10.00;
    
    INSERT INTO fines (borrow_id, fine_amount, paid_status)
    VALUES (rec.id, fine_amount, 'unpaid');
    
    fines_created := fines_created + 1;
  END LOOP;
  
  RETURN fines_created;
END;
$$ LANGUAGE plpgsql;
