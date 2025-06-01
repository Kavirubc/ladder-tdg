import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import TodoComponent from '@/components/TodoComponent';
import Navbar from '@/components/Navbar'; // Assuming you have a Navbar component

export default async function TasksPage({ searchParams }: { searchParams?: Promise<{ activityId?: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/login');
    }

    const resolvedSearchParams = await searchParams;
    const activityId = resolvedSearchParams?.activityId;

    return (
        <>
            <div className="container mx-auto max-w-4xl py-10 px-4">
                {/* Allow tasks with or without an activityId */}
                <TodoComponent userId={session.user.id} activityId={activityId} />
            </div>
        </>
    );
}
