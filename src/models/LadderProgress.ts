import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema({
    id: String,
    title: String,
    description: String,
    icon: String,
    unlockedAt: Date,
    type: {
        type: String,
        enum: ['streak', 'points', 'completion', 'milestone'],
    },
});

const LadderProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    currentLevel: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalPoints: {
        type: Number,
        default: 0,
        min: 0,
    },
    weeklyPoints: {
        type: Number,
        default: 0,
        min: 0,
    },
    currentStreak: {
        type: Number,
        default: 0,
        min: 0,
    },
    longestStreak: {
        type: Number,
        default: 0,
        min: 0,
    },
    challengeStartDate: {
        type: Date,
        default: Date.now,
    },
    completedChallenges: {
        type: Number,
        default: 0,
        min: 0,
    },
    achievements: [AchievementSchema],
    ladderTheme: {
        type: String,
        enum: ['classic', 'neon', 'nature', 'space', 'minimal'],
        default: 'classic',
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt field on save
LadderProgressSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const LadderProgress = mongoose.models.LadderProgress || mongoose.model('LadderProgress', LadderProgressSchema);
export default LadderProgress;
