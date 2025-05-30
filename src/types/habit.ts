export interface Habit {
    _id?: string;
    title: string;
    description?: string;
    intensity: 'easy' | 'medium' | 'hard';
    category: 'health' | 'productivity' | 'learning' | 'mindfulness' | 'fitness' | 'creative' | 'social' | 'other';
    targetFrequency: 'daily' | 'weekly';
    pointValue: number;
    user: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface HabitCompletion {
    _id?: string;
    habitId: string;
    userId: string;
    completedAt: Date;
    points: number;
    streak: number;
    notes?: string;
}

export interface LadderProgress {
    _id?: string;
    userId: string;
    currentLevel: number;
    totalPoints: number;
    weeklyPoints: number;
    currentStreak: number;
    longestStreak: number;
    challengeStartDate: Date;
    completedChallenges: number;
    achievements: Achievement[];
    ladderTheme: 'classic' | 'neon' | 'nature' | 'space' | 'minimal';
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    type: 'streak' | 'points' | 'completion' | 'milestone';
}

export interface WeeklyStats {
    week: number;
    totalPoints: number;
    completedHabits: number;
    streak: number;
    achievements: Achievement[];
}

export interface HabitCalendarDay {
    date: Date;
    completedHabits: HabitCompletion[];
    totalPoints: number;
    hasCompletions: boolean;
}

export interface LadderRung {
    level: number;
    pointsRequired: number;
    title: string;
    description: string;
    reward?: string;
}
