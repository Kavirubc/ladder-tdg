import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LadderQuestion from '@/models/LadderQuestion';

// GET - Get active questions for a specific week
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const week = searchParams.get('week');

        if (!week) {
            return NextResponse.json({ error: 'Week parameter is required' }, { status: 400 });
        }

        if (!['week1', 'week2', 'week3', 'week4', 'complete'].includes(week)) {
            return NextResponse.json({ error: 'Invalid week value' }, { status: 400 });
        }

        const questions = await LadderQuestion.find({
            week,
            isActive: true
        }).sort({ createdAt: -1 }).limit(1).lean();

        // Return the most recent active question for the week
        const question = questions[0] || null;

        return NextResponse.json({ question });
    } catch (error) {
        console.error('Error fetching ladder questions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
