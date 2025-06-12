import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import LadderOverview from '@/components/LadderOverview';

export default async function LadderPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return <LadderOverview session={session} />;
}
