import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LadderSubmission from '@/models/LadderSubmission';

// GET - Get specific submission
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;

        const submission = await LadderSubmission.findById(id)
            .populate('questionId')
            .populate('userId', 'name email');

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        return NextResponse.json({ submission });
    } catch (error) {
        console.error('Error fetching ladder submission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update submission status/review (Admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const { status, reviewComments, score } = body;

        const updateData: any = {};

        if (status) {
            if (!['draft', 'submitted', 'reviewed', 'approved', 'rejected'].includes(status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
            updateData.status = status;

            if (status === 'reviewed' || status === 'approved' || status === 'rejected') {
                updateData.reviewedAt = new Date();
                updateData.reviewedBy = session.user.email;
            }
        }

        if (reviewComments !== undefined) {
            updateData.reviewComments = reviewComments;
        }

        if (score !== undefined) {
            if (score < 0 || score > 100) {
                return NextResponse.json({ error: 'Score must be between 0 and 100' }, { status: 400 });
            }
            updateData.score = score;
        }

        const submission = await LadderSubmission.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Submission updated successfully',
            submission
        });
    } catch (error) {
        console.error('Error updating ladder submission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
