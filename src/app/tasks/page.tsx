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
                {activityId ? (
                    <TodoComponent userId={session.user.id} activityId={activityId} />
                ) : (
                    <div className="text-center p-8 border rounded-lg shadow-sm bg-white">
                        <p className="text-lg text-gray-700">
                            To add a new task here, please ensure an activity context is available or use the 'Add Task' button within a specific activity.
                        </p>
                        {/* Optional: Add a link to the activities page or a general "Add Task" button if applicable */}
                        {/* <Link href="/dashboard" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            View Activities
                        </Link> */}
                    </div>
                )}
            </div>
        </>
    );
}
