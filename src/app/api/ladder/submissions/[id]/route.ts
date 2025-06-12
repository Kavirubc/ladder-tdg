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

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;

        const submission = await LadderSubmission.findOne({
            _id: id,
            userId: session.user.id // Ensure user can only access their own submissions
        }).populate('questionId');

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        return NextResponse.json({ submission });
    } catch (error) {
        console.error('Error fetching submission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update submission (only if not submitted)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;
        const body = await request.json();

        const { responses, status } = body;

        // Check if submission exists and belongs to user
        const existingSubmission = await LadderSubmission.findOne({
            _id: id,
            userId: session.user.id
        });

        if (!existingSubmission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        // Don't allow modification of submitted submissions
        if (existingSubmission.status === 'submitted' && status === 'submitted') {
            return NextResponse.json({
                error: 'Cannot modify submitted submission'
            }, { status: 400 });
        }

        const updateData: any = {};
        if (responses) updateData.responses = responses;
        if (status) updateData.status = status;

        const submission = await LadderSubmission.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        return NextResponse.json({
            message: 'Submission updated successfully',
            submission
        });
    } catch (error) {
        console.error('Error updating submission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete submission (only if not submitted)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { id } = await params;

        // Check if submission exists and belongs to user
        const submission = await LadderSubmission.findOne({
            _id: id,
            userId: session.user.id
        });

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        // Don't allow deletion of submitted submissions
        if (submission.status === 'submitted') {
            return NextResponse.json({
                error: 'Cannot delete submitted submission'
            }, { status: 400 });
        }

        await LadderSubmission.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Submission deleted successfully' });
    } catch (error) {
        console.error('Error deleting submission:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
