import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Activity from '@/models/Activity';
import Todo from '@/models/Todo';
import ActivityCompletion from '@/models/ActivityCompletion';
import LadderProgress from '@/models/LadderProgress';

// GET - Get detailed analytics for admin dashboard
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get user registration stats over time
        const userGrowth = await User.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            },
            {
                $limit: 30
            }
        ]);

        // Get activity completion trends
        const completionTrends = await ActivityCompletion.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$completedAt' },
                        month: { $month: '$completedAt' },
                        day: { $dayOfMonth: '$completedAt' }
                    },
                    completions: { $sum: 1 },
                    totalPoints: { $sum: '$pointsEarned' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            },
            {
                $limit: 30
            }
        ]);

        // Get category distribution
        const categoryStats = await Activity.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgPointValue: { $avg: '$pointValue' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Get user engagement metrics
        const userEngagement = await User.aggregate([
            {
                $lookup: {
                    from: 'activitycompletions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'completions'
                }
            },
            {
                $lookup: {
                    from: 'activities',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'activities'
                }
            },
            {
                $lookup: {
                    from: 'todos',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'todos'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    createdAt: 1,
                    completionCount: { $size: '$completions' },
                    activityCount: { $size: '$activities' },
                    todoCount: { $size: '$todos' },
                    totalPoints: {
                        $sum: '$completions.pointsEarned'
                    }
                }
            },
            {
                $sort: { totalPoints: -1 }
            }
        ]);

        return NextResponse.json({
            userGrowth,
            completionTrends,
            categoryStats,
            userEngagement
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { message: 'Error fetching analytics' },
            { status: 500 }
        );
    }
}
