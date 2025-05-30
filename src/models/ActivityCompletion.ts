import mongoose from 'mongoose';

const ActivityCompletionSchema = new mongoose.Schema({
    activityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    completedAt: {
        type: Date,
        default: Date.now,
    },
    pointsEarned: {
        type: Number,
        required: true,
    },
    // Optional: Add notes or reflections for the completion
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot be more than 500 characters'],
    },
});

// Ensure a user cannot complete the same recurring activity multiple times on the same day if it's daily
// or in the same week if it's weekly, etc. This logic might need to be more sophisticated
// depending on the exact requirements for recurring activities.
ActivityCompletionSchema.index({ activityId: 1, userId: 1, completedAt: 1 }, { unique: false }); // Adjust uniqueness based on handling of recurring tasks

const ActivityCompletion = mongoose.models.ActivityCompletion || mongoose.model('ActivityCompletion', ActivityCompletionSchema);

export default ActivityCompletion;
