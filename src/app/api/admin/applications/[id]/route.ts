import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';

// PUT - Update application status (Admin only)
export async function PUT(
    request: NextRequest,
    { params: paramsPromise }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await paramsPromise; // Await params here
    try {
        const body = await request.json();
        const { status, comment } = body;

        if (!['draft', 'submitted', 'reviewed', 'accepted', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Get current application to preserve status history
        const currentApplication = await Application.findById(params.id);
        if (!currentApplication) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Prepare update object
        const updateData: any = {
            status,
            updatedAt: new Date(),
            ...(status === 'reviewed' && { reviewedAt: new Date() })
        };

        // Handle rejection reason
        if (status === 'rejected' && comment) {
            updateData.rejectionReason = comment;
        }

        // Add to status history
        const statusHistoryEntry = {
            status,
            timestamp: new Date(),
            comment: comment || ''
        };

        updateData.$push = {
            statusHistory: statusHistoryEntry
        };

        const application = await Application.findByIdAndUpdate(
            params.id,
            updateData,
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
