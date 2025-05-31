import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';

// GET - Fetch user's application
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const application = await Application.findOne({ userId: session.user.id });

        return NextResponse.json({ application });
    } catch (error) {
        console.error('Error fetching application:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create new application
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { phone, whyJoin, status = 'draft' } = body;

        // Validation
        if (status === 'submitted') {
            if (!phone?.trim()) {
                return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
            }
            if (!whyJoin?.trim()) {
                return NextResponse.json({ error: 'Please explain why you want to join' }, { status: 400 });
            }
            if (whyJoin.length < 50) {
                return NextResponse.json({ error: 'Please provide at least 50 characters' }, { status: 400 });
            }
        }

        await connectDB();

        // Check if application already exists
        const existingApplication = await Application.findOne({ userId: session.user.id });
        if (existingApplication) {
            return NextResponse.json({ error: 'Application already exists' }, { status: 400 });
        }

        const application = new Application({
            userId: session.user.id,
            name: session.user.name,
            email: session.user.email,
            phone: phone || '',
            whyJoin: whyJoin || '',
            status,
        });

        await application.save();

        return NextResponse.json({ application }, { status: 201 });
    } catch (error) {
        console.error('Error creating application:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update existing application
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { phone, whyJoin, status } = body;

        // Validation for submitted applications
        if (status === 'submitted') {
            if (!phone?.trim()) {
                return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
            }
            if (!whyJoin?.trim()) {
                return NextResponse.json({ error: 'Please explain why you want to join' }, { status: 400 });
            }
            if (whyJoin.length < 50) {
                return NextResponse.json({ error: 'Please provide at least 50 characters' }, { status: 400 });
            }
        }

        await connectDB();

        const application = await Application.findOneAndUpdate(
            { userId: session.user.id },
            {
                phone: phone || '',
                whyJoin: whyJoin || '',
                status,
                updatedAt: new Date(),
                ...(status === 'submitted' && { submittedAt: new Date() })
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
