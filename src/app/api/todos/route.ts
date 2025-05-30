import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET - Get all todos for the current user
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch todos for the current user
    const todos = await Todo.find({ user: session.user.id }).sort({ createdAt: -1 });

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
    const { title, description } = await req.json();

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { message: 'Title is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create new todo
    const todo = await Todo.create({
      title,
      description,
      user: session.user.id,
    });

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { message: 'An error occurred while creating todo' },
      { status: 500 }
    );
  }
}
