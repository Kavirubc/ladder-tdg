import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';

// GET - Fetch applications analytics (Admin only)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get total count
        const total = await Application.countDocuments();

        // Get counts by status
        const statusCounts = await Application.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Convert to object
        const byStatus = {
            draft: 0,
            submitted: 0,
            reviewed: 0,
            accepted: 0,
            rejected: 0,
        };

        statusCounts.forEach(item => {
            if (item._id in byStatus) {
                byStatus[item._id as keyof typeof byStatus] = item.count;
            }
        });

        // Get recent applications (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentApplications = await Application.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        const analytics = {
            total,
            byStatus,
            recentApplications,
        };

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
