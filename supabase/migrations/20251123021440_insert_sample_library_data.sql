/*
  # Insert Sample Data for Library Management System

  ## Summary
  Populates the library database with realistic sample data for testing and demonstration.

  ## Data Inserted

  ### Members (5 records)
  - 2 students
  - 2 faculty members
  - 1 external member
  - Mix of active and one inactive member

  ### Staff (5 records)
  - 1 admin (full system access)
  - 2 librarians (issue/return books, manage fines)
  - 2 assistants (view-only access)

  ### Books (10 records)
  - Various categories: Fiction, Science, History, Technology, Mathematics
  - Different publishers and years
  - Mix of availability (some fully available, some partially borrowed)
  - Unique ISBN codes for barcode scanning

  ### Borrow Records (5 records)
  - 2 returned books
  - 2 currently issued books
  - 1 overdue book (past due date, not returned)

  ### Fines (2 records)
  - 1 unpaid fine (₹50 for 5 days overdue)
  - 1 paid fine (₹30 for 3 days overdue)

  ## Notes
  - All dates are relative to current timestamp
  - ISBN codes are realistic format
  - Email addresses follow institutional pattern
  - Phone numbers are realistic format
*/

-- ============================================
-- INSERT MEMBERS
-- ============================================

INSERT INTO members (full_name, email, phone, membership_type, join_date, status) VALUES
('Rajesh Kumar', 'rajesh.kumar@student.edu', '+91-9876543210', 'student', now() - INTERVAL '6 months', 'active'),
('Priya Sharma', 'priya.sharma@student.edu', '+91-9876543211', 'student', now() - INTERVAL '8 months', 'active'),
('Dr. Amit Patel', 'amit.patel@faculty.edu', '+91-9876543212', 'faculty', now() - INTERVAL '2 years', 'active'),
('Prof. Sunita Desai', 'sunita.desai@faculty.edu', '+91-9876543213', 'faculty', now() - INTERVAL '5 years', 'active'),
('Vikram Singh', 'vikram.singh@external.com', '+91-9876543214', 'external', now() - INTERVAL '3 months', 'inactive');

-- ============================================
-- INSERT STAFF
-- ============================================

INSERT INTO staff (name, role, email) VALUES
('Admin User', 'admin', 'admin@library.edu'),
('Linda Martinez', 'librarian', 'linda.m@library.edu'),
('James Brown', 'librarian', 'james.b@library.edu'),
('Patricia Garcia', 'assistant', 'patricia.g@library.edu'),
('David Lee', 'assistant', 'david.l@library.edu');

-- ============================================
-- INSERT BOOKS
-- ============================================

INSERT INTO books (title, author, isbn, category, publisher, published_year, total_copies, available_copies) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'Fiction', 'Scribner', 2004, 3, 2),
('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'Fiction', 'Harper Perennial', 2006, 2, 2),
('A Brief History of Time', 'Stephen Hawking', '978-0-553-10953-5', 'Science', 'Bantam Books', 1998, 4, 3),
('Sapiens', 'Yuval Noah Harari', '978-0-06-231609-7', 'History', 'Harper', 2015, 3, 3),
('Clean Code', 'Robert C. Martin', '978-0-13-235088-4', 'Technology', 'Prentice Hall', 2008, 5, 4),
('Introduction to Algorithms', 'Thomas H. Cormen', '978-0-262-03384-8', 'Technology', 'MIT Press', 2009, 3, 3),
('The Art of Computer Programming', 'Donald Knuth', '978-0-201-03801-3', 'Technology', 'Addison-Wesley', 1997, 2, 1),
('Calculus', 'James Stewart', '978-1-285-74062-1', 'Mathematics', 'Cengage Learning', 2015, 4, 4),
('Pride and Prejudice', 'Jane Austen', '978-0-14-143951-8', 'Fiction', 'Penguin Classics', 2003, 3, 3),
('The Selfish Gene', 'Richard Dawkins', '978-0-19-286092-7', 'Science', 'Oxford University Press', 2006, 2, 2);

-- ============================================
-- INSERT BORROW RECORDS
-- ============================================

-- Record 1: Returned (The Great Gatsby)
INSERT INTO borrow_records (member_id, book_id, issued_by, issue_date, due_date, return_date, status) VALUES
(1, 1, 2, now() - INTERVAL '20 days', now() - INTERVAL '6 days', now() - INTERVAL '5 days', 'returned');

-- Record 2: Currently Issued (Clean Code)
INSERT INTO borrow_records (member_id, book_id, issued_by, issue_date, due_date, return_date, status) VALUES
(2, 5, 2, now() - INTERVAL '5 days', now() + INTERVAL '9 days', NULL, 'issued');

-- Record 3: Overdue (A Brief History of Time)
INSERT INTO borrow_records (member_id, book_id, issued_by, issue_date, due_date, return_date, status) VALUES
(3, 3, 3, now() - INTERVAL '20 days', now() - INTERVAL '5 days', NULL, 'overdue');

-- Record 4: Returned (The Art of Computer Programming)
INSERT INTO borrow_records (member_id, book_id, issued_by, issue_date, due_date, return_date, status) VALUES
(4, 7, 2, now() - INTERVAL '18 days', now() - INTERVAL '4 days', now() - INTERVAL '3 days', 'returned');

-- Record 5: Overdue but recently returned (was overdue, now returned with fine paid)
INSERT INTO borrow_records (member_id, book_id, issued_by, issue_date, due_date, return_date, status) VALUES
(1, 1, 3, now() - INTERVAL '30 days', now() - INTERVAL '10 days', now() - INTERVAL '7 days', 'returned');

-- ============================================
-- INSERT FINES
-- ============================================

-- Fine 1: Unpaid fine for currently overdue book (Record 3)
INSERT INTO fines (borrow_id, fine_amount, paid_status, assessed_date) VALUES
(3, 50.00, 'unpaid', now() - INTERVAL '2 days');

-- Fine 2: Paid fine for previously overdue book (Record 5)
INSERT INTO fines (borrow_id, fine_amount, paid_status, assessed_date) VALUES
(5, 30.00, 'paid', now() - INTERVAL '7 days');
