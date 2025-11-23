# Library Management System - Staff Credentials

## PERMANENT PRODUCTION USERS (Always Available)

### Rekha Superadmin
- **Email:** superadmin@rekha.library
- **Password:** SuperAdmin@2025
- **Role:** Superadmin
- **Access:** Full system access - all operations, can manage everything
- **Purpose:** Master administrator account for system management

### Rekha Admin
- **Email:** admin@rekha.library
- **Password:** Admin@2025
- **Role:** Admin
- **Access:** Manage books, members, borrowing, fines, and staff
- **Purpose:** Primary administrator for day-to-day operations

### Rekha Librarian
- **Email:** librarian@rekha.library
- **Password:** Librarian@2025
- **Role:** Librarian
- **Access:** Manage books, borrowing, and fines
- **Purpose:** Library operations and book management

---

## DEMO/TEST USERS (Optional)

### Admin User
- **Email:** admin@library.edu
- **Password:** admin123
- **Role:** Admin
- **Access:** Full system access - can manage all features including staff management

### Linda Martinez
- **Email:** linda.m@library.edu
- **Password:** librarian123
- **Role:** Librarian
- **Access:** Can manage books, members, borrowing, and fines

### James Brown
- **Email:** james.b@library.edu
- **Password:** librarian123
- **Role:** Librarian
- **Access:** Can manage books, members, borrowing, and fines

### Patricia Garcia
- **Email:** patricia.g@library.edu
- **Password:** assistant123
- **Role:** Assistant
- **Access:** Read-only access to view books, members, and transactions

### David Lee
- **Email:** david.l@library.edu
- **Password:** assistant123
- **Role:** Assistant
- **Access:** Read-only access to view books, members, and transactions

---

## Role Permissions Overview

| Role        | View Data | Add Books | Add Users | Manage Borrowing | Manage Fines | Manage Staff |
|-------------|-----------|-----------|-----------|------------------|--------------|--------------|
| Superadmin  | ✓         | ✓         | ✓         | ✓                | ✓            | ✓            |
| Admin       | ✓         | ✓         | ✓         | ✓                | ✓            | ✓            |
| Librarian   | ✓         | ✓         | ✓         | ✓                | ✓            | ✗            |
| Assistant   | ✓         | ✗         | ✗         | ✗                | ✗            | ✗            |

---

## Setup Instructions

### Creating Auth Users in Supabase

**IMPORTANT:** The three permanent production users MUST be created for the live product.

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. For each user above:
   - Enter the email address
   - Enter the password
   - **CHECK** "Auto Confirm User" ✓
   - Click "Create user"
4. Copy the user's UUID from the created user details
5. Link to staff record using SQL Editor:

```sql
-- Link Rekha Superadmin (REQUIRED FOR PRODUCTION)
UPDATE staff SET user_id = 'PASTE_SUPERADMIN_UUID_HERE' WHERE email = 'superadmin@rekha.library';

-- Link Rekha Admin (REQUIRED FOR PRODUCTION)
UPDATE staff SET user_id = 'PASTE_ADMIN_UUID_HERE' WHERE email = 'admin@rekha.library';

-- Link Rekha Librarian (REQUIRED FOR PRODUCTION)
UPDATE staff SET user_id = 'PASTE_LIBRARIAN_UUID_HERE' WHERE email = 'librarian@rekha.library';

-- Optional: Link Demo Users
UPDATE staff SET user_id = 'PASTE_UUID_HERE' WHERE email = 'admin@library.edu';
UPDATE staff SET user_id = 'PASTE_UUID_HERE' WHERE email = 'linda.m@library.edu';
UPDATE staff SET user_id = 'PASTE_UUID_HERE' WHERE email = 'james.b@library.edu';
UPDATE staff SET user_id = 'PASTE_UUID_HERE' WHERE email = 'patricia.g@library.edu';
UPDATE staff SET user_id = 'PASTE_UUID_HERE' WHERE email = 'david.l@library.edu';
```

### Verify Setup

Run this query to check all users are properly linked:

```sql
SELECT * FROM staff_with_permissions;
```

All users should show "Active ✓" status after linking.

---

## Features

### Role-Based Access Control

#### Superadmin
- ✅ Full system access to all features and data
- ✅ Manage all staff members including admins
- ✅ Access to all system settings
- ✅ Delete and modify any records
- ✅ View all reports and analytics

#### Admin
- ✅ Full access to library operations
- ✅ Manage staff members (except superadmins)
- ✅ View all reports and dashboards
- ✅ Manage members, books, fines
- ✅ Issue and return books

#### Librarian
- ✅ Issue and return books
- ✅ Manage members and books
- ✅ View and manage fines
- ✅ View overdue list
- ❌ Cannot manage staff

#### Assistant
- ✅ View members, books, borrow records
- ✅ View fines and overdue list
- ❌ Cannot modify any data

### Automated Workflows

1. **Book Copy Management**
   - Automatically decreases `available_copies` when a book is issued
   - Automatically increases `available_copies` when a book is returned
   - Prevents issuing if `available_copies = 0`

2. **Overdue Detection**
   - Automatically marks records as overdue when `due_date < now()` and book not returned
   - Run manually or via scheduled job using: `SELECT update_overdue_records();`

3. **Fine Generation**
   - Automatically generates fines at ₹10/day for overdue books
   - Run manually using: `SELECT generate_fines_for_overdue();`

### Barcode Scanning

Books support ISBN/barcode field for scanning. Use the ISBN field in the Books module to add barcodes.

---

## Sample Data Overview

The system includes:
- **8 Staff Members** (3 permanent production users + 5 demo users)
- **5 Members** with various membership types (student, faculty, external)
- **10 Books** across different categories
- **5 Borrow Records** with mixed statuses (issued, returned, overdue)
- **2 Fines** for overdue books (₹10/day)

---

## Security Notes

**CRITICAL:**
- The three permanent production users (superadmin@rekha.library, admin@rekha.library, librarian@rekha.library) **MUST** exist in the live product
- Change all passwords immediately after deployment to production
- Use strong, unique passwords (minimum 12 characters with uppercase, lowercase, numbers, and symbols)
- Superadmin account should be used ONLY for critical system management
- Never share superadmin credentials
- Regularly audit user access and permissions
- Enable MFA (Multi-Factor Authentication) for superadmin and admin accounts in production

---

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password
- **UI Icons**: Lucide React
- **Build Tool**: Vite

---

## Support

For issues or questions, refer to:
- `/supabase/migrations/` - All database migrations
- `DATABASE_INFO.md` - Database structure documentation
- `SETUP_AUTH.md` - Detailed authentication setup guide
