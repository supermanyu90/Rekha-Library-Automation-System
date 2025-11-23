/*
  # Setup Authentication Users for Staff

  ## Summary
  This migration creates a helper function to link staff records with Supabase auth users.
  Since auth user creation requires admin privileges, this must be done via Supabase Dashboard
  or the edge function.

  ## Instructions
  After running this migration, use ONE of these methods to create auth users:

  ### Method 1: Using Supabase Dashboard (Recommended)
  1. Go to Supabase Dashboard → Authentication → Users
  2. Click "Add user" → Create new user
  3. For each staff member, enter:
     - Email: (from list below)
     - Password: (from list below)
     - Auto Confirm User: YES (check this box)
  4. After creating each user, copy their UUID
  5. Run the UPDATE query below with the actual UUIDs

  ### Method 2: Using the create-staff-user Edge Function
  Make a POST request to your edge function endpoint for each staff member.

  ## Staff Accounts to Create

  | Name            | Email                    | Password      | Role       |
  |-----------------|--------------------------|---------------|------------|
  | Admin User      | admin@library.edu        | admin123      | admin      |
  | Linda Martinez  | linda.m@library.edu      | librarian123  | librarian  |
  | James Brown     | james.b@library.edu      | librarian123  | librarian  |
  | Patricia Garcia | patricia.g@library.edu   | assistant123  | assistant  |
  | David Lee       | david.l@library.edu      | assistant123  | assistant  |

  ## After Creating Users in Dashboard

  Run these UPDATE statements (replace UUIDs with actual values):

  ```sql
  -- Get staff IDs first
  SELECT id, name, email FROM staff;

  -- Then update with auth user IDs
  UPDATE staff SET user_id = 'PASTE_ADMIN_UUID_HERE' WHERE email = 'admin@library.edu';
  UPDATE staff SET user_id = 'PASTE_LINDA_UUID_HERE' WHERE email = 'linda.m@library.edu';
  UPDATE staff SET user_id = 'PASTE_JAMES_UUID_HERE' WHERE email = 'james.b@library.edu';
  UPDATE staff SET user_id = 'PASTE_PATRICIA_UUID_HERE' WHERE email = 'patricia.g@library.edu';
  UPDATE staff SET user_id = 'PASTE_DAVID_UUID_HERE' WHERE email = 'david.l@library.edu';
  ```

  ## Verification Query

  After linking users, verify with:
  ```sql
  SELECT s.id, s.name, s.email, s.role, s.user_id, 
         CASE WHEN s.user_id IS NOT NULL THEN 'Linked' ELSE 'Not Linked' END as status
  FROM staff s;
  ```
*/

-- Helper function to check if staff auth is configured
CREATE OR REPLACE FUNCTION check_staff_auth_status()
RETURNS TABLE(
  staff_id INTEGER,
  staff_name TEXT,
  staff_email TEXT,
  staff_role TEXT,
  has_auth_user BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.email,
    s.role::TEXT,
    (s.user_id IS NOT NULL) as has_auth_user
  FROM staff s
  ORDER BY s.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view to easily see staff auth status
CREATE OR REPLACE VIEW staff_auth_status AS
SELECT 
  s.id,
  s.name,
  s.email,
  s.role,
  s.user_id,
  CASE 
    WHEN s.user_id IS NOT NULL THEN 'Linked ✓'
    ELSE 'Not Linked ✗'
  END as auth_status
FROM staff s
ORDER BY s.id;

-- Grant access to the view
GRANT SELECT ON staff_auth_status TO authenticated;
