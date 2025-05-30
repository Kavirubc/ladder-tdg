# Ladder - Productivity App

A task tracking and productivity app built with Next.js, MongoDB, and NextAuth. Ladder helps users track their daily tasks, measure progress, and achieve their goals within a community program.

## Features

- **User Authentication**: Secure login and registration with NextAuth
- **Task Management**: Create, edit, delete, and mark tasks as complete
- **Dark Mode**: Beautiful dark-themed UI using Shadcn components
- **Responsive Design**: Works on mobile and desktop

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
   # Auth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here # Generate a secure random string

   # MongoDB
   MONGODB_URI=your_mongodb_connection_string_here
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
