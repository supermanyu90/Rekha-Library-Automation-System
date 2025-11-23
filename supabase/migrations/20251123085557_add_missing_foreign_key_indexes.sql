/*
  # Add Missing Foreign Key Indexes

  ## Summary
  This migration adds indexes for foreign key columns that don't have covering indexes.
  This improves query performance when joining tables or filtering by foreign keys.

  ## Changes
  - Add index on borrow_records.issued_by (foreign key to staff)
  - Add index on borrow_records.member_id (if not exists)
  - Add index on borrow_records.book_id (if not exists)
  - Add index on fines.borrow_id (if not exists)

  ## Performance Impact
  These indexes will significantly improve query performance for:
  - Finding all books issued by a specific staff member
  - Looking up borrowing history for members
  - Finding fines associated with borrow records
*/

-- Add index for borrow_records.issued_by (foreign key to staff)
CREATE INDEX IF NOT EXISTS idx_borrow_records_issued_by ON borrow_records(issued_by);

-- Add index for borrow_records.member_id (foreign key to members)
CREATE INDEX IF NOT EXISTS idx_borrow_records_member_id ON borrow_records(member_id);

-- Add index for borrow_records.book_id (foreign key to books)
CREATE INDEX IF NOT EXISTS idx_borrow_records_book_id ON borrow_records(book_id);

-- Add index for fines.borrow_id (foreign key to borrow_records)
CREATE INDEX IF NOT EXISTS idx_fines_borrow_id ON fines(borrow_id);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_borrow_records_status_due_date ON borrow_records(status, due_date);
