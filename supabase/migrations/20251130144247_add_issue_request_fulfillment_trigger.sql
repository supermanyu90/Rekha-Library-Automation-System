/*
  # Add Issue Request Fulfillment Trigger

  ## Purpose
  Automatically update book available_copies count when an issue request is fulfilled.
  This ensures the book inventory stays accurate when books are issued to members.

  ## Changes
  1. Create a function to handle issue request fulfillment
     - Decrements available_copies in books table when status changes to 'fulfilled'
     - Validates that copies are available before decrementing
  
  2. Create a trigger to call this function on issue_requests updates
     - Only fires when status changes to 'fulfilled'
     - Prevents decrement if already fulfilled

  ## Security
  - Function runs with proper error handling
  - Validates book exists and has available copies
  - Uses transaction safety with BEFORE trigger
*/

-- Function to handle issue request fulfillment
CREATE OR REPLACE FUNCTION handle_issue_request_fulfillment()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only process when status changes to 'fulfilled' and it wasn't already fulfilled
  IF NEW.status = 'fulfilled' AND OLD.status != 'fulfilled' THEN
    -- Check if book has available copies
    IF (SELECT available_copies FROM books WHERE id = NEW.book_id) > 0 THEN
      -- Decrement available_copies
      UPDATE books 
      SET available_copies = available_copies - 1
      WHERE id = NEW.book_id;
    ELSE
      -- Raise error if no copies available
      RAISE EXCEPTION 'Cannot fulfill issue request: No available copies of this book';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for issue_requests
DROP TRIGGER IF EXISTS trigger_issue_request_fulfillment ON issue_requests;

CREATE TRIGGER trigger_issue_request_fulfillment
  BEFORE UPDATE ON issue_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_issue_request_fulfillment();
