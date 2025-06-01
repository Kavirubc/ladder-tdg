import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';

// Helper function to convert empty strings to undefined for enum fields
function normalizeEnumField(value: string | undefined): string | undefined {
    return (value && value.trim() !== '') ? value : undefined;
}

// GET - Fetch user's application
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const application = await Application.findOne({ userId: session.user.id });

        return NextResponse.json({ application });
    } catch (error) {
        console.error('Error fetching application:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create new application
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('Received POST body:', JSON.stringify(body, null, 2));

        const {
            phone,
            currentLocation,
            commitmentAttendance,
            preferredMonth,
            weekendAvailability,
            mainProjectGoal,
            projectType,
            projectTypeOther,
            projectChallenges,
            goalByDecember,
            measureSuccess,
            previousParticipation,
            previousParticipationReason,
            projectStage,
            commitmentUnderstanding,
            commitmentRequirements,
            motivation,
            ensureCompletion,
            expertiseSkills,
            valuableSupport,
            additionalComments,
            digitalSignature,
            submissionDate,
            status = 'draft'
        } = body;

        // Validation for submitted applications
        if (status === 'submitted') {
            if (!phone?.trim()) {
                return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
            }
            if (!currentLocation?.trim()) {
                return NextResponse.json({ error: 'Current location is required' }, { status: 400 });
            }
            if (!commitmentAttendance) {
                return NextResponse.json({ error: 'Commitment attendance is required' }, { status: 400 });
            }
            if (!preferredMonth) {
                return NextResponse.json({ error: 'Preferred month is required' }, { status: 400 });
            }
            if (!weekendAvailability) {
                return NextResponse.json({ error: 'Weekend availability is required' }, { status: 400 });
            }
            if (!mainProjectGoal?.trim()) {
                return NextResponse.json({ error: 'Main project goal is required' }, { status: 400 });
            }
            if (!projectType) {
                return NextResponse.json({ error: 'Project type is required' }, { status: 400 });
            }
            if (projectType === 'other' && !projectTypeOther?.trim()) {
                return NextResponse.json({ error: 'Please specify your project type' }, { status: 400 });
            }
            if (!projectChallenges?.trim()) {
                return NextResponse.json({ error: 'Project challenges are required' }, { status: 400 });
            }
            if (!goalByDecember?.trim()) {
                return NextResponse.json({ error: 'Goal by December is required' }, { status: 400 });
            }
            if (!measureSuccess?.trim()) {
                return NextResponse.json({ error: 'How you measure success is required' }, { status: 400 });
            }
            if (!previousParticipation) {
                return NextResponse.json({ error: 'Previous participation info is required' }, { status: 400 });
            }
            if ((previousParticipation === 'season1' || previousParticipation === 'season2' || previousParticipation === 'season3' || previousParticipation === 'both') && !previousParticipationReason?.trim()) {
                return NextResponse.json({ error: 'Please explain why you couldn\'t complete previous sessions' }, { status: 400 });
            }
            if (!projectStage) {
                return NextResponse.json({ error: 'Project stage is required' }, { status: 400 });
            }
            if (!commitmentUnderstanding) {
                return NextResponse.json({ error: 'Commitment understanding is required' }, { status: 400 });
            }
            if (!motivation?.trim()) {
                return NextResponse.json({ error: 'Motivation is required' }, { status: 400 });
            }
            if (!ensureCompletion?.trim()) {
                return NextResponse.json({ error: 'How you will ensure completion is required' }, { status: 400 });
            }
            if (!digitalSignature?.trim()) {
                return NextResponse.json({ error: 'Digital signature is required' }, { status: 400 });
            }
            if (digitalSignature?.toLowerCase() !== session.user.name?.toLowerCase()) {
                return NextResponse.json({ error: 'Digital signature must match your full name' }, { status: 400 });
            }
        }

        await connectDB();

        // Check if application already exists
        const existingApplication = await Application.findOne({ userId: session.user.id });
        if (existingApplication) {
            return NextResponse.json({ error: 'Application already exists' }, { status: 400 });
        }

        const application = new Application({
            userId: session.user.id,
            name: session.user.name,
            email: session.user.email,
            phone: phone || '',
            currentLocation: currentLocation || '',
            commitmentAttendance: normalizeEnumField(commitmentAttendance),
            preferredMonth,
            weekendAvailability: normalizeEnumField(weekendAvailability),
            mainProjectGoal: mainProjectGoal || '',
            projectType: normalizeEnumField(projectType),
            projectTypeOther,
            projectChallenges: projectChallenges || '',
            goalByDecember: goalByDecember || '',
            measureSuccess: measureSuccess || '',
            previousParticipation: normalizeEnumField(previousParticipation),
            previousParticipationReason,
            projectStage: normalizeEnumField(projectStage),
            commitmentUnderstanding: normalizeEnumField(commitmentUnderstanding),
            commitmentRequirements: commitmentRequirements || {
                attendingAllSessions: false,
                participatingExtra: false,
                stayingActive: false,
                attendingInPerson: false
            },
            motivation: motivation || '',
            ensureCompletion: ensureCompletion || '',
            expertiseSkills,
            valuableSupport,
            additionalComments,
            digitalSignature: digitalSignature || '',
            submissionDate: submissionDate ? new Date(submissionDate) : new Date(),
            status,
        });

        await application.save();

        return NextResponse.json({ application }, { status: 201 });
    } catch (error) {
        console.error('Error creating application:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update existing application
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('Received PUT body:', JSON.stringify(body, null, 2));

        const {
            phone,
            currentLocation,
            commitmentAttendance,
            preferredMonth,
            weekendAvailability,
            mainProjectGoal,
            projectType,
            projectTypeOther,
            projectChallenges,
            goalByDecember,
            measureSuccess,
            previousParticipation,
            previousParticipationReason,
            projectStage,
            commitmentUnderstanding,
            commitmentRequirements,
            motivation,
            ensureCompletion,
            expertiseSkills,
            valuableSupport,
            additionalComments,
            digitalSignature,
            submissionDate,
            status
        } = body;

        // Validation for submitted applications
        if (status === 'submitted') {
            if (!phone?.trim()) {
                return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
            }
            if (!currentLocation?.trim()) {
                return NextResponse.json({ error: 'Current location is required' }, { status: 400 });
            }
            if (!commitmentAttendance) {
                return NextResponse.json({ error: 'Commitment attendance is required' }, { status: 400 });
            }
            if (!preferredMonth) {
                return NextResponse.json({ error: 'Preferred month is required' }, { status: 400 });
            }
            if (!weekendAvailability) {
                return NextResponse.json({ error: 'Weekend availability is required' }, { status: 400 });
            }
            if (!mainProjectGoal?.trim()) {
                return NextResponse.json({ error: 'Main project goal is required' }, { status: 400 });
            }
            if (!projectType) {
                return NextResponse.json({ error: 'Project type is required' }, { status: 400 });
            }
            if (projectType === 'other' && !projectTypeOther?.trim()) {
                return NextResponse.json({ error: 'Please specify your project type' }, { status: 400 });
            }
            if (!projectChallenges?.trim()) {
                return NextResponse.json({ error: 'Project challenges are required' }, { status: 400 });
            }
            if (!goalByDecember?.trim()) {
                return NextResponse.json({ error: 'Goal by December is required' }, { status: 400 });
            }
            if (!measureSuccess?.trim()) {
                return NextResponse.json({ error: 'How you measure success is required' }, { status: 400 });
            }
            if (!previousParticipation) {
                return NextResponse.json({ error: 'Previous participation info is required' }, { status: 400 });
            }
            if ((previousParticipation === 'season1' || previousParticipation === 'season2' || previousParticipation === 'season3' || previousParticipation === 'both') && !previousParticipationReason?.trim()) {
                return NextResponse.json({ error: 'Please explain why you couldn\'t complete previous sessions' }, { status: 400 });
            }
            if (!projectStage) {
                return NextResponse.json({ error: 'Project stage is required' }, { status: 400 });
            }
            if (!commitmentUnderstanding) {
                return NextResponse.json({ error: 'Commitment understanding is required' }, { status: 400 });
            }
            if (!motivation?.trim()) {
                return NextResponse.json({ error: 'Motivation is required' }, { status: 400 });
            }
            if (!ensureCompletion?.trim()) {
                return NextResponse.json({ error: 'How you will ensure completion is required' }, { status: 400 });
            }
            if (!digitalSignature?.trim()) {
                return NextResponse.json({ error: 'Digital signature is required' }, { status: 400 });
            }
            if (digitalSignature?.toLowerCase() !== session.user.name?.toLowerCase()) {
                return NextResponse.json({ error: 'Digital signature must match your full name' }, { status: 400 });
            }
        }

        await connectDB();

        const updateData: any = {
            phone: phone || '',
            currentLocation: currentLocation || '',
            commitmentAttendance: normalizeEnumField(commitmentAttendance),
            preferredMonth,
            weekendAvailability: normalizeEnumField(weekendAvailability),
            mainProjectGoal: mainProjectGoal || '',
            projectType: normalizeEnumField(projectType),
            projectTypeOther,
            projectChallenges: projectChallenges || '',
            goalByDecember: goalByDecember || '',
            measureSuccess: measureSuccess || '',
            previousParticipation: normalizeEnumField(previousParticipation),
            previousParticipationReason,
            projectStage: normalizeEnumField(projectStage),
            commitmentUnderstanding: normalizeEnumField(commitmentUnderstanding),
            commitmentRequirements: commitmentRequirements || {
                attendingAllSessions: false,
                participatingExtra: false,
                stayingActive: false,
                attendingInPerson: false
            },
            motivation: motivation || '',
            ensureCompletion: ensureCompletion || '',
            expertiseSkills,
            valuableSupport,
            additionalComments,
            digitalSignature: digitalSignature || '',
            submissionDate: submissionDate ? new Date(submissionDate) : new Date(),
            status,
            updatedAt: new Date(),
        };

        if (status === 'submitted') {
            updateData.submittedAt = new Date();
        }

        const application = await Application.findOneAndUpdate(
            { userId: session.user.id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json({ application });
    } catch (error) {
        console.error('Error updating application:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
