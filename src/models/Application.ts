import mongoose, { Document, Schema, Types } from 'mongoose';

interface IStatusHistory {
    status: string;
    timestamp: Date;
    comment?: string;
}

interface ICommitmentRequirements {
    attendingAllSessions: boolean;
    participatingExtra: boolean;
    stayingActive: boolean;
    attendingInPerson: boolean;
}

export interface IApplication extends Document {
    userId: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    currentLocation: string; // New
    commitmentAttendance: 'yes' | 'no' | 'unsure'; // New
    preferredMonth: string; // New
    weekendAvailability: 'both' | 'saturday' | 'sunday' | 'none'; // New
    mainProjectGoal: string; // New
    projectType: 'startup' | 'academic' | 'personal_dev' | 'career_transition' | 'creative' | 'other'; // New
    projectTypeOther?: string; // New
    projectChallenges: string; // New
    goalByDecember: string; // New
    measureSuccess: string; // New
    previousParticipation: 'season1' | 'season2' | 'season3' | 'both' | 'none'; // New
    previousParticipationReason?: string; // New
    projectStage: 'idea' | 'planning' | 'early_dev' | 'mid_dev' | 'near_completion' | 'scaling'; // New
    commitmentUnderstanding: 'yes_all' | 'need_clarification'; // New
    commitmentRequirements: ICommitmentRequirements; // New
    motivation: string; // New
    ensureCompletion: string; // New
    expertiseSkills?: string; // New
    valuableSupport?: string; // New
    additionalComments?: string; // New
    digitalSignature: string; // New
    submissionDate: Date; // New
    whyJoin?: string; // Kept for now, can be removed if not needed
    status: 'draft' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
    rejectionReason?: string;
    statusHistory: IStatusHistory[];
    createdAt: Date;
    updatedAt: Date;
    submittedAt?: Date;
    reviewedAt?: Date;
}

const StatusHistorySchema = new Schema<IStatusHistory>({
    status: { type: String, required: true },
    timestamp: { type: Date, required: true },
    comment: { type: String }
});

const CommitmentRequirementsSchema = new Schema<ICommitmentRequirements>({
    attendingAllSessions: { type: Boolean, default: false },
    participatingExtra: { type: Boolean, default: false },
    stayingActive: { type: Boolean, default: false },
    attendingInPerson: { type: Boolean, default: false }
});

const ApplicationSchema = new Schema<IApplication>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String }, // Removed required constraint to allow drafts
    currentLocation: { type: String }, // New
    commitmentAttendance: {
        type: String,
        enum: ['yes', 'no', 'unsure'],
        validate: {
            validator: function (v: string) {
                // Allow undefined/null for drafts, but validate enum for submitted applications
                if (!v) return true;
                return ['yes', 'no', 'unsure'].includes(v);
            },
            message: 'commitmentAttendance must be one of: yes, no, unsure'
        }
    }, // New
    preferredMonth: { type: String }, // New
    weekendAvailability: {
        type: String,
        enum: ['both', 'saturday', 'sunday', 'none'],
        validate: {
            validator: function (v: string) {
                // Allow undefined/null for drafts, but validate enum for submitted applications
                if (!v) return true;
                return ['both', 'saturday', 'sunday', 'none'].includes(v);
            },
            message: 'weekendAvailability must be one of: both, saturday, sunday, none'
        }
    }, // New
    mainProjectGoal: { type: String }, // New
    projectType: {
        type: String,
        enum: ['startup', 'academic', 'personal_dev', 'career_transition', 'creative', 'other'],
        validate: {
            validator: function (v: string) {
                // Allow undefined/null for drafts, but validate enum for submitted applications
                if (!v) return true;
                return ['startup', 'academic', 'personal_dev', 'career_transition', 'creative', 'other'].includes(v);
            },
            message: 'projectType must be one of: startup, academic, personal_dev, career_transition, creative, other'
        }
    }, // New
    projectTypeOther: { type: String }, // New
    projectChallenges: { type: String }, // New
    goalByDecember: { type: String }, // New
    measureSuccess: { type: String }, // New
    previousParticipation: {
        type: String,
        enum: ['season1', 'season2', 'season3', 'both', 'none'],
        validate: {
            validator: function (v: string) {
                // Allow undefined/null for drafts, but validate enum for submitted applications
                if (!v) return true;
                return ['season1', 'season2', 'season3', 'both', 'none'].includes(v);
            },
            message: 'previousParticipation must be one of: season1, season2, season3, both, none'
        }
    }, // New
    previousParticipationReason: { type: String }, // New
    projectStage: {
        type: String,
        enum: ['idea', 'planning', 'early_dev', 'mid_dev', 'near_completion', 'scaling'],
        validate: {
            validator: function (v: string) {
                // Allow undefined/null for drafts, but validate enum for submitted applications
                if (!v) return true;
                return ['idea', 'planning', 'early_dev', 'mid_dev', 'near_completion', 'scaling'].includes(v);
            },
            message: 'projectStage must be one of: idea, planning, early_dev, mid_dev, near_completion, scaling'
        }
    }, // New
    commitmentUnderstanding: {
        type: String,
        enum: ['yes_all', 'need_clarification'],
        validate: {
            validator: function (v: string) {
                // Allow undefined/null for drafts, but validate enum for submitted applications
                if (!v) return true;
                return ['yes_all', 'need_clarification'].includes(v);
            },
            message: 'commitmentUnderstanding must be one of: yes_all, need_clarification'
        }
    }, // New
    commitmentRequirements: { type: CommitmentRequirementsSchema, default: () => ({}) }, // New
    motivation: { type: String }, // New
    ensureCompletion: { type: String }, // New
    expertiseSkills: { type: String }, // New
    valuableSupport: { type: String }, // New
    additionalComments: { type: String }, // New
    digitalSignature: { type: String }, // New
    submissionDate: { type: Date }, // New
    whyJoin: { type: String }, // Kept for backward compatibility
    status: {
        type: String,
        enum: ['draft', 'submitted', 'reviewed', 'accepted', 'rejected'],
        default: 'draft',
        required: true,
    },
    rejectionReason: { type: String },
    statusHistory: [StatusHistorySchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
});

ApplicationSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    if (this.status === 'submitted' && !this.submittedAt) {
        this.submittedAt = new Date();
    }
    next();
});

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
