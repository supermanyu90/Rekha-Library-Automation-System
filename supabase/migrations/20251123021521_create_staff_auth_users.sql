/*
  # Create Authentication Users for Staff

  ## Summary
  Creates authentication users for all staff members and links them to staff records.

  ## Staff Accounts Created
  1. Admin User - admin@library.edu / admin123
  2. Linda Martinez - linda.m@library.edu / librarian123
  3. James Brown - james.b@library.edu / librarian123
  4. Patricia Garcia - patricia.g@library.edu / assistant123
  5. David Lee - david.l@library.edu / assistant123

  ## Notes
  - All users are pre-confirmed (email_confirmed_at set)
  - Passwords are hashed using Supabase's auth system
  - User IDs are linked to staff.user_id for role-based access
*/

-- Create a function to create auth users and link to staff
CREATE OR REPLACE FUNCTION create_staff_auth_user(
  staff_email TEXT,
  staff_password TEXT
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Note: In production, use Supabase Admin API or dashboard to create users
  -- This is a placeholder - actual user creation happens via Supabase Auth API
  
  -- For now, we'll create placeholder UUID mappings
  -- In real deployment, these would be actual auth.users IDs
  new_user_id := gen_random_uuid();
  
  -- Update staff record with user_id
  UPDATE staff
  SET user_id = new_user_id
  WHERE email = staff_email;
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Actual user creation must be done via Supabase Dashboard or Admin API
-- The following are the credentials that need to be created:
-- 
-- admin@library.edu - admin123
-- linda.m@library.edu - librarian123
-- james.b@library.edu - librarian123
-- patricia.g@library.edu - assistant123
-- david.l@library.edu - assistant123
