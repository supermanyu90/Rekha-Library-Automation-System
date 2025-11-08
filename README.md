# Rekha - Library Automation System for Risk Management Department

A comprehensive full-stack library automation platform built with React, TypeScript, Supabase, and Tailwind CSS.

## Features

### Role-Based Access Control
- **Superadmin**: Full system control, user role management
- **Admin**: User management, system settings, activity logs
- **Head Librarian**: Book management, bulk CSV upload, reservation approval
- **Librarian**: Add/edit books, handle reservations, moderate reviews
- **Member**: Browse books, reserve books, write reviews, request books

### Core Functionality
- **Book Management**: Add, edit, delete books with metadata
- **Media Support**: Physical books, e-books (PDF), and audiobooks (MP3)
- **CSV Bulk Upload**: Import multiple books at once via CSV file
- **Reservation System**: Request books with approval workflow
- **Review System**: Rate and review books with moderation
- **Book Requests**: Members can request books not in the collection
- **Activity Logging**: Track all system activities for auditing
- **Search & Filter**: Advanced search by title, author, category, and media type

### User Experience
- Clean, soothing professional interface with teal color scheme
- Responsive design for all devices
- Real-time updates and notifications
- Dashboard with statistics and insights

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Authentication, Row Level Security)
- **State Management**: React Context API

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (already configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env`:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Database Schema

### Tables
- **profiles**: User profiles with roles and preferences
- **books**: Book catalog with metadata and availability
- **reservations**: Book reservation requests and tracking
- **reviews**: User reviews and ratings
- **requests**: Book acquisition requests from members
- **activity_logs**: System activity audit trail
- **settings**: System configuration

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based policies for data access
- Secure authentication flow

## CSV Upload Format

For bulk book uploads, use a CSV file with these columns:

```csv
title,subtitle,authors,isbn,language,description,categories,total_copies,available_copies
The Great Gatsby,A Classic Novel,F. Scott Fitzgerald,978-0743273565,English,A story of wealth and tragedy,Fiction;Classic,3,3
```

**Column Specifications**:
- `title` (required): Book title
- `subtitle` (optional): Book subtitle
- `authors` (required): Author names (semicolon-separated for multiple)
- `isbn` (optional): ISBN number
- `language` (optional): Language (defaults to English)
- `description` (optional): Book description
- `categories` (optional): Categories (semicolon-separated)
- `total_copies` (optional): Total copies available (defaults to 1)
- `available_copies` (optional): Currently available copies (defaults to 1)

## User Roles & Permissions

### Superadmin
- Assign/revoke user roles
- Full access to all features
- System-wide administration

### Admin
- Manage users and settings
- View activity logs
- Generate reports
- All librarian and member permissions

### Head Librarian
- Bulk upload books via CSV
- Manage complete book catalog
- Approve/reject reservations
- All librarian permissions

### Librarian
- Add, edit, delete books
- Handle reservations
- Moderate reviews
- View activity logs

### Member
- Browse and search books
- Reserve available books
- Read e-books and listen to audiobooks
- Write and manage reviews
- Request new books

## Accessibility Features

- Screen reader compatible
- Keyboard navigation support
- High contrast text for readability
- Configurable user preferences

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
src/
├── components/
│   ├── Auth/          # Authentication components
│   ├── Books/         # Book browsing and details
│   ├── Dashboard/     # Dashboard views
│   ├── Layout/        # Header, sidebar, navigation
│   ├── Manage/        # Admin/librarian management
│   └── Reservations/  # Reservation management
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── lib/
│   ├── supabase.ts      # Supabase client
│   ├── database.types.ts # TypeScript types
│   └── utils.ts         # Utility functions
├── App.tsx            # Main application
└── main.tsx           # Entry point
```

## License

This project is built for the Risk Management Department's library automation needs.

## Support

For issues or questions, contact the development team or submit an issue in the project repository.
