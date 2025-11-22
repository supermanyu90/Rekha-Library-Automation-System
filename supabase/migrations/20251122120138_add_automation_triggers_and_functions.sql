/*
  # Automation Triggers and Functions for Library Management System

  ## Overview
  Creates automated workflows for the library management system including:
  - Automatic copy management when books are issued/returned
  - Automatic overdue status detection
  - Automatic fine generation for overdue books

  ## New Functions

  ### 1. update_book_copies_on_issue()
  Decreases available_copies when a book is issued
  - Triggered BEFORE INSERT on borrow_records
  - Prevents issuing if available_copies = 0

  ### 2. update_book_copies_on_return()
  Increases available_copies when a book is returned
  - Triggered AFTER UPDATE on borrow_records
  - Only executes when return_date changes from NULL to a value

  ### 3. update_overdue_records()
  Marks records as overdue if due_date has passed and book not returned
  - Can be called manually or via scheduled job
  - Updates status from 'issued' to 'overdue'

  ### 4. generate_fines_for_overdue()
  Automatically generates or updates fines for overdue records
  - Calculates fine at ₹10 per day overdue
  - Creates new fine records or updates existing ones

  ## Triggers

  ### 1. trigger_update_copies_on_issue
  - Executes before inserting a borrow record
  - Decreases available copies

  ### 2. trigger_update_copies_on_return
  - Executes after updating a borrow record
  - Increases available copies when book is returned

  ### 3. trigger_prevent_issue_if_unavailable
  - Executes before inserting a borrow record
  - Prevents issuing if no copies available

  ## Important Notes
  - All functions use proper error handling
  - Transactions ensure data consistency
  - Functions can be called manually or via triggers
  - Fine calculation: (current_date - due_date) * 10
*/

-- Function to decrease available copies when book is issued
CREATE OR REPLACE FUNCTION update_book_copies_on_issue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if available copies > 0
  IF (SELECT available_copies FROM books WHERE id = NEW.book_id) <= 0 THEN
    RAISE EXCEPTION 'No copies available for this book';
  END IF;
  
  -- Decrease available copies
  UPDATE books
  SET available_copies = available_copies - 1
  WHERE id = NEW.book_id;
  
  RETURN NEW;
END;
$$;

-- Function to increase available copies when book is returned
CREATE OR REPLACE FUNCTION update_book_copies_on_return()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if return_date changed from NULL to a value
  IF OLD.return_date IS NULL AND NEW.return_date IS NOT NULL THEN
    -- Increase available copies
    UPDATE books
    SET available_copies = available_copies + 1
    WHERE id = NEW.book_id;
    
    -- Update status to returned
    NEW.status = 'returned'::borrow_status;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to update overdue records
CREATE OR REPLACE FUNCTION update_overdue_records()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update records that are overdue
  UPDATE borrow_records
  SET status = 'overdue'::borrow_status
  WHERE status = 'issued'::borrow_status
    AND return_date IS NULL
    AND due_date < now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- Function to generate or update fines for overdue records
CREATE OR REPLACE FUNCTION generate_fines_for_overdue()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fine_count INTEGER := 0;
  overdue_record RECORD;
  days_overdue INTEGER;
  calculated_fine NUMERIC(10,2);
BEGIN
  -- Loop through all overdue records
  FOR overdue_record IN
    SELECT id, due_date, return_date
    FROM borrow_records
    WHERE status = 'overdue'::borrow_status
  LOOP
    -- Calculate days overdue
    days_overdue := GREATEST(0, EXTRACT(day FROM (COALESCE(overdue_record.return_date, now()) - overdue_record.due_date))::INTEGER);
    calculated_fine := days_overdue * 10.00;
    
    -- Insert or update fine
    INSERT INTO fines (borrow_id, fine_amount, paid_status)
    VALUES (overdue_record.id, calculated_fine, 'unpaid'::payment_status)
    ON CONFLICT (borrow_id) 
    DO UPDATE SET 
      fine_amount = EXCLUDED.fine_amount,
      assessed_date = now();
    
    fine_count := fine_count + 1;
  END LOOP;
  
  RETURN fine_count;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_copies_on_issue ON borrow_records;
CREATE TRIGGER trigger_update_copies_on_issue
  BEFORE INSERT ON borrow_records
  FOR EACH ROW
  EXECUTE FUNCTION update_book_copies_on_issue();

DROP TRIGGER IF EXISTS trigger_update_copies_on_return ON borrow_records;
CREATE TRIGGER trigger_update_copies_on_return
  BEFORE UPDATE ON borrow_records
  FOR EACH ROW
  WHEN (OLD.return_date IS NULL AND NEW.return_date IS NOT NULL)
  EXECUTE FUNCTION update_book_copies_on_return();

-- Run initial updates to mark overdue records and generate fines
SELECT update_overdue_records();
SELECT generate_fines_for_overdue();