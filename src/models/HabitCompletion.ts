import mongoose from 'mongoose';

const HabitCompletionSchema = new mongoose.Schema({
    habitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    completedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    points: {
        type: Number,
        required: true,
        min: 1,
    },
    streak: {
        type: Number,
        default: 1,
        min: 0,
    },
    notes: {
        type: String,
        maxlength: [200, 'Notes cannot be more than 200 characters'],
    },
});

// Index for efficient querying
HabitCompletionSchema.index({ userId: 1, completedAt: -1 });
HabitCompletionSchema.index({ habitId: 1, completedAt: -1 });

const HabitCompletion = mongoose.models.HabitCompletion || mongoose.model('HabitCompletion', HabitCompletionSchema);
export default HabitCompletion;
