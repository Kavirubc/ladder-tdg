'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Session } from 'next-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "./ui/textarea"; // Assuming you have a Textarea component
import {
    Loader2,
    CheckCircle,
    XCircle,
    FileText,
    Clock,
    AlertCircle,
    User,
    CalendarDays,
    Target,
    Briefcase,
    HelpCircle,
    Info,
    PenTool
} from 'lucide-react';

interface ApplicationFormProps {
    session: Session;
}

interface FormData {
    id?: string;
    name: string;
    email: string;
    phone: string;
    currentLocation: string;
    commitmentAttendance: 'yes' | 'no' | 'unsure' | '';
    preferredMonth: string;
    weekendAvailability: 'both' | 'saturday' | 'sunday' | 'none' | '';
    mainProjectGoal: string;
    projectType: 'startup' | 'academic' | 'personal_dev' | 'career_transition' | 'creative' | 'other' | '';
    projectTypeOther?: string;
    projectChallenges: string;
    goalByDecember: string;
    measureSuccess: string;
    previousParticipation: 'season1' | 'season2' | 'both' | 'none' | '';
    previousParticipationReason?: string;
    projectStage: 'idea' | 'planning' | 'early_dev' | 'mid_dev' | 'near_completion' | 'scaling' | '';
    commitmentUnderstanding: 'yes_all' | 'need_clarification' | '';
    commitmentRequirements: {
        attendingAllSessions: boolean;
        participatingExtra: boolean;
        stayingActive: boolean;
        attendingInPerson: boolean;
    };
    motivation: string;
    ensureCompletion: string;
    expertiseSkills?: string;
    valuableSupport?: string;
    additionalComments?: string;
    digitalSignature: string;
    submissionDate: string; // Store as ISO string
    status: 'draft' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
    rejectionReason?: string;
}

interface Message {
    type: 'success' | 'error';
    text: string;
}

const initialFormData: Omit<FormData, 'id' | 'status' | 'rejectionReason' | 'name' | 'email'> = {
    phone: '',
    currentLocation: '',
    commitmentAttendance: '',
    preferredMonth: '',
    weekendAvailability: '',
    mainProjectGoal: '',
    projectType: '',
    projectTypeOther: '',
    projectChallenges: '',
    goalByDecember: '',
    measureSuccess: '',
    previousParticipation: '',
    previousParticipationReason: '',
    projectStage: '',
    commitmentUnderstanding: '',
    commitmentRequirements: {
        attendingAllSessions: false,
        participatingExtra: false,
        stayingActive: false,
        attendingInPerson: false,
    },
    motivation: '',
    ensureCompletion: '',
    expertiseSkills: '',
    valuableSupport: '',
    additionalComments: '',
    digitalSignature: '',
    submissionDate: new Date().toISOString(),
};

