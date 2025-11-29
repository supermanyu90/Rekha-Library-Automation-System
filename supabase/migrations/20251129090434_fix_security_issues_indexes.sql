/*
  # Fix Database Security Issues - Part 1: Indexes

  ## Changes
  1. Add missing indexes for foreign keys:
     - book_requests.reviewed_by
     - book_reservations.fulfilled_by
     - book_reviews.reviewed_by
     - onboarding_forms.member_id
     - onboarding_forms.reviewed_by
  
  2. Remove duplicate index:
     - Drop idx_fines_borrow (keeping idx_fines_borrow_id)

  ## Performance Impact
  - Improves query performance for foreign key joins
  - Reduces index maintenance overhead by removing duplicates
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_book_requests_reviewed_by 
  ON book_requests(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_book_reservations_fulfilled_by 
  ON book_reservations(fulfilled_by);

CREATE INDEX IF NOT EXISTS idx_book_reviews_reviewed_by 
  ON book_reviews(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_onboarding_forms_member_id 
  ON onboarding_forms(member_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_forms_reviewed_by 
  ON onboarding_forms(reviewed_by);

-- Remove duplicate index (keep idx_fines_borrow_id, drop idx_fines_borrow)
DROP INDEX IF EXISTS idx_fines_borrow;
