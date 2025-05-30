import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Goal from '@/models/Goal';
import GoalCompletion from '@/models/GoalCompletion';
import LadderProgress from '@/models/LadderProgress';
import Todo from '@/models/Todo'; // Import Todo model for updating repetitive tasks

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const completions = await GoalCompletion.find({
            userId: session.user.id
        }).sort({ completedAt: -1 });

        return NextResponse.json(completions);
    } catch (error) {
        console.error('Error fetching goal completions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const { goalId, notes } = body;

        if (!goalId) {
            return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
        }

        // Find the goal to get its point value
        const goal = await Goal.findById(goalId);
        if (!goal) {
            return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
        }

        if (goal.user.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Not authorized to complete this goal' }, { status: 403 });
        }

        // Check if already completed today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingCompletion = await GoalCompletion.findOne({
            goalId,
            userId: session.user.id,
            completedAt: { $gte: today, $lt: tomorrow }
        });

        if (existingCompletion) {
            return NextResponse.json(
                { error: 'Goal already completed today' },
                { status: 400 }
            );
        }

        // Get user's current streak and update ladder progress
        let ladderProgress = await LadderProgress.findOne({ userId: session.user.id });
        if (!ladderProgress) {
            ladderProgress = new LadderProgress({
                userId: session.user.id,
                challengeStartDate: new Date(),
            });
        }

        // Update streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const hadCompletionYesterday = await GoalCompletion.exists({
            userId: session.user.id,
            completedAt: { $gte: yesterday, $lt: today }
        });

        let currentStreak = ladderProgress.currentStreak || 0;
        if (hadCompletionYesterday) {
            currentStreak += 1;
        } else {
            currentStreak = 1; // Reset streak if no completion yesterday
        }

        ladderProgress.currentStreak = currentStreak;
        if (currentStreak > ladderProgress.longestStreak) {
            ladderProgress.longestStreak = currentStreak;
        }

        // Calculate points with streak bonus
        let pointValue = goal.pointValue || 10;
        let streakBonus = 1.0;
        if (currentStreak >= 7) {
            streakBonus = 1.5;
        } else if (currentStreak >= 3) {
            streakBonus = 1.2;
        }
        const finalPoints = Math.round(pointValue * streakBonus);

        // Create completion record
        const completion = new GoalCompletion({
            goalId,
            userId: session.user.id,
            completedAt: new Date(),
            points: finalPoints,
            streak: currentStreak,
            notes
        });

        await completion.save();

        // Update ladder progress
        ladderProgress.totalPoints += finalPoints;
        ladderProgress.weeklyPoints += finalPoints;

        // Level up if applicable
        // This is a placeholder for level calculation logic
        const levelThresholds = [0, 50, 150, 300, 500, 750, 1000];
        for (let i = levelThresholds.length - 1; i >= 0; i--) {
            if (ladderProgress.totalPoints >= levelThresholds[i] && i > ladderProgress.currentLevel) {
                ladderProgress.currentLevel = i;
                break;
            }
        }

        await ladderProgress.save();

        // Reset repetitive tasks that were completed
        // Find and update all repetitive completed todos for this goal
        await Todo.updateMany(
            {
                goalId,
                isCompleted: true,
                isRepetitive: true
            },
            {
                $set: {
                    isCompleted: false,
                    lastShown: new Date()
                }
            }
        );

        return NextResponse.json({
            completion,
            progress: ladderProgress
        });
    } catch (error) {
        console.error('Error completing goal:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
