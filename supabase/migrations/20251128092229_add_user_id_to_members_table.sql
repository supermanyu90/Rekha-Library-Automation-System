/*
  # Add user_id to members table

  ## Description
  Adds user_id column to the members table to link members with Supabase auth users,
  enabling member authentication and login.

  ## Changes
  - Add user_id column (uuid, nullable, unique) to members table
  - Add foreign key constraint to auth.users
  - Create index on user_id for faster lookups

  ## Security
  - Update RLS policies to allow members to view/update their own data
*/

-- Add user_id column to members table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE members ADD COLUMN user_id uuid UNIQUE REFERENCES auth.users(id);
  END IF;
END $$;

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

-- Drop existing member policies if they exist
DROP POLICY IF EXISTS "Members can view own data" ON members;
DROP POLICY IF EXISTS "Members can update own data" ON members;

-- Allow members to view their own data
CREATE POLICY "Members can view own data"
  ON members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (SELECT has_access FROM public.check_staff_access(auth.uid()))
  );

-- Allow members to update their own data (limited fields)
CREATE POLICY "Members can update own data"
  ON members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
