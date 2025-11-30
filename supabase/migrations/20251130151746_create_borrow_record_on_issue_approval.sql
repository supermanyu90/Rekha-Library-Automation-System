/*
  # Create Borrow Record on Issue Request Approval

  ## Purpose
  Automatically create a borrow_record when an issue_request is approved.
  This ensures approved requests appear in the Borrow & Return Management tab.

  ## Workflow
  1. Member submits an issue request
  2. Staff reviews and approves the request
  3. **Trigger automatically creates a borrow_record** (this migration)
  4. Book appears in Borrow/Return tab where staff can mark as returned

  ## Changes
  1. Create function to auto-create borrow_record on approval
  2. Create trigger that fires when issue_request status changes to 'approved'
  3. Borrow record includes:
     - 14-day default due date from approval
     - Status set to 'issued'
     - Reference to the staff who approved
     - All necessary foreign keys

  ## Security
  - Function runs with SECURITY DEFINER to bypass RLS
  - Validates that status change is to 'approved'
  - Prevents duplicate borrow_records for same approval

  ## Notes
  - Only creates borrow_record on NEW approval (not if already approved)
  - Uses reviewed_by as issued_by staff member
  - Sets due_date to 14 days from approval date
*/

-- Create function to automatically create borrow_record on approval
CREATE OR REPLACE FUNCTION create_borrow_record_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_due_date timestamptz;
BEGIN
  -- Only proceed if status changed to 'approved' (and wasn't already approved)
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Calculate due date (14 days from now)
    v_due_date := NOW() + INTERVAL '14 days';
    
    -- Check if borrow_record already exists for this approval
    -- (to prevent duplicates if trigger runs multiple times)
    IF NOT EXISTS (
      SELECT 1 FROM borrow_records 
      WHERE member_id = NEW.member_id 
        AND book_id = NEW.book_id 
        AND issue_date >= NEW.reviewed_at - INTERVAL '1 minute'
        AND issue_date <= NEW.reviewed_at + INTERVAL '1 minute'
    ) THEN
      -- Create the borrow_record
      INSERT INTO borrow_records (
        member_id,
        book_id,
        issued_by,
        issue_date,
        due_date,
        status
      ) VALUES (
        NEW.member_id,
        NEW.book_id,
        NEW.reviewed_by,
        COALESCE(NEW.reviewed_at, NOW()),
        v_due_date,
        'issued'
      );
      
      RAISE NOTICE 'Created borrow_record for issue_request % (member: %, book: %)', 
        NEW.id, NEW.member_id, NEW.book_id;
    ELSE
      RAISE NOTICE 'Borrow_record already exists for this approval, skipping creation';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_borrow_record_on_approval() TO authenticated;

-- Create trigger on issue_requests table
DROP TRIGGER IF EXISTS trigger_create_borrow_on_approval ON issue_requests;

CREATE TRIGGER trigger_create_borrow_on_approval
  AFTER UPDATE ON issue_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_borrow_record_on_approval();

-- Create borrow_records for existing approved issue_requests
-- This backfills any approved requests that don't have borrow_records yet
INSERT INTO borrow_records (member_id, book_id, issued_by, issue_date, due_date, status)
SELECT 
  ir.member_id,
  ir.book_id,
  ir.reviewed_by,
  COALESCE(ir.reviewed_at, ir.created_at),
  COALESCE(ir.reviewed_at, ir.created_at) + INTERVAL '14 days',
  'issued'
FROM issue_requests ir
WHERE ir.status = 'approved'
  AND ir.reviewed_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM borrow_records br
    WHERE br.member_id = ir.member_id
      AND br.book_id = ir.book_id
      AND br.issue_date >= ir.reviewed_at - INTERVAL '1 day'
      AND br.issue_date <= ir.reviewed_at + INTERVAL '1 day'
  );
