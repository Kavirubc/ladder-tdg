import { NextRequest, NextResponse } from 'next/server';
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

        let progress = await LadderProgress.findOne({ userId: session.user.id });

        if (!progress) {
            // Create initial progress if it doesn't exist
            progress = new LadderProgress({
                userId: session.user.id,
                currentLevel: 1,
                totalPoints: 0,
                weeklyPoints: 0,
                currentStreak: 0,
                longestStreak: 0,
                challengeStartDate: new Date(),
                completedChallenges: 0,
                achievements: [],
                ladderTheme: 'classic',
            });
            await progress.save();
        }

        return NextResponse.json(progress);
    } catch (error) {
        console.error('Error fetching ladder progress:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ladderTheme } = body;

        await connectDB();

        const progress = await LadderProgress.findOne({ userId: session.user.id });
        if (!progress) {
            return NextResponse.json({ error: 'Progress not found' }, { status: 404 });
        }

        if (ladderTheme) {
            progress.ladderTheme = ladderTheme;
        }

        await progress.save();
        return NextResponse.json(progress);
    } catch (error) {
        console.error('Error updating ladder progress:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
