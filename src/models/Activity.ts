import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
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
    targetFrequency: { // This field might be more relevant for activities that were habits
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'none'], // Added 'monthly' and 'none' for flexibility
        default: 'none', // Default to 'none' if not a recurring activity
    },
    pointValue: {
        type: Number,
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
    // Fields for goal-specific aspects
    isRecurring: { // To distinguish between one-time goals and recurring activities (habits)
        type: Boolean,
        default: false,
    },
    deadline: { // For activities that have a specific end date (goals)
        type: Date,
        optional: true,
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
ActivitySchema.pre('validate', function (this: any, next) {
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
    next();
});

// Update the updatedAt timestamp
ActivitySchema.pre('save', function (this: any, next) {
    this.updatedAt = new Date();
    next();
});

const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
export default Activity;
