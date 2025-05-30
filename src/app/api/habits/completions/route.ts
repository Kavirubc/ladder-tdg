import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import HabitCompletion from '@/models/HabitCompletion';
import Habit from '@/models/Habit';
import LadderProgress from '@/models/LadderProgress';
import { Achievement } from '@/types/habit';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { habitId, notes, completedAt } = body;

        if (!habitId) {
            return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 });
        }

        await connectDB();

        // Get the habit to check if it exists and get point value
        const habit = await Habit.findOne({ _id: habitId, user: session.user.id });
        if (!habit) {
            return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
        }

        const completionDate = completedAt ? new Date(completedAt) : new Date();
        const dayStart = startOfDay(completionDate);
        const dayEnd = endOfDay(completionDate);

        // Check if already completed today
        const existingCompletion = await HabitCompletion.findOne({
            habitId,
            userId: session.user.id,
            completedAt: {
                $gte: dayStart,
                $lte: dayEnd,
            },
        });

        if (existingCompletion) {
            return NextResponse.json(
                { error: 'Habit already completed today' },
                { status: 400 }
            );
        }

        // Calculate streak
        const streak = await calculateStreak(habitId, session.user.id, completionDate);

        // Create habit completion
        const completion = new HabitCompletion({
            habitId,
            userId: session.user.id,
            completedAt: completionDate,
            points: habit.pointValue,
            streak,
            notes,
        });

        await completion.save();

        // Update ladder progress
        await updateLadderProgress(session.user.id, habit.pointValue, streak);

        return NextResponse.json(completion, { status: 201 });
    } catch (error) {
        console.error('Error completing habit:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        await connectDB();

        interface QueryFilter {
            userId: string;
            completedAt?: {
                $gte: Date;
                $lte: Date;
            };
        }

        const query: QueryFilter = { userId: session.user.id };

        if (startDate && endDate) {
            query.completedAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const completions = await HabitCompletion.find(query)
            .populate('habitId')
            .sort({ completedAt: -1 });

        return NextResponse.json(completions);
    } catch (error) {
        console.error('Error fetching completions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const habitId = searchParams.get('habitId');

        if (!habitId) {
            return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 });
        }

        await connectDB();

        // Find the today's completion to delete
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const completion = await HabitCompletion.findOne({
            habitId,
            userId: session.user.id,
            completedAt: {
                $gte: todayStart,
                $lte: todayEnd,
            }
        });

        if (!completion) {
            return NextResponse.json({ error: 'Habit completion not found for today' }, { status: 404 });
        }

        // Need to update ladder progress first by subtracting the points
        await updateLadderProgressOnUndo(session.user.id, completion.points);

        // Then delete the completion
        await HabitCompletion.findByIdAndDelete(completion._id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error undoing habit completion:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Function to update ladder progress when undoing a completion
async function updateLadderProgressOnUndo(userId: string, points: number) {
    let progress = await LadderProgress.findOne({ userId });

    if (!progress) {
        return; // Nothing to update
    }

    // Subtract points
    progress.totalPoints = Math.max(0, progress.totalPoints - points);
    progress.weeklyPoints = Math.max(0, progress.weeklyPoints - points);

    // Recalculate level based on total points
    progress.currentLevel = Math.floor(progress.totalPoints / 100);

    // We don't modify streak counts when undoing - that would be more complex

    await progress.save();
}

async function calculateStreak(habitId: string, userId: string, currentDate: Date): Promise<number> {
    let streak = 1;
    let checkDate = subDays(currentDate, 1);

    while (true) {
        const dayStart = startOfDay(checkDate);
        const dayEnd = endOfDay(checkDate);

        const completion = await HabitCompletion.findOne({
            habitId,
            userId,
            completedAt: {
                $gte: dayStart,
                $lte: dayEnd,
            },
        });

        if (completion) {
            streak++;
            checkDate = subDays(checkDate, 1);
        } else {
            break;
        }
    }

    return streak;
}

async function updateLadderProgress(userId: string, points: number, streak: number) {
    let progress = await LadderProgress.findOne({ userId });

    if (!progress) {
        progress = new LadderProgress({ userId });
    }

    progress.totalPoints += points;
    progress.weeklyPoints += points;
    progress.currentStreak = Math.max(progress.currentStreak, streak);
    progress.longestStreak = Math.max(progress.longestStreak, streak);

    // Calculate level based on total points
    progress.currentLevel = Math.floor(progress.totalPoints / 100);

    // Check for achievements
    await checkAndUnlockAchievements(progress, points, streak);

    await progress.save();
}

interface ProgressDocument {
    totalPoints: number;
    currentLevel: number;
    achievements: Achievement[];
}

async function checkAndUnlockAchievements(progress: ProgressDocument & { achievements: Achievement[] }, points: number, streak: number) {
    const achievements: Achievement[] = [];

    // Streak achievements
    if (streak === 7 && !progress.achievements.some((a: Achievement) => a.id === 'week_warrior')) {
        achievements.push({
            id: 'week_warrior',
            title: 'Week Warrior',
            description: 'Complete a habit for 7 days straight',
            icon: '🔥',
            unlockedAt: new Date(),
            type: 'streak',
        });
    }

    if (streak === 30 && !progress.achievements.some((a: Achievement) => a.id === 'month_master')) {
        achievements.push({
            id: 'month_master',
            title: 'Month Master',
            description: 'Complete a habit for 30 days straight',
            icon: '👑',
            unlockedAt: new Date(),
            type: 'streak',
        });
    }

    // Points achievements
    if (progress.totalPoints >= 500 && !progress.achievements.some((a: Achievement) => a.id === 'point_collector')) {
        achievements.push({
            id: 'point_collector',
            title: 'Point Collector',
            description: 'Earn 500 total points',
            icon: '💎',
            unlockedAt: new Date(),
            type: 'points',
        });
    }

    // Level achievements
    if (progress.currentLevel >= 5 && !progress.achievements.some((a: Achievement) => a.id === 'ladder_climber')) {
        achievements.push({
            id: 'ladder_climber',
            title: 'Ladder Climber',
            description: 'Reach level 5',
            icon: '🪜',
            unlockedAt: new Date(),
            type: 'milestone',
        });
    }

    progress.achievements.push(...achievements);
}
