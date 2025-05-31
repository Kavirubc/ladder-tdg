import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';

// PUT - Update application status (Admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { status } = body;

        if (!['draft', 'submitted', 'reviewed', 'accepted', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await connectDB();

        const application = await Application.findByIdAndUpdate(
            params.id,
            {
                status,
                updatedAt: new Date(),
                ...(status === 'reviewed' && { reviewedAt: new Date() })
            },
            { new: true, runValidators: true }
        );

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json({ application });
    } catch (error) {
        console.error('Error updating application:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
