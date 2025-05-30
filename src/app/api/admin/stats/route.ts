import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Activity from '@/models/Activity';
import Todo from '@/models/Todo';
import ActivityCompletion from '@/models/ActivityCompletion';
import LadderProgress from '@/models/LadderProgress';

// GET - Get admin stats
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get various statistics
        const [
            totalUsers,
            totalActivities,
            totalTodos,
            totalCompletions,
            recentUsers,
            topActivities,
            recentCompletions
        ] = await Promise.all([
            User.countDocuments(),
            Activity.countDocuments(),
            Todo.countDocuments(),
            ActivityCompletion.countDocuments(),
            User.find().sort({ createdAt: -1 }).limit(10).select('-password'),
            Activity.aggregate([
                {
                    $lookup: {
                        from: 'activitycompletions',
                        localField: '_id',
                        foreignField: 'activityId',
                        as: 'completions'
                    }
                },
                {
                    $addFields: {
                        completionCount: { $size: '$completions' }
                    }
                },
                {
                    $sort: { completionCount: -1 }
                },
                {
                    $limit: 10
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'userInfo'
                    }
                }
            ]),
            ActivityCompletion.find()
                .populate('activityId', 'title category')
                .populate('userId', 'name email')
                .sort({ completedAt: -1 })
                .limit(20)
        ]);

        return NextResponse.json({
            stats: {
                totalUsers,
                totalActivities,
                totalTodos,
                totalCompletions
            },
            recentUsers,
            topActivities,
            recentCompletions
        });

    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json(
            { message: 'Error fetching admin stats' },
            { status: 500 }
        );
    }
}
