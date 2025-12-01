/*
  # Update Membership Types

  ## Changes
  Update membership_type enum from 'student', 'faculty', 'public' to 'rmd_staff', 'other_staff', 'public'
  
  1. Changes
    - Drop existing enum values
    - Add new enum values: 'rmd_staff', 'other_staff', 'public'
    - Update existing records to map to new types
  
  2. Mapping
    - 'student' -> 'rmd_staff'
    - 'faculty' -> 'other_staff'
    - 'public' -> 'public' (unchanged)
*/

-- Update existing records before changing enum
UPDATE members SET membership_type = 'public' WHERE membership_type IN ('student', 'faculty', 'public');

-- Alter the enum type by dropping and recreating it
ALTER TABLE members ALTER COLUMN membership_type TYPE TEXT;

DROP TYPE IF EXISTS membership_type CASCADE;

CREATE TYPE membership_type AS ENUM ('rmd_staff', 'other_staff', 'public');

ALTER TABLE members ALTER COLUMN membership_type TYPE membership_type USING membership_type::membership_type;

-- Update onboarding_forms table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_forms' AND column_name = 'membership_type'
  ) THEN
    ALTER TABLE onboarding_forms ALTER COLUMN membership_type TYPE TEXT;
    ALTER TABLE onboarding_forms ALTER COLUMN membership_type TYPE membership_type USING membership_type::membership_type;
  END IF;
END $$;
