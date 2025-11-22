/*
  # Library Management System Database Schema

  ## Overview
  Creates a complete relational database for a library management system with member management,
  staff tracking, book inventory, borrowing workflow, and fine management.

  ## New Tables

  ### 1. members
  - `id` (uuid, PK) - Unique member identifier
  - `full_name` (text, required) - Member's full name
  - `email` (text, unique, required) - Member's email address
  - `phone` (text) - Contact phone number
  - `membership_type` (enum) - Type: student, faculty, or external
  - `join_date` (timestamptz) - Date member joined (default: now)
  - `status` (enum) - Status: active, inactive, or blacklisted
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. staff
  - `id` (uuid, PK) - Unique staff identifier
  - `name` (text, required) - Staff member name
  - `role` (enum) - Role: admin, librarian, or assistant
  - `email` (text, unique, required) - Staff email address
  - `user_id` (uuid, FK) - Link to auth.users for authentication
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. books
  - `id` (uuid, PK) - Unique book identifier
  - `title` (text, required) - Book title
  - `author` (text, required) - Book author
  - `isbn` (text, unique) - ISBN/barcode for scanning
  - `category` (text) - Book category/genre
  - `publisher` (text) - Publisher name
  - `published_year` (integer) - Year of publication
  - `total_copies` (integer, required) - Total copies in library
  - `available_copies` (integer, required) - Currently available copies
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. borrow_records
  - `id` (uuid, PK) - Unique borrow record identifier
  - `member_id` (uuid, FK) - References members.id
  - `book_id` (uuid, FK) - References books.id
  - `issued_by` (uuid, FK) - References staff.id
  - `issue_date` (timestamptz) - Date book was issued (default: now)
  - `due_date` (timestamptz, required) - Due date for return
  - `return_date` (timestamptz, nullable) - Actual return date
  - `status` (enum) - Status: issued, returned, or overdue
  - `created_at` (timestamptz) - Record creation timestamp

  ### 5. fines
  - `id` (uuid, PK) - Unique fine identifier
  - `borrow_id` (uuid, FK) - References borrow_records.id
  - `fine_amount` (numeric(10,2), required) - Fine amount in currency
  - `paid_status` (enum) - Status: paid or unpaid
  - `assessed_date` (timestamptz) - Date fine was assessed (default: now)
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Admin role: full access to all tables
  - Librarian role: can issue/return books, view fines
  - Assistant role: read-only access
  - Public users: no access (must be authenticated)

  ## Important Notes
  - All foreign key relationships are defined with ON DELETE CASCADE for data integrity
  - Enums ensure data consistency for categorical fields
  - Indexes added on foreign keys and frequently queried fields for performance
  - Triggers will be added for automated workflows (overdue detection, fine calculation)
*/

-- Create custom types (enums)
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

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  membership_type membership_type NOT NULL DEFAULT 'student',
  join_date timestamptz NOT NULL DEFAULT now(),
  status member_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role staff_role NOT NULL DEFAULT 'assistant',
  email text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text UNIQUE,
  category text,
  publisher text,
  published_year integer,
  total_copies integer NOT NULL DEFAULT 1,
  available_copies integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT available_copies_check CHECK (available_copies >= 0 AND available_copies <= total_copies)
);

-- Create borrow_records table
CREATE TABLE IF NOT EXISTS borrow_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  issued_by uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  issue_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz NOT NULL,
  return_date timestamptz,
  status borrow_status NOT NULL DEFAULT 'issued',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create fines table
CREATE TABLE IF NOT EXISTS fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  borrow_id uuid UNIQUE NOT NULL REFERENCES borrow_records(id) ON DELETE CASCADE,
  fine_amount numeric(10,2) NOT NULL DEFAULT 0.00,
  paid_status payment_status NOT NULL DEFAULT 'unpaid',
  assessed_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fine_amount_check CHECK (fine_amount >= 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_borrow_records_member_id ON borrow_records(member_id);
CREATE INDEX IF NOT EXISTS idx_borrow_records_book_id ON borrow_records(book_id);
CREATE INDEX IF NOT EXISTS idx_borrow_records_status ON borrow_records(status);
CREATE INDEX IF NOT EXISTS idx_borrow_records_due_date ON borrow_records(due_date);
CREATE INDEX IF NOT EXISTS idx_fines_borrow_id ON fines(borrow_id);
CREATE INDEX IF NOT EXISTS idx_fines_paid_status ON fines(paid_status);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for members table
CREATE POLICY "Admin has full access to members"
  ON members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'admin'
    )
  );

CREATE POLICY "Librarians can view and modify members"
  ON members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'librarian')
    )
  );

CREATE POLICY "Assistants can view members"
  ON members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

-- RLS Policies for staff table
CREATE POLICY "Admin has full access to staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
      AND s.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
      AND s.role = 'admin'
    )
  );

CREATE POLICY "Staff can view all staff members"
  ON staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

-- RLS Policies for books table
CREATE POLICY "Admin has full access to books"
  ON books FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'admin'
    )
  );

CREATE POLICY "Librarians can manage books"
  ON books FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'librarian')
    )
  );

CREATE POLICY "Assistants can view books"
  ON books FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

-- RLS Policies for borrow_records table
CREATE POLICY "Admin has full access to borrow records"
  ON borrow_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'admin'
    )
  );

CREATE POLICY "Librarians can manage borrow records"
  ON borrow_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'librarian')
    )
  );

CREATE POLICY "Assistants can view borrow records"
  ON borrow_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );

-- RLS Policies for fines table
CREATE POLICY "Admin has full access to fines"
  ON fines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role = 'admin'
    )
  );

CREATE POLICY "Librarians can manage fines"
  ON fines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'librarian')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'librarian')
    )
  );

CREATE POLICY "Assistants can view fines"
  ON fines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.user_id = auth.uid()
    )
  );