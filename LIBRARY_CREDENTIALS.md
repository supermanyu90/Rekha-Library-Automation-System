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

### Automatic Setup (RECOMMENDED)

The easiest way to create all permanent admin users is to use the automated setup function:

1. Make a POST request to the setup endpoint:

```bash
curl -X POST https://YOUR_PROJECT_URL.supabase.co/functions/v1/setup-admin-users \
  -H "Content-Type: application/json"
```

Or visit this URL in your browser:
```
https://YOUR_PROJECT_URL.supabase.co/functions/v1/setup-admin-users
```

This will automatically:
- Create all three permanent admin auth users
- Link them to their staff records
- Set up all passwords and permissions

The function will return a status report showing which users were created successfully.

### Manual Setup (Alternative Method)

If you need to create users manually:

1. Use the existing edge function to create individual users:

```bash
curl -X POST https://YOUR_PROJECT_URL.supabase.co/functions/v1/create-staff-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "superadmin@rekha.library",
    "password": "SuperAdmin@2025",
    "staffId": 6
  }'
```

Replace `staffId` with the appropriate staff ID from the database.

### Verify Setup

Run this query to check all users are properly linked:

```sql
SELECT * FROM staff_with_permissions;
```

All permanent production users should show "Active ✓" status after setup.

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
