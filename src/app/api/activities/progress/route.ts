import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/mongodb';
import ActivityCompletion from '@/models/ActivityCompletion';
import LadderProgress from '@/models/LadderProgress';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        // Get overall progress (LadderProgress)
        const ladderProgress = await LadderProgress.findOne({ userId: session.user.id });

        // Get recent completions (e.g., last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentCompletions = await ActivityCompletion.find({
            userId: session.user.id,
            completedAt: { $gte: sevenDaysAgo },
        }).populate('activityId', 'title pointValue');

        // Calculate points per day or other relevant stats
        const stats = {
            totalPoints: ladderProgress ? ladderProgress.points : 0,
            level: ladderProgress ? ladderProgress.level : 1,
            recentCompletionsCount: recentCompletions.length,
            // You can add more detailed stats here, e.g., points by category
        };

        return NextResponse.json(stats, { status: 200 });
    } catch (error) {
        console.error('Error fetching activity progress:', error);
        // @ts-ignore
        return NextResponse.json({ message: 'Error fetching activity progress', error: error.message }, { status: 500 });
    }
}
