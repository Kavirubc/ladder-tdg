import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LadderQuestion from '@/models/LadderQuestion';

// GET - Get specific question
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

        const question = await LadderQuestion.findById(id);

        if (!question) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json({ question });
    } catch (error) {
        console.error('Error fetching ladder question:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update question (Admin only)
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

        // If updating fields, check for conflicts with other questions in the same week
        if (body.fields && body.week) {
            const existingQuestions = await LadderQuestion.find({
                week: body.week,
                isActive: true,
                _id: { $ne: id } // Exclude current question
            });
            const existingFieldIds = existingQuestions.flatMap(q => q.fields.map((f: any) => f.id));
            const newFieldIds = body.fields.map((f: any) => f.id);

            const conflictingIds = newFieldIds.filter((fieldId: string) => existingFieldIds.includes(fieldId));
            if (conflictingIds.length > 0) {
                return NextResponse.json({
                    error: `Field ID conflicts detected: ${conflictingIds.join(', ')}. Field IDs must be unique across all questions in the same week.`
                }, { status: 400 });
            }
        }

        const question = await LadderQuestion.findByIdAndUpdate(
            id,
            { ...body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!question) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Question updated successfully',
            question
        });
    } catch (error) {
        console.error('Error updating ladder question:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete question (Admin only)
export async function DELETE(
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

        const question = await LadderQuestion.findByIdAndDelete(id);

        if (!question) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Error deleting ladder question:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
