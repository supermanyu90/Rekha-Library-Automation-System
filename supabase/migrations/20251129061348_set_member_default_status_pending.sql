/*
  # Set Member Default Status to Pending

  ## Changes
  - Update default status for members table to 'pending'
  - This ensures new member sign-ups start in pending state awaiting approval

  ## Notes
  - Existing members will keep their current status
*/

-- Update default status for new members to pending
ALTER TABLE members ALTER COLUMN status SET DEFAULT 'pending'::member_status;
