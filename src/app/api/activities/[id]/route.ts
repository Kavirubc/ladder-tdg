import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/mongodb';
import Activity from '@/models/Activity';
import User from '@/models/User';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const { id } = await params; // Await the params Promise
        const body = await request.json();
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const updatedActivity = await Activity.findOneAndUpdate(
            { _id: id, user: user._id },
            body,
            { new: true, runValidators: true }
        );

        if (!updatedActivity) {
            return NextResponse.json({ message: 'Activity not found or user not authorized to update' }, { status: 404 });
        }

        return NextResponse.json(updatedActivity, { status: 200 });
    } catch (error) {
        console.error('Error updating activity:', error);
        // @ts-ignore
        return NextResponse.json({ message: 'Error updating activity', error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const { id } = await params; // Await the params Promise
        const activity = await Activity.findOne({ _id: id, user: session.user.id });

        if (!activity) {
            return NextResponse.json({ message: 'Activity not found or user not authorized' }, { status: 404 });
        }

        return NextResponse.json(activity, { status: 200 });
    } catch (error) {
        console.error('Error fetching activity:', error);
        // @ts-ignore
        return NextResponse.json({ message: 'Error fetching activity', error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const { id } = await params; // Await the params Promise
        const deletedActivity = await Activity.findOneAndDelete({ _id: id, user: session.user.id });

        if (!deletedActivity) {
            return NextResponse.json({ message: 'Activity not found or user not authorized to delete' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Activity deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting activity:', error);
        // @ts-ignore
        return NextResponse.json({ message: 'Error deleting activity', error: error.message }, { status: 500 });
    }
}
