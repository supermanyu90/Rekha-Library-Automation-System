/*
  # Update Member Status Enum

  ## Changes
  - Add 'pending' and 'suspended' values to member_status enum
  - These values are needed for the member approval workflow

  ## Notes
  - Default will be updated in a separate transaction
  - Existing members will keep their current status
*/

-- Add new values to member_status enum (must be in separate transaction)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending' AND enumtypid = 'member_status'::regtype) THEN
    EXECUTE 'ALTER TYPE member_status ADD VALUE ''pending''';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'suspended' AND enumtypid = 'member_status'::regtype) THEN
    EXECUTE 'ALTER TYPE member_status ADD VALUE ''suspended''';
  END IF;
END $$;
