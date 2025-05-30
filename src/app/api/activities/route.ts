import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/mongodb';
import Activity from '@/models/Activity';
import User from '@/models/User';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const body = await request.json();
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const newActivity = new Activity({
            ...body,
            user: user._id,
        });

        await newActivity.save();
        return NextResponse.json(newActivity, { status: 201 });
    } catch (error) {
        console.error('Error creating activity:', error);
        // @ts-ignore
        return NextResponse.json({ message: 'Error creating activity', error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const isActive = searchParams.get('isActive');

        const query: any = { user: session.user.id };
        if (category) {
            query.category = category;
        }
        if (isActive !== null) {
            query.isActive = isActive === 'true';
        }

        const activities = await Activity.find(query).sort({ createdAt: -1 });
        return NextResponse.json(activities, { status: 200 });
    } catch (error) {
        console.error('Error fetching activities:', error);
        // @ts-ignore
        return NextResponse.json({ message: 'Error fetching activities', error: error.message }, { status: 500 });
    }
}
