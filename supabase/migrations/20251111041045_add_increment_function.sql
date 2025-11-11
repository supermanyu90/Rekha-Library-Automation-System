-- Add function to increment available book copies
-- Used when returning books to increment available_copies atomically
-- Function runs with security definer privileges

CREATE OR REPLACE FUNCTION increment(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE books
  SET available_copies = available_copies + 1
  WHERE id = row_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment(uuid) TO authenticated;