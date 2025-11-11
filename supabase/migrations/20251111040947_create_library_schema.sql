-- Create Library Management System Schema
-- Tables: profiles, books, book_requests
-- Security: RLS enabled with role-based policies

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'librarian', 'head_librarian', 'admin', 'superadmin')),
  avatar_url text,
  accessibility_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  authors text[] DEFAULT '{}'::text[],
  isbn text,
  language text DEFAULT 'English',
  description text,
  categories text[] DEFAULT '{}'::text[],
  cover_image text,
  pdf_file text,
  audiobook_file text,
  total_copies integer DEFAULT 1 CHECK (total_copies >= 0),
  available_copies integer DEFAULT 1 CHECK (available_copies >= 0),
  added_by uuid REFERENCES profiles(id),
  added_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create book_requests table
CREATE TABLE IF NOT EXISTS book_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'issued', 'returned')),
  request_date timestamptz DEFAULT now(),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  issued_by uuid REFERENCES profiles(id),
  issued_at timestamptz,
  due_date timestamptz,
  returned_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_authors ON books USING gin(authors);
CREATE INDEX IF NOT EXISTS idx_books_active ON books(is_active);
CREATE INDEX IF NOT EXISTS idx_book_requests_user ON book_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_book ON book_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_status ON book_requests(status);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Books policies
CREATE POLICY "Anyone can view active books"
  ON books FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Librarians can insert books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('librarian', 'head_librarian', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Librarians can update books"
  ON books FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('librarian', 'head_librarian', 'admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('librarian', 'head_librarian', 'admin', 'superadmin')
    )
  );

-- Book requests policies
CREATE POLICY "Users can view own requests"
  ON book_requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('librarian', 'head_librarian', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Users can create requests"
  ON book_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Librarians can update requests"
  ON book_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('librarian', 'head_librarian', 'admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('librarian', 'head_librarian', 'admin', 'superadmin')
    )
  );