import mongoose from 'mongoose';

// Schema for individual question fields
const QuestionFieldSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['text', 'textarea', 'select', 'radio', 'checkbox', 'file'],
    },
    label: {
        type: String,
        required: true,
    },
    placeholder: {
        type: String,
    },
    required: {
        type: Boolean,
        default: false,
    },
    options: [{
        value: String,
        label: String,
    }],
    validation: {
        minLength: Number,
        maxLength: Number,
        pattern: String,
    },
});

// Schema for ladder questions
const LadderQuestionSchema = new mongoose.Schema({
    week: {
        type: String,
        required: true,
        enum: ['week1', 'week2', 'week3', 'week4', 'complete'],
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    fields: [QuestionFieldSchema],
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
    createdBy: {
        type: String,
        required: true, // Admin email who created this
    },
});

// Update the updatedAt field before saving
LadderQuestionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const LadderQuestion = mongoose.models.LadderQuestion || mongoose.model('LadderQuestion', LadderQuestionSchema);

export default LadderQuestion;
