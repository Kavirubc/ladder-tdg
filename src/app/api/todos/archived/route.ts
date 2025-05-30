import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Get all archived todos for the current user
export async function GET(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const activityId = searchParams.get('activityId');

        let query: any = {
            user: session.user.id,
            isArchived: true
        };

        if (activityId) {
            query.activityId = activityId;
        }

        // Fetch archived todos for the current user
        const archivedTodos = await Todo.find(query)
            .populate('activityId', 'title')
            .sort({ archivedAt: -1 });

        return NextResponse.json({ todos: archivedTodos }, { status: 200 });
    } catch (error) {
        console.error('Error fetching archived todos:', error);
        return NextResponse.json(
            { message: 'An error occurred while fetching archived todos' },
            { status: 500 }
        );
    }
}

// PUT - Restore an archived todo
export async function PUT(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { todoId } = await req.json();

        if (!todoId) {
            return NextResponse.json(
                { message: 'Todo ID is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Find and restore the archived todo
        const todo = await Todo.findOneAndUpdate(
            {
                _id: todoId,
                user: session.user.id,
                isArchived: true
            },
            {
                $set: { isArchived: false },
                $unset: { archivedAt: 1 }
            },
            { new: true }
        );

        if (!todo) {
            return NextResponse.json({ message: 'Archived todo not found' }, { status: 404 });
        }

        return NextResponse.json({ todo, message: 'Todo restored successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error restoring todo:', error);
        return NextResponse.json(
            { message: 'An error occurred while restoring todo' },
            { status: 500 }
        );
    }
}
