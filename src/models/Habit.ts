import mongoose from 'mongoose';

const HabitSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a habit title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    intensity: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true,
        default: 'medium',
    },
    category: {
        type: String,
        enum: ['health', 'productivity', 'learning', 'mindfulness', 'fitness', 'creative', 'social', 'other'],
        required: true,
        default: 'other',
    },
    targetFrequency: {
        type: String,
        enum: ['daily', 'weekly'],
        default: 'daily',
    },
    pointValue: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Middleware to calculate point value based on intensity
HabitSchema.pre('save', function (next) {
    if (this.isNew || this.isModified('intensity')) {
        switch (this.intensity) {
            case 'easy':
                this.pointValue = 5;
                break;
            case 'medium':
                this.pointValue = 10;
                break;
            case 'hard':
                this.pointValue = 20;
                break;
            default:
                this.pointValue = 10;
        }
    }
    this.updatedAt = new Date();
    next();
});

export default mongoose.models.Habit || mongoose.model('Habit', HabitSchema);
