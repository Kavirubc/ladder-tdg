import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Activity from '@/models/Activity';
import Todo from '@/models/Todo';
import ActivityCompletion from '@/models/ActivityCompletion';
import LadderProgress from '@/models/LadderProgress';

// POST - Clean database (requires admin password)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { password, collections } = await request.json();

        // Verify admin password
        if (password !== process.env.ADMIN_PASS) {
            return NextResponse.json({ message: 'Invalid admin password' }, { status: 401 });
        }

        if (!collections || !Array.isArray(collections) || collections.length === 0) {
            return NextResponse.json({ message: 'No collections specified' }, { status: 400 });
        }

        await connectDB();

        const results: { [key: string]: number } = {};

        // Clean specified collections
        for (const collection of collections) {
            switch (collection) {
                case 'activities':
                    const deletedActivities = await Activity.deleteMany({});
                    results.activities = deletedActivities.deletedCount;
                    break;
                case 'todos':
                    const deletedTodos = await Todo.deleteMany({});
                    results.todos = deletedTodos.deletedCount;
                    break;
                case 'completions':
                    const deletedCompletions = await ActivityCompletion.deleteMany({});
                    results.completions = deletedCompletions.deletedCount;
                    break;
                case 'progress':
                    const deletedProgress = await LadderProgress.deleteMany({});
                    results.progress = deletedProgress.deletedCount;
                    break;
                case 'users':
                    // Don't delete admin user
                    const deletedUsers = await User.deleteMany({
                        email: { $ne: 'hapuarachchikaviru@gmail.com' }
                    });
                    results.users = deletedUsers.deletedCount;
                    break;
                default:
                    continue;
            }
        }

        return NextResponse.json({
            message: 'Database cleanup completed',
            results
        });

    } catch (error) {
        console.error('Error cleaning database:', error);
        return NextResponse.json(
            { message: 'Error cleaning database' },
            { status: 500 }
        );
    }
}
