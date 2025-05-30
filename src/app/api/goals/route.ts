import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Goal from '@/models/Goal';
import LadderProgress from '@/models/LadderProgress';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const goals = await Goal.find({
            user: session.user.id,
            isActive: true
        }).sort({ createdAt: -1 });

        return NextResponse.json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, intensity, category, targetFrequency } = body;

        if (!title || !intensity || !category) {
            return NextResponse.json(
                { error: 'Title, intensity, and category are required' },
                { status: 400 }
            );
        }

        await connectDB();

        console.log('Creating goal with data:', {
            title,
            description,
            intensity,
            category,
            targetFrequency: targetFrequency || 'daily',
            user: session.user.id,
        });

        const goal = new Goal({
            title,
            description,
            intensity,
            category,
            targetFrequency: targetFrequency || 'daily',
            user: session.user.id,
        });

        await goal.save();

        // Initialize ladder progress if it doesn't exist
        let ladderProgress = await LadderProgress.findOne({ userId: session.user.id });
        if (!ladderProgress) {
            ladderProgress = new LadderProgress({
                userId: session.user.id,
                challengeStartDate: new Date(),
            });
            await ladderProgress.save();
        }

        return NextResponse.json(goal, { status: 201 });
    } catch (error) {
        console.error('Error creating goal:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            error: error
        });

        // Return more specific error message if it's a validation error
        if (error instanceof Error && error.name === 'ValidationError') {
            return NextResponse.json({
                error: 'Validation Error',
                details: error.message
            }, { status: 400 });
        }

        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}
