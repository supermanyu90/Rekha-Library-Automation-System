/*
  # Add Public Membership Type

  ## Changes
  - Add 'public' value to membership_type enum
  - This allows members to sign up with public membership type

  ## Notes
  - Existing 'external' type remains valid
  - 'public' is an alias for external members
*/

-- Add 'public' value to membership_type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'public' AND enumtypid = 'membership_type'::regtype) THEN
    EXECUTE 'ALTER TYPE membership_type ADD VALUE ''public''';
  END IF;
END $$;
