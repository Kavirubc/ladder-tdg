export interface Activity {
    _id: string;
    title: string;
    description?: string;
    intensity: 'easy' | 'medium' | 'hard';
    category: 'health' | 'productivity' | 'learning' | 'mindfulness' | 'fitness' | 'creative' | 'social' | 'other';
    targetFrequency?: 'daily' | 'weekly' | 'monthly' | 'none';
    pointValue?: number;
    user: string; // Assuming user is represented by its ID
    isActive?: boolean;
    isRecurring?: boolean;
    deadline?: string; // Or Date, depending on how it's handled post-fetch
    createdAt?: string; // Or Date
    updatedAt?: string; // Or Date
    // Add any other fields that are relevant from the backend model
    // For example, if you plan to populate Todos within an Activity on the frontend:
    // todos?: Todo[]; 
}

export interface ActivityCompletion {
    _id: string;
    activityId: string | Activity; // Can be populated
    userId: string;
    completedAt: string; // Or Date
    pointsEarned: number;
    notes?: string;
}

export interface Todo {
    _id: string;
    title: string;
    description?: string;
    activityId: string; // Reference to the parent Activity
    isCompleted: boolean;
    isArchived?: boolean;
    archivedAt?: string; // Or Date
    isRepetitive?: boolean;
    lastShown?: string; // Or Date
    user: string;
    createdAt?: string; // Or Date
    updatedAt?: string; // Or Date
    category?: string; // Example: 'Work', 'Personal', 'Urgent'
    priority?: string; // Example: 'High', 'Medium', 'Low'
    dueDate?: string; // Or Date
}

// You might also want a type for the combined progress/stats
export interface ActivityProgressStats {
    totalPoints: number;
    level: number;
    recentCompletionsCount: number;
    // Potentially more detailed stats here
}

// Enum for categories if you want to use it in the frontend for forms, filters etc.
export enum ActivityCategory {
    Health = 'health',
    Productivity = 'productivity',
    Learning = 'learning',
    Mindfulness = 'mindfulness',
    Fitness = 'fitness',
    Creative = 'creative',
    Social = 'social',
    Other = 'other',
}

// Enum for intensity
export enum ActivityIntensity {
    Easy = 'easy',
    Medium = 'medium',
    Hard = 'hard',
}

// Enum for frequency
export enum ActivityFrequency {
    Daily = 'daily',
    Weekly = 'weekly',
    Monthly = 'monthly',
    None = 'none',
}
