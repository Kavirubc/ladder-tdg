import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// POST - Create a new standalone todo without activity
export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const { title, description, isRepetitive } = await req.json();

        // Validate required fields
        if (!title) {
            return NextResponse.json(
                { message: 'Title is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Create new standalone todo with a placeholder activityId
        // Use a valid ObjectId as placeholder - will be filtered out in UI
        const placeholderObjectId = new mongoose.Types.ObjectId('000000000000000000000000');

        const todoData = {
            title,
            description: description || '',
            user: session.user.id,
            isRepetitive: isRepetitive || false,
            lastShown: new Date(),
            activityId: placeholderObjectId // Use placeholder to satisfy schema validation
        };

        const todo = await Todo.create(todoData);

        return NextResponse.json({ todo }, { status: 201 });
    } catch (error) {
        console.error('Error creating standalone todo:', error);
        return NextResponse.json(
            { message: 'An error occurred while creating standalone todo', error: String(error) },
            { status: 500 }
        );
    }
}
