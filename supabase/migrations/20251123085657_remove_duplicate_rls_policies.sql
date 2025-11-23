/*
  # Remove Duplicate RLS Policies

  ## Summary
  This migration removes duplicate and overlapping RLS policies that cause the
  "Multiple Permissive Policies" warning. We'll keep only the necessary policies
  and remove redundant ones.

  ## Changes
  - Remove old role-specific policies (Admin full access, Librarian full access, etc.)
  - Keep only the consolidated role-based policies
  - This eliminates policy conflicts and improves performance

  ## Impact
  - Cleaner policy structure
  - Easier to maintain and audit
  - Better performance due to fewer policy evaluations
*/

-- =============================================================================
-- BOOKS TABLE - Remove duplicate policies
-- =============================================================================

DROP POLICY IF EXISTS "Admin full access to books" ON books;
DROP POLICY IF EXISTS "Librarian full access to books" ON books;
DROP POLICY IF EXISTS "Assistant read-only access to books" ON books;

-- =============================================================================
-- MEMBERS TABLE - Remove duplicate policies
-- =============================================================================

DROP POLICY IF EXISTS "Admin full access to members" ON members;
DROP POLICY IF EXISTS "Librarian full access to members" ON members;
DROP POLICY IF EXISTS "Assistant read-only access to members" ON members;

-- =============================================================================
-- STAFF TABLE - Remove duplicate policies
-- =============================================================================

DROP POLICY IF EXISTS "Admin full access to staff" ON staff;
DROP POLICY IF EXISTS "Librarian and Assistant read staff" ON staff;

-- =============================================================================
-- BORROW_RECORDS TABLE - Remove duplicate policies
-- =============================================================================

DROP POLICY IF EXISTS "Admin full access to borrow_records" ON borrow_records;
DROP POLICY IF EXISTS "Librarian full access to borrow_records" ON borrow_records;
DROP POLICY IF EXISTS "Assistant read-only access to borrow_records" ON borrow_records;

-- =============================================================================
-- FINES TABLE - Remove duplicate policies
-- =============================================================================

DROP POLICY IF EXISTS "Admin full access to fines" ON fines;
DROP POLICY IF EXISTS "Librarian full access to fines" ON fines;
DROP POLICY IF EXISTS "Assistant read-only access to fines" ON fines;
