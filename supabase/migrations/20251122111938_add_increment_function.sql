/*
  # Add Increment Function

  1. Changes
    - Creates function to atomically increment available book copies
    - Used when books are returned to the library
    - Prevents race conditions in concurrent updates

  2. Security
    - Function runs with SECURITY DEFINER privileges
    - Grants execute permission to authenticated users
*/

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