export default function ApplicationForm({ session }: ApplicationFormProps) {
    const [formData, setFormData] = useState<FormData>(() => ({
        ...initialFormData,
        name: session.user?.name || '',
        email: session.user?.email || '',
        status: 'draft',
    }));

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);

    const isSubmitted = formData.status === 'submitted';
    const isAccepted = formData.status === 'accepted';
    const isRejected = formData.status === 'rejected';
    const isReadOnly = isSubmitted || isAccepted || isRejected;

    useEffect(() => {
        loadExistingApplication();
    }, []);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    useEffect(() => {
        if (formData.status === 'accepted') {
            setShowSuccessModal(true);
        } else if (formData.status === 'rejected') {
            setShowRejectionModal(true);
        }
    }, [formData.status]);

    const loadExistingApplication = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/applications');
            if (response.ok) {
                const data = await response.json();
                if (data.application) {
                    // Ensure commitmentRequirements is initialized if not present
                    const appData = {
                        ...data.application,
                        commitmentRequirements: data.application.commitmentRequirements || initialFormData.commitmentRequirements
                    };
                    setFormData(appData);
                } else {
                    // If no existing application, ensure date is current
                    setFormData(prev => ({ ...prev, submissionDate: new Date().toISOString() }));
                }
            } else {
                setFormData(prev => ({ ...prev, submissionDate: new Date().toISOString() }));
            }
        } catch (error) {
            console.error('Error loading application:', error);
            setMessage({ type: 'error', text: 'Failed to load application data.' });
            setFormData(prev => ({ ...prev, submissionDate: new Date().toISOString() }));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name: keyof FormData['commitmentRequirements']) => {
        setFormData(prev => ({
            ...prev,
            commitmentRequirements: {
                ...prev.commitmentRequirements,
                [name]: !prev.commitmentRequirements[name]
            }
        }));
    };

    const validateForm = (): boolean => {
        if (!formData.phone.trim()) { setMessage({ type: 'error', text: 'Phone number is required.' }); return false; }
        if (!formData.currentLocation.trim()) { setMessage({ type: 'error', text: 'Current location is required.' }); return false; }
        if (!formData.commitmentAttendance) { setMessage({ type: 'error', text: 'Please answer the commitment question.' }); return false; }
        if (!formData.preferredMonth) { setMessage({ type: 'error', text: 'Please select your preferred month.' }); return false; }
        if (!formData.weekendAvailability) { setMessage({ type: 'error', text: 'Please indicate your weekend availability.' }); return false; }
        if (!formData.mainProjectGoal.trim()) { setMessage({ type: 'error', text: 'Main project/goal is required.' }); return false; }
        if (!formData.projectType) { setMessage({ type: 'error', text: 'Please select your project type.' }); return false; }
        if (formData.projectType === 'other' && !formData.projectTypeOther?.trim()) { setMessage({ type: 'error', text: 'Please specify your project type if other.' }); return false; }
        if (!formData.projectChallenges.trim()) { setMessage({ type: 'error', text: 'Project challenges are required.' }); return false; }
        if (!formData.goalByDecember.trim()) { setMessage({ type: 'error', text: 'Goal by December is required.' }); return false; }
        if (!formData.measureSuccess.trim()) { setMessage({ type: 'error', text: 'How you measure success is required.' }); return false; }
        if (!formData.previousParticipation) { setMessage({ type: 'error', text: 'Please answer about previous participation.' }); return false; }
        if ((formData.previousParticipation === 'season1' || formData.previousParticipation === 'season2' || formData.previousParticipation === 'both') && !formData.previousParticipationReason?.trim()) {
            setMessage({ type: 'error', text: 'Please explain why you couldn\'t complete previous sessions.' }); return false;
        }
        if (!formData.projectStage) { setMessage({ type: 'error', text: 'Please select your project stage.' }); return false; }
        if (!formData.commitmentUnderstanding) { setMessage({ type: 'error', text: 'Please confirm your understanding of commitments.' }); return false; }
        if (!Object.values(formData.commitmentRequirements).every(Boolean) && formData.commitmentUnderstanding === 'yes_all') {
            setMessage({ type: 'error', text: 'Please check all commitment requirements if you understand them.' });
            // return false; // Commenting out as per UX, allow submission even if not all checked initially
        }
        if (!formData.motivation.trim()) { setMessage({ type: 'error', text: 'Motivation is required.' }); return false; }
        if (!formData.ensureCompletion.trim()) { setMessage({ type: 'error', text: 'How you will ensure completion is required.' }); return false; }
        if (!formData.digitalSignature.trim()) { setMessage({ type: 'error', text: 'Digital signature is required.' }); return false; }
        if (formData.digitalSignature.toLowerCase() !== formData.name.toLowerCase()) {
            setMessage({ type: 'error', text: 'Digital signature must match your full name.' }); return false;
        }
        return true;
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const method = formData.id ? 'PUT' : 'POST';
            console.log('Save Draft - Method:', method, 'FormData.id:', formData.id);

            const response = await fetch('/api/applications', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, status: 'draft', submissionDate: new Date().toISOString() }),
            });
            const data = await response.json();
            console.log('Save Draft Response:', response.status, data);

            if (response.ok) {
                setFormData(prev => ({ ...prev, id: data.application._id, status: 'draft' }));
                setMessage({ type: 'success', text: 'Draft saved successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save draft' });
            }
        } catch (error) {
            console.error('Save Draft Error:', error);
            setMessage({ type: 'error', text: 'An error occurred while saving draft' });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        setMessage(null);
        try {
            const method = formData.id ? 'PUT' : 'POST';
            console.log('Submit - Method:', method, 'FormData.id:', formData.id);

            const response = await fetch('/api/applications', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, status: 'submitted', submissionDate: new Date().toISOString(), submittedAt: new Date().toISOString() }),
            });
            const data = await response.json();
            console.log('Submit Response:', response.status, data);

            if (response.ok) {
                setFormData(prev => ({ ...prev, id: data.application._id, status: 'submitted' }));
                setMessage({ type: 'success', text: 'Application submitted successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to submit application' });
            }
        } catch (error) {
            console.error('Submit Error:', error);
            setMessage({ type: 'error', text: 'An error occurred while submitting' });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft': return <FileText className="h-5 w-5 text-gray-600" />;
            case 'submitted': return <Clock className="h-5 w-5 text-blue-600" />;
            case 'reviewed': return <Clock className="h-5 w-5 text-yellow-600" />;
            case 'accepted': return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
            default: return <FileText className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'draft': return 'Draft saved - you can continue editing';
            case 'submitted': return 'Application submitted - under review';
            case 'reviewed': return 'Application under review';
            case 'accepted': return 'Congratulations! Your application has been accepted';
            case 'rejected': return 'Application not approved';
            default: return 'Ready to fill out your application';
        }
    };

    const months = [
        "June 2025", "July 2025", "August 2025",
        "September 2025", "October 2025", "November 2025", "December 2025"
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex justify-center w-full">
            <div className="min-w-4xl max-w-4xl w-full">
                {formData.status && formData.status !== 'draft' && (
                    <div className={`p-4 rounded-lg border ${formData.status === 'submitted' ? 'bg-blue-50 border-blue-200' :
                        formData.status === 'reviewed' ? 'bg-yellow-50 border-yellow-200' :
                            formData.status === 'accepted' ? 'bg-green-50 border-green-200' :
                                formData.status === 'rejected' ? 'bg-red-50 border-red-200' :
                                    'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="flex items-center gap-3">
                            {getStatusIcon(formData.status)}
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                    {getStatusText(formData.status)}
                                </p>
                                <Badge
                                    variant={
                                        formData.status === 'submitted' ? 'default' :
                                            formData.status === 'reviewed' ? 'secondary' :
                                                formData.status === 'accepted' ? 'default' :
                                                    formData.status === 'rejected' ? 'destructive' :
                                                        'secondary'
                                    }
                                    className="mt-1"
                                >
                                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}

                <Card className="shadow-lg">
                    <CardHeader className="bg-gray-50 dark:bg-gray-800 p-6 rounded-t-lg">
                        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                            <PenTool className="h-7 w-7 text-primary" />
                            Ladder Program Application
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-300">
                            Please fill out this form carefully. Your responses will help us understand your goals and commitment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8 p-6">
                            {message && (
                                <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{message.text}</AlertDescription>
                                </Alert>
                            )}

                            {/* Personal Information Section */}
                            <section className="space-y-6 p-6 border rounded-lg bg-white dark:bg-gray-800/30 shadow-sm">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    <User className="h-6 w-6 text-primary" /> Personal Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" value={formData.name} disabled className="bg-gray-100 dark:bg-gray-700" />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Auto-populated from your account.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" value={formData.email} disabled className="bg-gray-100 dark:bg-gray-700" />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Auto-populated from your account.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number *</Label>
                                        <Input id="phone" name="phone" type="tel" placeholder="e.g., +1 123 456 7890" value={formData.phone} onChange={handleChange} disabled={isReadOnly} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="currentLocation">Current Location *</Label>
                                        <Input id="currentLocation" name="currentLocation" placeholder="e.g., City, Country" value={formData.currentLocation} onChange={handleChange} disabled={isReadOnly} required />
                                    </div>
                                </div>
                            </section>

                            {/* Commitment & Availability Section */}
                            <section className="space-y-6 p-6 border rounded-lg bg-white dark:bg-gray-800/30 shadow-sm">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    <CalendarDays className="h-6 w-6 text-primary" /> Commitment & Availability
                                </h2>
                                <div className="space-y-2">
                                    <Label>Can you commit to attending ALL 4 sessions during your assigned month? (3 online + 1 in-person at WORX Co-Working) *</Label>
                                    <Select name="commitmentAttendance" onValueChange={(value) => handleSelectChange("commitmentAttendance", value)} value={formData.commitmentAttendance} disabled={isReadOnly} required>
                                        <SelectTrigger><SelectValue placeholder="Select your commitment" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yes">Yes, I can fully commit</SelectItem>
                                            <SelectItem value="no">No, I have scheduling conflicts</SelectItem>
                                            <SelectItem value="unsure">Unsure at this time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Which month would work best for your participation? *</Label>
                                    <Select name="preferredMonth" onValueChange={(value) => handleSelectChange("preferredMonth", value)} value={formData.preferredMonth} disabled={isReadOnly} required>
                                        <SelectTrigger><SelectValue placeholder="Select a month" /></SelectTrigger>
                                        <SelectContent>
                                            {months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Are you available for weekend sessions (max 30 minutes via Google Meet)? *</Label>
                                    <Select name="weekendAvailability" onValueChange={(value) => handleSelectChange("weekendAvailability", value)} value={formData.weekendAvailability} disabled={isReadOnly} required>
                                        <SelectTrigger><SelectValue placeholder="Select your availability" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="both">Yes, both Saturday and Sunday</SelectItem>
                                            <SelectItem value="saturday">Yes, but only Saturday</SelectItem>
                                            <SelectItem value="sunday">Yes, but only Sunday</SelectItem>
                                            <SelectItem value="none">No, weekends don't work for me</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </section>

                            {/* Goals & Projects Section */}
                            <section className="space-y-6 p-6 border rounded-lg bg-white dark:bg-gray-800/30 shadow-sm">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Target className="h-6 w-6 text-primary" /> Goals & Projects
                                </h2>
                                <div className="space-y-2">
                                    <Label htmlFor="mainProjectGoal">What is your main project/goal you want to work on from June to December 2025? *</Label>
                                    <Textarea id="mainProjectGoal" name="mainProjectGoal" placeholder="Describe your main project or goal..." value={formData.mainProjectGoal} onChange={handleChange} disabled={isReadOnly} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>What type of project is this? *</Label>
                                    <Select name="projectType" onValueChange={(value) => handleSelectChange("projectType", value)} value={formData.projectType} disabled={isReadOnly} required>
                                        <SelectTrigger><SelectValue placeholder="Select project type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="startup">Startup/Business venture</SelectItem>
                                            <SelectItem value="academic">University/Academic project</SelectItem>
                                            <SelectItem value="personal_dev">Personal development goal</SelectItem>
                                            <SelectItem value="career_transition">Career transition</SelectItem>
                                            <SelectItem value="creative">Creative project</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.projectType === 'other' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="projectTypeOther">If other, please specify: *</Label>
                                        <Input id="projectTypeOther" name="projectTypeOther" value={formData.projectTypeOther} onChange={handleChange} disabled={isReadOnly} required />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="projectChallenges">What specific challenges are you currently facing with this project? *</Label>
                                    <Textarea id="projectChallenges" name="projectChallenges" placeholder="Describe your challenges..." value={formData.projectChallenges} onChange={handleChange} disabled={isReadOnly} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="goalByDecember">What do you hope to achieve by the end of December 2025? *</Label>
                                    <Textarea id="goalByDecember" name="goalByDecember" placeholder="Describe your desired outcomes..." value={formData.goalByDecember} onChange={handleChange} disabled={isReadOnly} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="measureSuccess">How would you measure success for your project? *</Label>
                                    <Textarea id="measureSuccess" name="measureSuccess" placeholder="e.g., KPIs, milestones, qualitative feedback..." value={formData.measureSuccess} onChange={handleChange} disabled={isReadOnly} required />
                                </div>
                            </section>

                            {/* Experience & Background Section */}
                            <section className="space-y-6 p-6 border rounded-lg bg-white dark:bg-gray-800/30 shadow-sm">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Briefcase className="h-6 w-6 text-primary" /> Experience & Background
                                </h2>
                                <div className="space-y-2">
                                    <Label>Have you participated in our previous seasons (Season 1 or 2)? *</Label>
                                    <Select name="previousParticipation" onValueChange={(value) => handleSelectChange("previousParticipation", value)} value={formData.previousParticipation} disabled={isReadOnly} required>
                                        <SelectTrigger><SelectValue placeholder="Select your experience" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="season1">Yes, Season 1</SelectItem>
                                            <SelectItem value="season2">Yes, Season 2</SelectItem>
                                            <SelectItem value="both">Yes, both seasons</SelectItem>
                                            <SelectItem value="none">No, this is my first time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {(formData.previousParticipation === 'season1' || formData.previousParticipation === 'season2' || formData.previousParticipation === 'both') && (
                                    <div className="space-y-2">
                                        <Label htmlFor="previousParticipationReason">If you participated before, what prevented you from completing all sessions? *</Label>
                                        <Textarea id="previousParticipationReason" name="previousParticipationReason" value={formData.previousParticipationReason} onChange={handleChange} disabled={isReadOnly} required />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>What's your current stage with your project? *</Label>
                                    <Select name="projectStage" onValueChange={(value) => handleSelectChange("projectStage", value)} value={formData.projectStage} disabled={isReadOnly} required>
                                        <SelectTrigger><SelectValue placeholder="Select project stage" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="idea">Just an idea</SelectItem>
                                            <SelectItem value="planning">Planning phase</SelectItem>
                                            <SelectItem value="early_dev">Early development</SelectItem>
                                            <SelectItem value="mid_dev">Mid-development</SelectItem>
                                            <SelectItem value="near_completion">Near completion</SelectItem>
                                            <SelectItem value="scaling">Looking to scale/improve</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </section>

                            {/* Commitment Understanding Section */}
                            <section className="space-y-6 p-6 border rounded-lg bg-white dark:bg-gray-800/30 shadow-sm">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    <HelpCircle className="h-6 w-6 text-primary" /> Commitment Understanding
                                </h2>
                                <div className="space-y-2">
                                    <Label>Do you understand that this program requires: *</Label>
                                    <Select name="commitmentUnderstanding" onValueChange={(value) => handleSelectChange("commitmentUnderstanding", value)} value={formData.commitmentUnderstanding} disabled={isReadOnly} required>
                                        <SelectTrigger><SelectValue placeholder="Select your understanding" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yes_all">Yes, I understand ALL requirements</SelectItem>
                                            <SelectItem value="need_clarification">I need clarification on some points</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3 p-4 border rounded-md bg-gray-50 dark:bg-gray-700/50">
                                    <h3 className="font-medium text-gray-700 dark:text-gray-200">Requirements Checklist:</h3>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="req1" checked={formData.commitmentRequirements.attendingAllSessions} onCheckedChange={() => handleCheckboxChange('attendingAllSessions')} disabled={isReadOnly} />
                                        <Label htmlFor="req1" className="font-normal text-sm text-gray-600 dark:text-gray-300">Attending ALL review sessions during my assigned month</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="req2" checked={formData.commitmentRequirements.participatingExtra} onCheckedChange={() => handleCheckboxChange('participatingExtra')} disabled={isReadOnly} />
                                        <Label htmlFor="req2" className="font-normal text-sm text-gray-600 dark:text-gray-300">Participating in additional small sessions and meetups</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="req3" checked={formData.commitmentRequirements.stayingActive} onCheckedChange={() => handleCheckboxChange('stayingActive')} disabled={isReadOnly} />
                                        <Label htmlFor="req3" className="font-normal text-sm text-gray-600 dark:text-gray-300">Staying actively engaged throughout participation</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="req4" checked={formData.commitmentRequirements.attendingInPerson} onCheckedChange={() => handleCheckboxChange('attendingInPerson')} disabled={isReadOnly} />
                                        <Label htmlFor="req4" className="font-normal text-sm text-gray-600 dark:text-gray-300">Attending 1 in-person session at WORX Co-Working</Label>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="motivation">What motivates you to commit to this intensive program? *</Label>
                                    <Textarea id="motivation" name="motivation" placeholder="Share your motivations..." value={formData.motivation} onChange={handleChange} disabled={isReadOnly} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ensureCompletion">How will you ensure you don't drop out mid-way through your assigned month? *</Label>
                                    <Textarea id="ensureCompletion" name="ensureCompletion" placeholder="Describe your strategies..." value={formData.ensureCompletion} onChange={handleChange} disabled={isReadOnly} required />
                                </div>
                            </section>

                            {/* Additional Information Section */}
                            <section className="space-y-6 p-6 border rounded-lg bg-white dark:bg-gray-800/30 shadow-sm">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                    <Info className="h-6 w-6 text-primary" /> Additional Information
                                </h2>
                                <div className="space-y-2">
                                    <Label htmlFor="expertiseSkills">Do you have any specific expertise or skills that could benefit other participants?</Label>
                                    <Textarea id="expertiseSkills" name="expertiseSkills" placeholder="e.g., Marketing, Coding, Design..." value={formData.expertiseSkills} onChange={handleChange} disabled={isReadOnly} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="valuableSupport">What type of support or connections would be most valuable for your project?</Label>
                                    <Textarea id="valuableSupport" name="valuableSupport" placeholder="e.g., Mentorship, Funding, Technical advice..." value={formData.valuableSupport} onChange={handleChange} disabled={isReadOnly} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="additionalComments">Any additional comments or questions?</Label>
                                    <Textarea id="additionalComments" name="additionalComments" placeholder="Share any other thoughts..." value={formData.additionalComments} onChange={handleChange} disabled={isReadOnly} />
                                </div>
                            </section>

                            {/* Final Commitment Statement Section */}
                            <section className="space-y-6 p-6 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20 shadow-md">
                                <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                                    <AlertCircle className="h-6 w-6 text-red-600" /> Final Commitment Statement
                                </h2>
                                <div className="space-y-2 text-sm text-red-700 dark:text-red-200">
                                    <p>By submitting this form, I confirm that:</p>
                                    <ul className="list-disc list-inside space-y-1 pl-4">
                                        <li>I have read and understood all requirements</li>
                                        <li>I am genuinely committed to participating fully during my assigned month</li>
                                        <li>I understand that inconsistent participation affects the entire group</li>
                                        <li>I am ready to actively work on my goals and engage with the community</li>
                                    </ul>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <div className="space-y-2">
                                        <Label htmlFor="digitalSignature">Digital Signature (Type your full name) *</Label>
                                        <Input id="digitalSignature" name="digitalSignature" placeholder="Your Full Name" value={formData.digitalSignature} onChange={handleChange} disabled={isReadOnly} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Input id="submissionDate" type="date" value={(typeof formData.submissionDate === 'string' && formData.submissionDate) ? formData.submissionDate.split('T')[0] : ''} disabled className="bg-gray-100 dark:bg-gray-700" />
                                    </div>
                                </div>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-4">
                                    <strong>Note:</strong> Only submit this form if you can honestly commit to the full program. We're looking for 15 dedicated participants who will make the most of this opportunity!
                                </p>
                            </section>

                            {/* Action Buttons */}
                            {!isReadOnly && (
                                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSaveDraft}
                                        disabled={saving || submitting}
                                        className="flex-1"
                                    >
                                        {saving ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Draft...</>
                                        ) : 'Save Draft'}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={saving || submitting}
                                        className="flex-1 bg-primary hover:bg-primary/90 text-white"
                                    >
                                        {submitting ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting Application...</>
                                        ) : 'Submit Application'}
                                    </Button>
                                </div>
                            )}

                            {isSubmitted && (
                                <div className="mt-6 flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                    <span className="text-sm text-green-700 dark:text-green-400">
                                        Application submitted successfully! We'll review it and get back to you soon.
                                    </span>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Success Modal */}
                <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                    <DialogContent className="sm:max-w-md p-6">
                        <DialogHeader className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <CheckCircle className="h-7 w-7 text-green-600" />
                            </div>
                            <DialogTitle className="text-2xl font-bold">Congratulations!</DialogTitle>
                        </DialogHeader>
                        <DialogDescription className="text-center text-gray-600 dark:text-gray-300 space-y-3 mt-2">
                            <div>
                                Your application to the Ladder program has been <strong>approved</strong>!
                                We're excited to have you join our community.
                            </div>
                            <div>
                                Please wait for an email with further instructions and next steps.
                            </div>
                        </DialogDescription>
                        <div className="mt-6 flex justify-center">
                            <Button onClick={() => setShowSuccessModal(false)} className="w-full sm:w-auto">Close</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Rejection Modal */}
                <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
                    <DialogContent className="sm:max-w-md p-6">
                        <DialogHeader className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <XCircle className="h-7 w-7 text-red-600" />
                            </div>
                            <DialogTitle className="text-2xl font-bold">Application Update</DialogTitle>
                        </DialogHeader>
                        <DialogDescription className="text-gray-600 dark:text-gray-300 space-y-3 mt-2">
                            <div>
                                We regret to inform you that your application to the Ladder program was not approved at this time.
                            </div>
                            {formData.rejectionReason && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 text-left">
                                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Reason for decision:</p>
                                    <p className="text-sm text-red-600 dark:text-red-400">{formData.rejectionReason}</p>
                                </div>
                            )}
                            <div className="text-center">
                                We encourage you to apply again in the future. Thank you for your interest.
                            </div>
                        </DialogDescription>
                        <div className="mt-6 flex justify-center">
                            <Button variant="outline" onClick={() => setShowRejectionModal(false)} className="w-full sm:w-auto">Close</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
