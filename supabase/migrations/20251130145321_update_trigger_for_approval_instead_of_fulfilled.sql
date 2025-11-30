/*
  # Update Issue Request Trigger to Fire on Approval

  ## Purpose
  Change the trigger to decrement book count when issue request is APPROVED (not fulfilled).
  This makes more sense as the book is reserved when approved by staff.

  ## Changes
  1. Update trigger function to fire on status change to 'approved'
  2. Book count decrements when staff approves the issue request
  3. Add logic to increment back if request is rejected after approval
  
  ## Workflow
  - When status changes from pending → approved: decrement available_copies
  - When status changes from approved → rejected: increment available_copies back
  - When status changes from approved → fulfilled: no change (already decremented)

  ## Security
  - Function bypasses RLS for system operations
  - Validation ensures book exists and has available copies
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_issue_request_fulfillment ON issue_requests;
DROP FUNCTION IF EXISTS handle_issue_request_fulfillment();

-- Create new function that handles approval
CREATE OR REPLACE FUNCTION handle_issue_request_book_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_copies INTEGER;
BEGIN
  -- Case 1: Status changes to 'approved' (decrement book count)
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get current available copies
    SELECT available_copies INTO current_copies
    FROM books 
    WHERE id = NEW.book_id;
    
    -- Check if book has available copies
    IF current_copies > 0 THEN
      -- Decrement available_copies
      UPDATE books 
      SET available_copies = available_copies - 1
      WHERE id = NEW.book_id;
      
      RAISE NOTICE 'Book % available copies decremented from % to % (approved)', NEW.book_id, current_copies, current_copies - 1;
    ELSE
      -- Raise error if no copies available
      RAISE EXCEPTION 'Cannot approve issue request: No available copies of this book (book_id: %)', NEW.book_id;
    END IF;
  END IF;
  
  -- Case 2: Status changes from 'approved' to 'rejected' (increment book count back)
  IF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    -- Increment available_copies back
    UPDATE books 
    SET available_copies = available_copies + 1
    WHERE id = NEW.book_id;
    
    RAISE NOTICE 'Book % available copies incremented back (rejected after approval)', NEW.book_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION handle_issue_request_book_count() TO authenticated;

-- Create trigger
CREATE TRIGGER trigger_issue_request_book_count
  BEFORE UPDATE ON issue_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_issue_request_book_count();
