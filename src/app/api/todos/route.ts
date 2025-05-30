import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { startOfDay } from 'date-fns';

// GET - Get all todos for the current user
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get('goalId');

    // Reset repetitive todos if they weren't shown yet today
    const today = startOfDay(new Date());
    await Todo.updateMany(
      {
        user: session.user.id,
        isRepetitive: true,
        isCompleted: true,
        lastShown: { $lt: today }
      },
      {
        $set: { isCompleted: false, lastShown: new Date() }
      }
    );

    let query: any = { user: session.user.id };
    if (goalId) {
      query.goalId = goalId;
    }

    // Fetch todos for the current user, optionally filtered by goalId
    const todos = await Todo.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ todos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching todos' },
      { status: 500 }
    );
  }
}

// POST - Create a new todo
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { title, description, goalId, isRepetitive } = await req.json();

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { message: 'Title is required' },
        { status: 400 }
      );
    }

    if (!goalId) {
      return NextResponse.json(
        { message: 'Goal ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create new todo
    const todoData: any = {
      title,
      description,
      goalId,
      user: session.user.id,
      isRepetitive: isRepetitive || false,
      lastShown: new Date()
    };

    const todo = await Todo.create(todoData);

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { message: 'An error occurred while creating todo' },
      { status: 500 }
    );
  }
}
