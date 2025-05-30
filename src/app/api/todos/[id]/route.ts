import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

// Helper function to check if an ID is valid
function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Helper function to get a todo and verify ownership
async function getTodoAndVerifyOwner(id: string, userId: string) {
  if (!isValidObjectId(id)) {
    return null;
  }

  const todo = await Todo.findById(id);

  if (!todo) {
    return null;
  }

  // Check if the todo belongs to the user
  if (todo.user.toString() !== userId) {
    return null;
  }

  return todo;
}

// GET - Get a specific todo
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get and verify todo ownership
    const { id: todoId } = await context.params;
    const todo = await getTodoAndVerifyOwner(todoId, session.user.id);

    if (!todo) {
      return NextResponse.json({ message: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ todo }, { status: 200 });
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching todo' },
      { status: 500 }
    );
  }
}

// PUT - Update a todo
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get and verify todo ownership
    const { id: todoId } = await context.params;
    const todo = await getTodoAndVerifyOwner(todoId, session.user.id);

    if (!todo) {
      return NextResponse.json({ message: 'Todo not found' }, { status: 404 });
    }

    // Update todo
    todo.title = title;
    todo.description = description;
    await todo.save();

    return NextResponse.json({ todo }, { status: 200 });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating todo' },
      { status: 500 }
    );
  }
}

// PATCH - Update todo completion status
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { isCompleted } = await req.json();

    // Validate required fields
    if (isCompleted === undefined) {
      return NextResponse.json(
        { message: 'isCompleted field is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get and verify todo ownership
    const { id: todoId } = await context.params;
    const todo = await getTodoAndVerifyOwner(todoId, session.user.id);

    if (!todo) {
      return NextResponse.json({ message: 'Todo not found' }, { status: 404 });
    }

    // Update todo status
    todo.isCompleted = isCompleted;
    await todo.save();

    return NextResponse.json({ todo }, { status: 200 });
  } catch (error) {
    console.error('Error updating todo status:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating todo status' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a todo
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get and verify todo ownership
    const { id: todoId } = await context.params;
    const todo = await getTodoAndVerifyOwner(todoId, session.user.id);

    if (!todo) {
      return NextResponse.json({ message: 'Todo not found' }, { status: 404 });
    }

    // Delete todo
    await Todo.deleteOne({ _id: todoId });

    return NextResponse.json({ message: 'Todo deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { message: 'An error occurred while deleting todo' },
      { status: 500 }
    );
  }
}
