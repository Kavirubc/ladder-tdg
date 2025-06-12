import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LadderQuestion from '@/models/LadderQuestion';

// GET - Fetch all ladder questions (Admin only)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const questions = await LadderQuestion.find({})
            .sort({ week: 1, createdAt: -1 })
            .lean();

        return NextResponse.json({ questions });
    } catch (error) {
        console.error('Error fetching ladder questions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create new ladder question (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { week, title, description, fields } = body;

        // Validation
        if (!week || !title || !fields || !Array.isArray(fields)) {
            return NextResponse.json({
                error: 'Week, title, and fields are required'
            }, { status: 400 });
        }

        if (!['week1', 'week2', 'week3', 'week4', 'complete'].includes(week)) {
            return NextResponse.json({
                error: 'Invalid week value'
            }, { status: 400 });
        }

        // Validate fields
        for (const field of fields) {
            if (!field.id || !field.type || !field.label) {
                return NextResponse.json({
                    error: 'Each field must have id, type, and label'
                }, { status: 400 });
            }
        }

        // Check for field ID conflicts with other questions in the same week
        const existingQuestions = await LadderQuestion.find({ week, isActive: true });
        const existingFieldIds = existingQuestions.flatMap(q => q.fields.map((f: any) => f.id));
        const newFieldIds = fields.map(f => f.id);

        const conflictingIds = newFieldIds.filter(id => existingFieldIds.includes(id));
        if (conflictingIds.length > 0) {
            return NextResponse.json({
                error: `Field ID conflicts detected: ${conflictingIds.join(', ')}. Field IDs must be unique across all questions in the same week.`
            }, { status: 400 });
        }

        const question = new LadderQuestion({
            week,
            title,
            description,
            fields,
            createdBy: session.user.email,
        });

        await question.save();

        return NextResponse.json({
            message: 'Ladder question created successfully',
            question
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating ladder question:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
