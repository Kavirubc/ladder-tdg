import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import TodoComponent from '@/components/TodoComponent';
import Navbar from '@/components/Navbar'; // Assuming you have a Navbar component

export default async function TasksPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/login');
    }

    return (
        <>
            <div className="container mx-auto max-w-4xl py-10 px-4">
                {/* TodoComponent will be responsible for fetching and displaying tasks grouped by habit */}
                <TodoComponent userId={session.user.id} />
            </div>
        </>
    );
}
