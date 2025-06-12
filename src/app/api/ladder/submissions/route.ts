import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LadderSubmission from '@/models/LadderSubmission';
import LadderQuestion from '@/models/LadderQuestion';

// GET - Get user's submissions
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const week = searchParams.get('week');

        let filter: any = { userId: session.user.id };
        if (week) filter.week = week;

        const submissions = await LadderSubmission.find(filter)
            .populate('questionId', 'title week')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ submissions });
    } catch (error) {
        console.error('Error fetching user submissions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create or update submission
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { week, questionId, responses, status = 'draft' } = body;

        // Validation
        if (!week || !questionId || !responses) {
            return NextResponse.json({
                error: 'Week, questionId, and responses are required'
            }, { status: 400 });
        }

        if (!['week1', 'week2', 'week3', 'week4', 'complete'].includes(week)) {
            return NextResponse.json({ error: 'Invalid week value' }, { status: 400 });
        }

        // Verify the question exists and is active
        const question = await LadderQuestion.findById(questionId);
        if (!question || !question.isActive) {
            return NextResponse.json({
                error: 'Question not found or inactive'
            }, { status: 404 });
        }

        if (question.week !== week) {
            return NextResponse.json({
                error: 'Question week does not match submission week'
            }, { status: 400 });
        }

        // Check if submission already exists
        const existingSubmission = await LadderSubmission.findOne({
            userId: session.user.id,
            week
        });

        let submission;

        if (existingSubmission) {
            // Update existing submission (only if not already submitted)
            if (existingSubmission.status === 'submitted' && status === 'submitted') {
                return NextResponse.json({
                    error: 'Submission already submitted and cannot be modified'
                }, { status: 400 });
            }

            submission = await LadderSubmission.findByIdAndUpdate(
                existingSubmission._id,
                {
                    questionId,
                    responses,
                    status,
                    userEmail: session.user.email!,
                    userName: session.user.name!,
                },
                { new: true, runValidators: true }
            );
        } else {
            // Create new submission
            submission = new LadderSubmission({
                userId: session.user.id,
                userEmail: session.user.email!,
                userName: session.user.name!,
                week,
                questionId,
                responses,
                status,
            });

            await submission.save();
        }

        return NextResponse.json({
            message: existingSubmission ? 'Submission updated successfully' : 'Submission created successfully',
            submission
        }, { status: existingSubmission ? 200 : 201 });

    } catch (error) {
        console.error('Error creating/updating submission:', error);

        // Handle duplicate key error (shouldn't happen with our logic, but just in case)
        if (error instanceof Error && 'code' in error && error.code === 11000) {
            return NextResponse.json({
                error: 'You already have a submission for this week'
            }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
