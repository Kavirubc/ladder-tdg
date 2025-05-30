export interface Goal {
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

export interface GoalCompletion {
    _id?: string;
    goalId: string;
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
    completedGoals: number;
    streak: number;
    achievements: Achievement[];
}

export interface GoalCalendarDay {
    date: Date;
    completedGoals: GoalCompletion[];
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

export interface Todo {
    _id: string;
    title: string;
    description?: string;
    isCompleted: boolean;
    createdAt: string;
    user: string;
    goalId: string; // Changed from habitId to goalId
    isRepetitive?: boolean; // Added for repetitive subtasks
    lastShown?: Date; // Added to track when the task was last shown
}
