/*
  # Fix Onboarding Forms RLS - Allow All Anonymous Inserts

  ## Changes
  - Drop existing restrictive INSERT policy
  - Create a fully permissive INSERT policy that allows any insert
  - This allows anonymous users to submit membership applications

  ## Security
  - Allows any user to insert into onboarding_forms
  - No restrictions on the insert to ensure form submissions work
  - SELECT, UPDATE, DELETE policies remain restrictive for staff only
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow anonymous onboarding form submission" ON onboarding_forms;

-- Create a completely permissive INSERT policy
CREATE POLICY "Allow all inserts to onboarding forms"
  ON onboarding_forms
  FOR INSERT
  TO public
  WITH CHECK (true);
