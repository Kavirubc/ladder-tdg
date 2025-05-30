import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LadderProgress from '@/models/LadderProgress';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Find or create ladder progress
        let progress = await LadderProgress.findOne({ userId: session.user.id });
        if (!progress) {
            progress = new LadderProgress({
                userId: session.user.id,
                challengeStartDate: new Date(),
            });
            await progress.save();
        }

        return NextResponse.json(progress);
    } catch (error) {
        console.error('Error fetching ladder progress:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
