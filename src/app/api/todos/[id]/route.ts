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
    const { title, description, isCompleted, activityId, isRepetitive } = await req.json(); // Changed from goalId

    // Validate required fields - only title if not just toggling completion
    if (title === undefined && description === undefined && isCompleted === undefined &&
      activityId === undefined && isRepetitive === undefined) { // Changed from goalId
      return NextResponse.json(
        { message: 'At least one field (title, description, isCompleted, activityId, or isRepetitive) is required for update' }, // Changed from goalId
        { status: 400 }
      );
    }

    if (title !== undefined && !title) { // if title is provided, it cannot be empty
      return NextResponse.json(
        { message: 'Title cannot be empty' },
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

    // Update fields if provided
    if (title !== undefined) {
      todo.title = title;
    }
    if (description !== undefined) {
      todo.description = description;
    }
    if (isCompleted !== undefined) {
      todo.isCompleted = isCompleted;
      if (isCompleted === false && todo.isRepetitive) {
        // Update lastShown when a repetitive task is uncompleted
        todo.lastShown = new Date();
      }
    }
    if (activityId !== undefined) { // Changed from goalId
      // Handle special case when activityId is null or '000000000000000000000000'
      if (activityId === null || activityId === '000000000000000000000000' || activityId === '') {
        // Mongoose will not allow deleting a required field, so use special placeholder ID 
        todo.activityId = '000000000000000000000000';
      } else {
        todo.activityId = activityId;
      }
    }
    if (isRepetitive !== undefined) {
      todo.isRepetitive = isRepetitive;
    }

    // Save updated todo
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

    // Update lastShown when a repetitive task is uncompleted
    if (isCompleted === false && todo.isRepetitive) {
      todo.lastShown = new Date();
    }

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

// DELETE - Archive a todo (soft delete)
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

    // Archive todo instead of deleting
    todo.isArchived = true;
    todo.archivedAt = new Date();
    await todo.save();

    return NextResponse.json({ message: 'Todo archived successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error archiving todo:', error);
    return NextResponse.json(
      { message: 'An error occurred while archiving todo' },
      { status: 500 }
    );
  }
}
