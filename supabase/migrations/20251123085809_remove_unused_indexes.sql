/*
  # Remove Unused Indexes

  ## Summary
  This migration removes indexes that are not being used by queries. Unused indexes
  consume storage space and add overhead to write operations without providing
  query performance benefits.

  ## Changes
  - Remove unused indexes on members table (email, status)
  - Remove unused indexes on staff table (email)
  - Remove unused indexes on books table (isbn, category)
  - Remove unused indexes on borrow_records table (member, book)
  - Remove unused indexes on fines table (paid_status)

  ## Note
  - Keep the new indexes we just created for foreign keys
  - These old indexes were created but never used by actual queries
  - Removing them will improve write performance and reduce storage
*/

-- Remove unused indexes from members table
DROP INDEX IF EXISTS idx_members_email;
DROP INDEX IF EXISTS idx_members_status;

-- Remove unused indexes from staff table
DROP INDEX IF EXISTS idx_staff_email;

-- Remove unused indexes from books table
DROP INDEX IF EXISTS idx_books_isbn;
DROP INDEX IF EXISTS idx_books_category;

-- Remove unused indexes from borrow_records table
DROP INDEX IF EXISTS idx_borrow_member;
DROP INDEX IF EXISTS idx_borrow_book;

-- Remove unused indexes from fines table
DROP INDEX IF EXISTS idx_fines_paid_status;

-- Note: We're keeping the new foreign key indexes we just created:
-- - idx_borrow_records_issued_by
-- - idx_borrow_records_member_id
-- - idx_borrow_records_book_id
-- - idx_fines_borrow_id
-- - idx_borrow_records_status_due_date
