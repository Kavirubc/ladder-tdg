import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/mongodb';
import Activity from '@/models/Activity';
import ActivityCompletion from '@/models/ActivityCompletion';
import User from '@/models/User';
import LadderProgress from '@/models/LadderProgress';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const { activityId, notes } = await request.json();

        const activity = await Activity.findById(activityId);
        if (!activity) {
            return NextResponse.json({ message: 'Activity not found' }, { status: 404 });
        }

        if (activity.user.toString() !== session.user.id) {
            return NextResponse.json({ message: 'Forbidden: Activity does not belong to user' }, { status: 403 });
        }

        // Logic to prevent duplicate completions for recurring activities if needed
        // For example, if it's a daily activity, check if it was already completed today.
        // This part needs to be tailored to your specific rules for recurrence.

        const completion = new ActivityCompletion({
            activityId,
            userId: session.user.id,
            pointsEarned: activity.pointValue, // Ensure pointValue is set on the activity
            notes,
        });

        await completion.save();

        // Update LadderProgress
        let progress = await LadderProgress.findOne({ userId: session.user.id });
        if (!progress) {
            progress = new LadderProgress({ userId: session.user.id, points: 0, level: 1 });
        }
        progress.points += activity.pointValue || 0;
        // Add level up logic if necessary
        await progress.save();

        return NextResponse.json(completion, { status: 201 });
    } catch (error) {
        console.error('Error creating activity completion:', error);
        // @ts-ignore
        return NextResponse.json({ message: 'Error creating activity completion', error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const activityId = searchParams.get('activityId');

        const query: any = { userId: session.user.id };
        if (activityId) {
            query.activityId = activityId;
        }

        const completions = await ActivityCompletion.find(query)
            .populate('activityId', 'title category') // Populate activity details
            .sort({ completedAt: -1 });

        return NextResponse.json(completions, { status: 200 });
    } catch (error) {
        console.error('Error fetching activity completions:', error);
        // @ts-ignore
        return NextResponse.json({ message: 'Error fetching activity completions', error: error.message }, { status: 500 });
    }
}
