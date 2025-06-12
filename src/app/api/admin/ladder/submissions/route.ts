import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LadderSubmission from '@/models/LadderSubmission';

// GET - Fetch all ladder submissions (Admin only)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const week = searchParams.get('week');
        const status = searchParams.get('status');

        let filter: any = {};
        if (week) filter.week = week;
        if (status) filter.status = status;

        const submissions = await LadderSubmission.find(filter)
            .populate('questionId', 'title week')
            .sort({ createdAt: -1 })
            .lean();

        // Group submissions by week for easier admin view
        const groupedSubmissions = submissions.reduce((acc: any, submission: any) => {
            if (!acc[submission.week]) {
                acc[submission.week] = [];
            }
            acc[submission.week].push(submission);
            return acc;
        }, {});

        return NextResponse.json({
            submissions,
            groupedSubmissions,
            totalCount: submissions.length
        });
    } catch (error) {
        console.error('Error fetching ladder submissions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
