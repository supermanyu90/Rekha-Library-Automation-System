/*
  # Add Superadmin Role to Staff Enum

  ## Summary
  This migration adds the 'superadmin' role to the staff_role enum type.
  This must be done in a separate transaction before using the new value.

  ## Changes
  - Adds 'superadmin' to staff_role enum
  - Superadmin will have full system access to all features and data
*/

-- Add 'superadmin' to the staff_role enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'superadmin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'staff_role')
  ) THEN
    ALTER TYPE staff_role ADD VALUE 'superadmin';
  END IF;
END $$;
