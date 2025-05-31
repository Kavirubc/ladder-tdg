import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    whyJoin: {
        type: String,
        required: true,
        minlength: 50,
        maxlength: 1000,
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'reviewed', 'accepted', 'rejected'],
        default: 'draft',
    },
    submittedAt: {
        type: Date,
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

// Update the updatedAt field before saving
ApplicationSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    if (this.status === 'submitted' && !this.submittedAt) {
        this.submittedAt = new Date();
    }
    next();
});

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
