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

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const activityId = searchParams.get('activityId');
        const completionDate = searchParams.get('date'); // Optional: specific date for recurring activities

        if (!activityId) {
            return NextResponse.json({ message: 'Activity ID is required' }, { status: 400 });
        }

        const activity = await Activity.findById(activityId);
        if (!activity) {
            return NextResponse.json({ message: 'Activity not found' }, { status: 404 });
        }

        if (activity.user.toString() !== session.user.id) {
            return NextResponse.json({ message: 'Forbidden: Activity does not belong to user' }, { status: 403 });
        }

        // For recurring activities, delete the most recent completion
        // For one-time activities, delete the completion
        let query: any = { activityId, userId: session.user.id };

        if (completionDate) {
            // If a specific date is provided, delete completion for that date
            const startOfDay = new Date(completionDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(completionDate);
            endOfDay.setHours(23, 59, 59, 999);

            query.completedAt = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        // Find the completion to get the points before deleting
        const completion = await ActivityCompletion.findOne(query).sort({ completedAt: -1 });

        if (!completion) {
            return NextResponse.json({ message: 'No completion found to undo' }, { status: 404 });
        }

        // Delete the completion
        await ActivityCompletion.findByIdAndDelete(completion._id);

        // Update LadderProgress (subtract the points)
        let progress = await LadderProgress.findOne({ userId: session.user.id });
        if (progress && completion.pointsEarned) {
            progress.points = Math.max(0, progress.points - completion.pointsEarned); // Ensure points don't go negative
            await progress.save();
        }

        return NextResponse.json({ message: 'Activity completion undone successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error undoing activity completion:', error);
        // @ts-ignore
        return NextResponse.json({ message: 'Error undoing activity completion', error: error.message }, { status: 500 });
    }
}
