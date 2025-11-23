# Setting Up Authentication for Staff Members

## Overview

You need to create authentication users in Supabase for each staff member so they can log in to the Library Management System.

## Step-by-Step Instructions

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard at: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Users** in the left sidebar

### Step 2: Create Users for Each Staff Member

For each staff member in the table below, create a new user:

| Name            | Email                    | Password      | Role       |
|-----------------|--------------------------|---------------|------------|
| Admin User      | admin@library.edu        | admin123      | admin      |
| Linda Martinez  | linda.m@library.edu      | librarian123  | librarian  |
| James Brown     | james.b@library.edu      | librarian123  | librarian  |
| Patricia Garcia | patricia.g@library.edu   | assistant123  | assistant  |
| David Lee       | david.l@library.edu      | assistant123  | assistant  |

#### For Each User:

1. Click the **"Add user"** button (green button in top right)
2. Click **"Create new user"**
3. Fill in the form:
   - **Email**: Enter the email from the table above
   - **Password**: Enter the password from the table above
   - **Auto Confirm User**: ✅ **CHECK THIS BOX** (very important!)
4. Click **"Create user"**
5. After creation, you'll see the user in the list
6. **IMPORTANT**: Click on the user to view their details and **copy their UUID** (you'll need this in Step 3)

### Step 3: Link Auth Users to Staff Records

After creating all 5 users, you need to link them to the staff records in the database.

#### Option A: Using SQL Editor (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New query"**
3. Copy and paste the following SQL (replace the UUIDs with actual values from Step 2):

```sql
-- Link admin@library.edu
UPDATE staff
SET user_id = 'PASTE_ADMIN_USER_UUID_HERE'
WHERE email = 'admin@library.edu';

-- Link linda.m@library.edu
UPDATE staff
SET user_id = 'PASTE_LINDA_USER_UUID_HERE'
WHERE email = 'linda.m@library.edu';

-- Link james.b@library.edu
UPDATE staff
SET user_id = 'PASTE_JAMES_USER_UUID_HERE'
WHERE email = 'james.b@library.edu';

-- Link patricia.g@library.edu
UPDATE staff
SET user_id = 'PASTE_PATRICIA_USER_UUID_HERE'
WHERE email = 'patricia.g@library.edu';

-- Link david.l@library.edu
UPDATE staff
SET user_id = 'PASTE_DAVID_USER_UUID_HERE'
WHERE email = 'david.l@library.edu';
```

4. Click **"Run"** to execute the query

### Step 4: Verify Setup

Run this query in the SQL Editor to verify all users are linked:

```sql
SELECT * FROM staff_auth_status;
```

You should see all staff members with **"Linked ✓"** status.

## Alternative Method: Using Edge Function

If you prefer to automate this process, you can use the deployed edge function:

```bash
# For each staff member, make a POST request:
curl -X POST \
  'https://YOUR_SUPABASE_URL/functions/v1/create-staff-user' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@library.edu",
    "password": "admin123",
    "staffId": 1
  }'
```

Replace `YOUR_SUPABASE_URL` and `YOUR_ANON_KEY` with values from your `.env` file.

## Troubleshooting

### Issue: Can't log in after creating users
- **Solution**: Make sure you checked "Auto Confirm User" when creating each user
- If you forgot, go to Authentication → Users, click the user, and manually confirm their email

### Issue: "No staff record found" error
- **Solution**: Verify you ran the UPDATE queries in Step 3 with the correct UUIDs

### Issue: Wrong permissions/role
- **Solution**: Check that the email matches exactly and the user_id is correctly linked

## Verification

To test the system:

1. Go to your application URL
2. Try logging in with any of the credentials from the table above
3. Verify you can access the appropriate features based on the role:
   - **Admin**: Can access all tabs including Staff management
   - **Librarian**: Can access all tabs except Staff
   - **Assistant**: Can only view data, no edit/delete buttons

## Quick Reference

### Check Auth Status
```sql
SELECT * FROM staff_auth_status;
```

### View All Staff Records
```sql
SELECT id, name, email, role, user_id FROM staff;
```

### Re-link a User (if UUID changed)
```sql
UPDATE staff
SET user_id = 'NEW_UUID_HERE'
WHERE email = 'staff_email@library.edu';
```

## Need Help?

If you encounter issues:
1. Check that all 5 users were created in Supabase Auth
2. Verify each user is confirmed (Auto Confirm User was checked)
3. Ensure the UPDATE queries were run with correct UUIDs
4. Check the browser console for any error messages
