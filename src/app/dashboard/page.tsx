import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import IntegratedDashboard from '@/components/IntegratedDashboard';


export default async function DashboardPage() {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <>

      <div className="container mx-auto max-w-6xl py-10 px-4">
        <h1 className="text-3xl text-center font-bold mb-8">Welcome, {session.user.name}</h1>

        {/* Application Banner */}
        <div className="w-full flex justify-center mb-8">
          <div className="bg-green-600 text-white px-6 py-2 flex flex-row items-center justify-center gap-4 w-full max-w-screen text-center">
            <span className="text-center">🚀 Application Open Now! Apply today to join the Ladder community.</span>
            <a href="/apply">
              <button className="text-green-700 bg-white hover:bg-green-100 px-4 py-2 rounded text-sm font-semibold">Apply Now</button>
            </a>
          </div>
        </div>

        <div className="space-y-8">
          <IntegratedDashboard userId={session.user.id} />
        </div>
      </div>
    </>
  );
}
