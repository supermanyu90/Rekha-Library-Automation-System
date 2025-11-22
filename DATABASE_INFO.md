# Database Information

## Database Status
The application uses a **persistent Supabase database** that is already configured and running. The database is hosted in the cloud and will not be lost when the application is reloaded.

## Database Connection
The database connection details are stored in the `.env` file:
- `VITE_SUPABASE_URL`: The Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: The public API key for client-side access

## Database Schema

### Tables Created:
1. **profiles** - User profiles with role-based access control
2. **books** - Library book catalog
3. **book_requests** - Book borrowing requests and tracking

### Functions Created:
1. **handle_new_user()** - Automatically creates profile when user signs up
2. **reset_user_password()** - Allows superadmins to reset user passwords
3. **confirm_user_email()** - Allows head librarians to confirm user emails
4. **increment()** - Atomically increments available book copies on return

## Test Accounts

The following test accounts have been pre-created in the database:

### Superadmin Account
- **Email:** `superadmin@library.com`
- **Password:** `superadmin123`
- **Permissions:**
  - Full system access
  - Manage all users and change roles
  - Reset user passwords
  - Add/remove books
  - Approve/reject book requests
  - View all data

### Admin Account
- **Email:** `admin@library.com`
- **Password:** `admin123`
- **Permissions:**
  - Manage books
  - Approve/reject book requests
  - View all data

### Head Librarian Account
- **Email:** `headlibrarian@library.com`
- **Password:** `headlib123`
- **Permissions:**
  - Create new member accounts
  - Approve/reject book requests
  - Issue books to members
  - Manage book returns
  - Add/remove books

### Librarian Account
- **Email:** `librarian@library.com`
- **Password:** `librarian123`
- **Permissions:**
  - Issue books to members
  - Manage book returns
  - Update book information
  - Add/remove books

## Sample Books in Database

The following books have been pre-loaded:
1. The Great Gatsby by F. Scott Fitzgerald (3 copies)
2. To Kill a Mockingbird by Harper Lee (5 copies)
3. 1984 by George Orwell (4 copies)
4. Pride and Prejudice by Jane Austen (2 copies)
5. The Catcher in the Rye by J.D. Salinger (3 copies)

## Database Migrations

All database migrations are stored in `supabase/migrations/` directory:
- `create_library_schema.sql` - Creates all tables and RLS policies
- `add_auto_create_profile_trigger.sql` - Auto-creates profiles on signup
- `add_reset_user_password_function.sql` - Password reset functionality
- `add_confirm_user_email_function.sql` - Email confirmation functionality
- `add_increment_function.sql` - Book copy increment functionality

## Important Notes

1. **Database Persistence:** The Supabase database is persistent and hosted in the cloud. Data will remain even if you redeploy the application.

2. **No Re-initialization Needed:** When you load the application from GitHub, the database is already set up and populated with test data.

3. **Environment Variables:** Make sure the `.env` file is properly configured with the Supabase credentials.

4. **Row Level Security:** All tables have RLS enabled with role-based policies to ensure data security.

5. **Test Account Usage:** Use the test accounts above to explore different permission levels in the system.

## Getting Started

1. Clone the repository from GitHub
2. Ensure `.env` file has the correct Supabase credentials
3. Run `npm install` to install dependencies
4. The database is already configured and ready to use
5. Sign in with any of the test accounts listed above

## User Roles Hierarchy

- **Superadmin** - Highest level, can do everything
- **Admin** - Can manage books and approve requests
- **Head Librarian** - Can create members and approve requests
- **Librarian** - Can issue books and manage returns
- **Member** - Can browse books and request to borrow them
