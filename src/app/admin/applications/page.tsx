import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ApplicationsAnalytics from '@/components/ApplicationsAnalytics';

export default async function AdminApplicationsPage() {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // Check if user is admin (using the specific email)
    if (session.user.email !== 'hapuarachchikaviru@gmail.com') {
        redirect('/dashboard');
    }

    return (
        <div className="container mx-auto max-w-7xl py-10 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-center mb-2">Applications Analytics</h1>
                <p className="text-center text-gray-600 dark:text-gray-400">
                    Monitor and manage Ladder program applications
                </p>
            </div>

            <ApplicationsAnalytics />
        </div>
    );
}
