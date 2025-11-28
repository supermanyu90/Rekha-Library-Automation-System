/*
  # Create Onboarding Forms Table

  ## Description
  Creates a table for membership onboarding requests. Potential members can submit forms
  which librarians, admins, and superadmins can approve or reject.

  ## New Tables
  - `onboarding_forms`
    - `id` (serial, primary key) - Unique identifier
    - `full_name` (text, required) - Applicant's full name
    - `email` (text, required, unique) - Applicant's email
    - `phone` (text, optional) - Applicant's phone number
    - `address` (text, optional) - Applicant's address
    - `membership_type` (membership_type, default 'student') - Type of membership requested
    - `reason` (text, optional) - Reason for joining
    - `status` (onboarding_status, default 'pending') - Application status
    - `reviewed_by` (integer, optional) - Staff member who reviewed
    - `reviewed_at` (timestamptz, optional) - When reviewed
    - `review_notes` (text, optional) - Notes from reviewer
    - `member_id` (integer, optional) - Created member ID after approval
    - `created_at` (timestamptz, default now()) - When submitted

  ## Enums
  - `onboarding_status`: pending, approved, rejected

  ## Security
  - Enable RLS on onboarding_forms table
  - Allow anyone (including anonymous users) to insert forms
  - Only authenticated staff can view all forms
  - Only superadmin, admin, and librarian can update forms

  ## Indexes
  - Index on status for filtering
  - Index on email for lookup
*/

-- Create onboarding_status enum
DO $$ BEGIN
  CREATE TYPE onboarding_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create onboarding_forms table
CREATE TABLE IF NOT EXISTS onboarding_forms (
  id serial PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  address text,
  membership_type membership_type DEFAULT 'student' NOT NULL,
  reason text,
  status onboarding_status DEFAULT 'pending' NOT NULL,
  reviewed_by integer REFERENCES staff(id),
  reviewed_at timestamptz,
  review_notes text,
  member_id integer REFERENCES members(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_forms_status ON onboarding_forms(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_forms_email ON onboarding_forms(email);

-- Enable RLS
ALTER TABLE onboarding_forms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit onboarding forms
CREATE POLICY "Anyone can submit onboarding forms"
  ON onboarding_forms FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated staff can view onboarding forms
CREATE POLICY "Staff can view all onboarding forms"
  ON onboarding_forms FOR SELECT
  TO authenticated
  USING (
    (SELECT has_access FROM public.check_staff_access(auth.uid()))
  );

-- Only superadmin, admin, and librarian can update onboarding forms
CREATE POLICY "Superadmin, admin, and librarian can update onboarding forms"
  ON onboarding_forms FOR UPDATE
  TO authenticated
  USING (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin', 'librarian')
  )
  WITH CHECK (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin', 'librarian')
  );

-- Only superadmin and admin can delete onboarding forms
CREATE POLICY "Superadmin and admin can delete onboarding forms"
  ON onboarding_forms FOR DELETE
  TO authenticated
  USING (
    (SELECT user_role FROM public.check_staff_access(auth.uid())) IN ('superadmin', 'admin')
  );
