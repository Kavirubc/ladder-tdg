import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Activity from '@/models/Activity';
import Todo from '@/models/Todo';
import ActivityCompletion from '@/models/ActivityCompletion';
import LadderProgress from '@/models/LadderProgress';

// GET - Get specific user data
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id: userId } = await params;
        await connectDB();

        const [user, activities, todos, completions, progress] = await Promise.all([
            User.findById(userId).select('-password'),
            Activity.find({ user: userId }),
            Todo.find({ user: userId }),
            ActivityCompletion.find({ userId }).populate('activityId', 'title category'),
            LadderProgress.findOne({ userId })
        ]);

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user,
            stats: {
                totalActivities: activities.length,
                totalTodos: todos.length,
                totalCompletions: completions.length,
                totalPoints: progress?.totalPoints || 0,
                currentLevel: progress?.currentLevel || 0
            },
            activities,
            todos,
            completions,
            progress
        });

    } catch (error) {
        console.error('Error fetching user data:', error);
        return NextResponse.json(
            { message: 'Error fetching user data' },
            { status: 500 }
        );
    }
}

// DELETE - Delete user and all associated data
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id: userId } = await params;
        await connectDB();

        // Prevent deleting admin user
        const userToDelete = await User.findById(userId);
        if (userToDelete?.email === 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ message: 'Cannot delete admin user' }, { status: 400 });
        }

        // Delete all user-related data
        await Promise.all([
            User.findByIdAndDelete(userId),
            Activity.deleteMany({ user: userId }),
            Todo.deleteMany({ user: userId }),
            ActivityCompletion.deleteMany({ userId }),
            LadderProgress.deleteMany({ userId })
        ]);

        return NextResponse.json({ message: 'User and all associated data deleted successfully' });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { message: 'Error deleting user' },
            { status: 500 }
        );
    }
}
