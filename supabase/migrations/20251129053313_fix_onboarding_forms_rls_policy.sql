/*
  # Fix Onboarding Forms RLS Policy for Anonymous Users

  ## Changes
  - Drop existing INSERT policy that may be causing issues
  - Create a simpler, more permissive INSERT policy for anonymous users
  - Ensure anonymous users can submit onboarding forms without authentication

  ## Security
  - Allows any user (authenticated or anonymous) to insert into onboarding_forms
  - Only allows inserting with status='pending' to prevent privilege escalation
  - Other policies for SELECT, UPDATE, DELETE remain restrictive
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Anyone can submit onboarding forms" ON onboarding_forms;

-- Create a new, simpler INSERT policy for anonymous users
CREATE POLICY "Allow anonymous onboarding form submission"
  ON onboarding_forms
  FOR INSERT
  WITH CHECK (
    status = 'pending' AND
    reviewed_by IS NULL AND
    reviewed_at IS NULL AND
    member_id IS NULL
  );
