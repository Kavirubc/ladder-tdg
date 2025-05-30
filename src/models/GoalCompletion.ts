import mongoose from 'mongoose';

const GoalCompletionSchema = new mongoose.Schema({
    goalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal',
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
GoalCompletionSchema.index({ userId: 1, completedAt: -1 });
GoalCompletionSchema.index({ goalId: 1, completedAt: -1 });

const GoalCompletion = mongoose.models.GoalCompletion || mongoose.model('GoalCompletion', GoalCompletionSchema);
export default GoalCompletion;
