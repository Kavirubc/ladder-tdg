import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import AdminLadderManagement from '@/components/AdminLadderManagement';

export default async function AdminLadderPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    // Check if user is admin
    if (session.user.email !== 'hapuarachchikaviru@gmail.com') {
        redirect('/dashboard');
    }

    return (
        <div className="container mx-auto max-w-7xl py-10 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-center mb-2">Ladder Program Administration</h1>
                <p className="text-center text-gray-600 dark:text-gray-400">
                    Manage questions and review submissions for the ladder program
                </p>
            </div>

            <AdminLadderManagement />
        </div>
    );
}
