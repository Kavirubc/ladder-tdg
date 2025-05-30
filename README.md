# Ladder - Productivity App

A task tracking and productivity app built with Next.js, MongoDB, and NextAuth. Ladder helps users track their daily tasks, measure progress, and achieve their goals within a community program.

## Features

- **User Authentication**: Secure login and registration with NextAuth
- **Task Management**: Create, edit, delete, and mark tasks as complete
- **Activity Tracking**: Create and track recurring activities with point values
- **Progress System**: Ladder-based progression with levels and achievements
- **Admin Dashboard**: Comprehensive admin panel for system oversight and management
- **Dark Mode**: Beautiful dark-themed UI using Shadcn components
- **Responsive Design**: Works on mobile and desktop

## Admin Features

The application includes a comprehensive admin dashboard accessible only to the administrator (hapuarachchikaviru@gmail.com):

- **System Overview**: View total users, activities, todos, and completions
- **User Management**: View all users, manage user accounts
- **Activity Analytics**: See top activities and recent completions across all users
- **Database Cleanup**: Clean specific collections with password protection
  - Activities, Todos, Completions, Progress, Users (except admin)
  - Requires admin password (ADMIN_PASS environment variable)
- **Real-time Statistics**: Monitor system usage and user engagement

### Admin Access

1. Log in with the admin email: `hapuarachchikaviru@gmail.com`
2. Click the "Admin" button in the navigation bar
3. Access the admin dashboard at `/admin/dashboard`

### Database Cleanup

For database cleanup operations:

1. Navigate to the "Database Cleanup" tab
2. Select the collections you want to clean
3. Enter the admin password (set in ADMIN_PASS environment variable)
4. Confirm the operation

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Styling**: Shadcn UI components
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database (local or Atlas)
- pnpm (recommended) or npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env.local` file based on `.env.local.example` and add your MongoDB URI and NextAuth secret:

   ```
   # Database
   MONGODB_URI=your_mongodb_connection_string_here

   # Auth
   NEXTAUTH_SECRET=your_nextauth_secret_here # Generate a secure random string

   # Admin
   ADMIN_PASS=your_admin_password_here # Password for database cleanup operations

   # OpenAI (optional)
   OPENAI_API_KEY=your_openai_api_key_here

   # Email (optional)
   EMAIL_USER=your_email_here
   EMAIL_APP_PASSWORD=your_email_app_password_here

   # Analytics (optional)
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment

To build for production:

```bash
pnpm build
pnpm start
```

## Project Structure

- `/src/app` - Next.js app router pages and API routes
- `/src/components` - React components
- `/src/models` - MongoDB/Mongoose models
- `/src/lib` - Utility functions and database connection
- `/src/providers` - Context providers (Auth, Theme)

## Roadmap for Future Development

- User profiles and settings
- Team collaboration features
- Progress analytics and reporting
- Mobile app version
