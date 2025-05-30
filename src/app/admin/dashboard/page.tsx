import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import AdminDashboard from '@/components/AdminDashboard';

export default async function AdminDashboardPage() {
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
                <h1 className="text-4xl font-bold text-center mb-2">Admin Dashboard</h1>
                <p className="text-center text-gray-600 dark:text-gray-400">
                    Welcome, {session.user.name} - System Administrator
                </p>
            </div>

            <AdminDashboard />
        </div>
    );
}
