# Library Management System - Demo Credentials

## Demo Staff Accounts

The following demo accounts have been created in the database. **Note**: You need to manually create these users in Supabase Auth for authentication to work.

### Admin Account
- **Email**: admin@library.edu
- **Password**: admin123
- **Role**: Admin (Full Access)
- **Permissions**: All CRUD operations, user management, reporting

### Librarian Accounts
1. **Linda Martinez**
   - **Email**: linda.m@library.edu
   - **Password**: librarian123
   - **Role**: Librarian
   - **Permissions**: Issue/return books, view fines, manage members and books

2. **James Brown**
   - **Email**: james.b@library.edu
   - **Password**: librarian123
   - **Role**: Librarian
   - **Permissions**: Issue/return books, view fines, manage members and books

### Assistant Accounts
1. **Patricia Garcia**
   - **Email**: patricia.g@library.edu
   - **Password**: assistant123
   - **Role**: Assistant
   - **Permissions**: View-only access to all modules

2. **David Lee**
   - **Email**: david.l@library.edu
   - **Password**: assistant123
   - **Role**: Assistant
   - **Permissions**: View-only access to all modules

## Setup Instructions

### 1. Create Auth Users in Supabase

Since Supabase authentication requires manual user creation, you need to:

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Users
3. Click "Add user" for each staff member above
4. Use the email and password provided above
5. After creating the user, note their UUID
6. Update the staff table to link the auth user:

```sql
-- Update staff records with auth user IDs
-- Replace 'USER_UUID_HERE' with actual UUID from auth.users

UPDATE staff
SET user_id = 'ADMIN_USER_UUID'
WHERE email = 'admin@library.edu';

UPDATE staff
SET user_id = 'LINDA_USER_UUID'
WHERE email = 'linda.m@library.edu';

UPDATE staff
SET user_id = 'JAMES_USER_UUID'
WHERE email = 'james.b@library.edu';

UPDATE staff
SET user_id = 'PATRICIA_USER_UUID'
WHERE email = 'patricia.g@library.edu';

UPDATE staff
SET user_id = 'DAVID_USER_UUID'
WHERE email = 'david.l@library.edu';
```

### 2. Sample Data Overview

The system includes:
- **5 Members** with various membership types (student, faculty, external)
- **5 Staff** with different roles (admin, librarian, assistant)
- **10 Books** across different categories
- **5 Borrow Records** with mixed statuses (issued, returned, overdue)
- **2 Fines** for overdue books (₹10/day)

### 3. Test Join Query

To verify the system is working correctly, run:

```sql
SELECT
  m.full_name as member_name,
  b.title as book_title,
  s.name as issued_by,
  br.status,
  br.issue_date,
  br.due_date,
  br.return_date,
  COALESCE(f.fine_amount, 0.00) as fine_amount,
  COALESCE(f.paid_status::text, 'N/A') as fine_status
FROM borrow_records br
JOIN members m ON br.member_id = m.id
JOIN books b ON br.book_id = b.id
JOIN staff s ON br.issued_by = s.id
LEFT JOIN fines f ON f.borrow_id = br.id
ORDER BY br.issue_date DESC;
```

## Features

### Role-Based Access Control

#### Admin
- ✅ Full access to all features
- ✅ Manage staff members
- ✅ View all reports and dashboards
- ✅ Manage members, books, fines

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

## Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password
- **UI Icons**: Lucide React

## Support

For issues or questions, refer to the database schema in:
- `/supabase/migrations/` - All database migrations
- `DATABASE_INFO.md` - Database structure documentation
