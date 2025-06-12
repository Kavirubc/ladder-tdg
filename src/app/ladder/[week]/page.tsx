import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import LadderSubmissionForm from '@/components/LadderSubmissionForm';

interface LadderWeekPageProps {
    params: Promise<{
        week: string;
    }>;
}

export default async function LadderWeekPage({ params }: LadderWeekPageProps) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const { week } = await params;

    // Validate week parameter
    const validWeeks = ['week1', 'week2', 'week3', 'week4', 'complete'];
    if (!validWeeks.includes(week)) {
        redirect('/ladder');
    }

    return <LadderSubmissionForm week={week} />;
}

export async function generateStaticParams() {
    return [
        { week: 'week1' },
        { week: 'week2' },
        { week: 'week3' },
        { week: 'week4' },
        { week: 'complete' },
    ];
}
