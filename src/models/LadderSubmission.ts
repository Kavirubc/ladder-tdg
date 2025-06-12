import mongoose from 'mongoose';

// Schema for submission responses
const SubmissionResponseSchema = new mongoose.Schema({
    fieldId: {
        type: String,
        required: true,
    },
    value: mongoose.Schema.Types.Mixed, // Can be string, array, or object
});

// Schema for ladder submissions
const LadderSubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    week: {
        type: String,
        required: true,
        enum: ['week1', 'week2', 'week3', 'week4', 'complete'],
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LadderQuestion',
        required: true,
    },
    responses: [SubmissionResponseSchema],
    status: {
        type: String,
        default: 'draft',
        enum: ['draft', 'submitted', 'reviewed', 'approved', 'rejected'],
    },
    submittedAt: {
        type: Date,
    },
    reviewedAt: {
        type: Date,
    },
    reviewedBy: {
        type: String, // Admin email who reviewed
    },
    reviewComments: {
        type: String,
    },
    score: {
        type: Number,
        min: 0,
        max: 100,
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

// Compound index to ensure one submission per user per week
LadderSubmissionSchema.index({ userId: 1, week: 1 }, { unique: true });

// Update the updatedAt field before saving
LadderSubmissionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    if (this.status === 'submitted' && !this.submittedAt) {
        this.submittedAt = new Date();
    }
    next();
});

const LadderSubmission = mongoose.models.LadderSubmission || mongoose.model('LadderSubmission', LadderSubmissionSchema);

export default LadderSubmission;
