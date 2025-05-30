import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import TodoComponent from '@/components/TodoComponent';
import HabitTracker from '@/components/HabitTracker';


export default async function DashboardPage() {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <>

      <div className="container mx-auto max-w-6xl py-10 px-4">
        <h1 className="text-3xl font-bold mb-8">Welcome, {session.user.name}</h1>

        <div className="space-y-8">
          <HabitTracker userId={session.user.id} />
          <TodoComponent userId={session.user.id} />
        </div>
      </div>
    </>
  );
}
