import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ApplicationForm from '@/components/ApplicationForm';

export default async function ApplyPage() {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto max-w-2xl py-10 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold mb-2">Apply to Ladder Program</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Join our exclusive program and take your skills to the next level
                </p>
            </div>

            <ApplicationForm session={session} />
        </div>
    );
}
