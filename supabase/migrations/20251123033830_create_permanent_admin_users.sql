/*
  # Create Permanent Admin Users for Production

  ## Summary
  This migration creates three permanent administrative users that will be available
  in the live product. These are system accounts that should always exist.

  ## New Staff Accounts

  | Name             | Email                        | Role        | Purpose                           |
  |------------------|------------------------------|-------------|-----------------------------------|
  | Rekha Superadmin | superadmin@rekha.library     | superadmin  | Full system access                |
  | Rekha Admin      | admin@rekha.library          | admin       | Manage books, members, staff      |
  | Rekha Librarian  | librarian@rekha.library      | librarian   | Manage books and borrowing        |

  ## Passwords (to be set during auth user creation)
  - superadmin@rekha.library: SuperAdmin@2025
  - admin@rekha.library: Admin@2025
  - librarian@rekha.library: Librarian@2025

  ## Role Permissions
  - **superadmin**: Full system access, can manage all users and data
  - **admin**: Can manage books, members, borrowing, fines, and staff
  - **librarian**: Can manage books, borrowing, and fines

  ## Next Steps
  After this migration, you need to:
  1. Create auth users in Supabase Dashboard for each email above
  2. Use the provided passwords
  3. Link the auth user IDs to the staff records
*/

-- Insert permanent admin staff records (if they don't exist)
INSERT INTO staff (name, role, email, user_id)
VALUES
  ('Rekha Superadmin', 'superadmin', 'superadmin@rekha.library', NULL),
  ('Rekha Admin', 'admin', 'admin@rekha.library', NULL),
  ('Rekha Librarian', 'librarian', 'librarian@rekha.library', NULL)
ON CONFLICT (email) DO NOTHING;
