/*
  # Remove Unused Indexes

  ## Changes
  Remove indexes that are not being used by queries to reduce:
  - Storage overhead
  - Write performance impact (indexes slow down INSERT/UPDATE/DELETE)
  - Maintenance overhead

  ## Indexes Removed
  1. idx_borrow_records_status_due_date
  2. idx_onboarding_forms_status
  3. idx_onboarding_forms_email
  4. idx_members_user_id
  5. idx_book_reservations_member_id
  6. idx_book_reservations_book_id
  7. idx_book_reservations_status
  8. idx_book_reviews_member_id
  9. idx_book_reviews_book_id
  10. idx_book_reviews_status
  11. idx_borrow_records_issued_by
  12. idx_borrow_records_member_id
  13. idx_borrow_records_book_id
  14. idx_fines_borrow_id
  15. idx_book_requests_status
  16. idx_book_requests_created_at

  ## Note
  These indexes can be recreated if query patterns change and they become needed
*/

-- Remove unused indexes from borrow_records
DROP INDEX IF EXISTS idx_borrow_records_status_due_date;
DROP INDEX IF EXISTS idx_borrow_records_issued_by;
DROP INDEX IF EXISTS idx_borrow_records_member_id;
DROP INDEX IF EXISTS idx_borrow_records_book_id;

-- Remove unused indexes from onboarding_forms
DROP INDEX IF EXISTS idx_onboarding_forms_status;
DROP INDEX IF EXISTS idx_onboarding_forms_email;

-- Remove unused indexes from members
DROP INDEX IF EXISTS idx_members_user_id;

-- Remove unused indexes from book_reservations
DROP INDEX IF EXISTS idx_book_reservations_member_id;
DROP INDEX IF EXISTS idx_book_reservations_book_id;
DROP INDEX IF EXISTS idx_book_reservations_status;

-- Remove unused indexes from book_reviews
DROP INDEX IF EXISTS idx_book_reviews_member_id;
DROP INDEX IF EXISTS idx_book_reviews_book_id;
DROP INDEX IF EXISTS idx_book_reviews_status;

-- Remove unused indexes from fines
DROP INDEX IF EXISTS idx_fines_borrow_id;

-- Remove unused indexes from book_requests
DROP INDEX IF EXISTS idx_book_requests_status;
DROP INDEX IF EXISTS idx_book_requests_created_at;
