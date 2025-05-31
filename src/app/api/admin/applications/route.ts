import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';

// GET - Fetch all applications (Admin only)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.email !== 'hapuarachchikaviru@gmail.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const applications = await Application.find({})
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ applications });
    } catch (error) {
        console.error('Error fetching applications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
