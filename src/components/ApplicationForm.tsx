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
import { Textarea } from "./ui/textarea";
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
    PenTool,
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

// Add a custom CSS import for form-specific styles
import '@/styles/form.css';

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
    previousParticipation: 'season1' | 'season2' | 'season3' | 'both' | 'none' | '';
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
    const [activeSection, setActiveSection] = useState(0);
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
    });
    // State to track section transition loading
    const [sectionLoading, setSectionLoading] = useState(false);

    // Handle window resize for responsive elements
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
            });
        };

        window.addEventListener('resize', handleResize);

        // Initial size
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Define sections for progressive disclosure
    const sections = [
        { id: 'personal', title: 'Personal Information' },
        { id: 'commitment', title: 'Commitment & Availability' },
        { id: 'goals', title: 'Goals & Projects' },
        { id: 'experience', title: 'Experience & Background' },
        { id: 'understanding', title: 'Commitment Understanding' },
        { id: 'additional', title: 'Additional Information' },
        { id: 'submit', title: 'Review & Submit' },
    ];

    const isSubmitted = formData.status === 'submitted';
    const isAccepted = formData.status === 'accepted';
    const isRejected = formData.status === 'rejected';
    const isReadOnly = isSubmitted || isAccepted || isRejected;
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Track which fields have unsaved changes
    const [changedFields, setChangedFields] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadExistingApplication();
    }, []);

    // Reset changed fields when form is saved
    useEffect(() => {
        if (!hasUnsavedChanges && lastSaved) {
            setChangedFields({});
        }
    }, [hasUnsavedChanges, lastSaved]);

    // Handle section transitions with improved UX
    const handleSectionChange = async (newSection: number) => {
        // Only validate when moving forward, not when moving backward
        const isMovingForward = newSection > activeSection;

        if (isMovingForward && !validateSection(activeSection)) {
            return; // Don't proceed if current section is invalid
        }

        // Start loading state
        setSectionLoading(true);

        // Auto-save before section change
        if (hasUnsavedChanges && formData.id) {
            await handleSaveDraft(true); // Silent save
            setLastSaved(new Date());
        }

        // Pause for smoother transitions
        await new Promise(resolve => setTimeout(resolve, 50));

        // Update the active section
        setActiveSection(newSection);

        // Scroll to top of form
        const formElement = document.querySelector('.form-card');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // End loading state after transition
        setTimeout(() => setSectionLoading(false), 250);
    };

    // Track form changes
    useEffect(() => {
        setHasUnsavedChanges(true);
    }, [formData]);

    // Auto-save form data periodically (every 30 seconds) if there are unsaved changes
    useEffect(() => {
        if (!hasUnsavedChanges || isReadOnly) return;

        const autosaveInterval = setInterval(async () => {
            if (hasUnsavedChanges && formData.id) {
                await handleSaveDraft(true); // true for silent save
            }
        }, 30000); // 30 seconds

        return () => clearInterval(autosaveInterval);
    }, [hasUnsavedChanges, isReadOnly, formData.id]);

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

    // Load all applications and pick the latest draft or let user select
    const loadExistingApplication = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/applications');
            if (response.ok) {
                const data = await response.json();
                // If multiple applications, pick the latest draft (or latest application)
                let appData = null;
                if (Array.isArray(data.applications)) {
                    // Prefer latest draft, else latest submitted
                    appData = data.applications.find((a: any) => a.status === 'draft')
                        || data.applications[0];
                } else if (data.application) {
                    appData = data.application;
                }
                if (appData) {
                    setFormData({
                        ...initialFormData,
                        ...appData,
                        commitmentRequirements: appData.commitmentRequirements || initialFormData.commitmentRequirements,
                        name: appData.name || session.user?.name || '',
                        email: appData.email || session.user?.email || '',
                    });
                } else {
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
        setChangedFields(prev => ({ ...prev, [name]: true })); // Mark this field as changed
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setChangedFields(prev => ({ ...prev, [name]: true })); // Mark this field as changed
    };

    const handleCheckboxChange = (name: keyof FormData['commitmentRequirements']) => {
        setFormData(prev => ({
            ...prev,
            commitmentRequirements: {
                ...prev.commitmentRequirements,
                [name]: !prev.commitmentRequirements[name]
            }
        }));
        setChangedFields(prev => ({ ...prev, [name]: true })); // Mark this field as changed
    };

    // Helper to check if a string is empty or only whitespace
    const isEmpty = (val?: string) => !val || val.trim() === '';

    const validateSection = (sectionIndex: number): boolean => {
        switch (sectionIndex) {
            case 0: // Personal Information
                if (isEmpty(formData.phone)) {
                    setMessage({ type: 'error', text: 'Phone number is required.' });
                    return false;
                }
                if (isEmpty(formData.currentLocation)) {
                    setMessage({ type: 'error', text: 'Current location is required.' });
                    return false;
                }
                return true;

            case 1: // Commitment & Availability
                if (!formData.commitmentAttendance) {
                    setMessage({ type: 'error', text: 'Please answer the commitment question.' });
                    return false;
                }
                if (!formData.preferredMonth) {
                    setMessage({ type: 'error', text: 'Please select your preferred month.' });
                    return false;
                }
                if (!formData.weekendAvailability) {
                    setMessage({ type: 'error', text: 'Please indicate your weekend availability.' });
                    return false;
                }
                return true;

            case 2: // Goals & Projects
                if (isEmpty(formData.mainProjectGoal)) {
                    setMessage({ type: 'error', text: 'Main project/goal is required.' });
                    return false;
                }
                if (!formData.projectType) {
                    setMessage({ type: 'error', text: 'Please select your project type.' });
                    return false;
                }
                if (formData.projectType === 'other' && isEmpty(formData.projectTypeOther)) {
                    setMessage({ type: 'error', text: 'Please specify your project type if other.' });
                    return false;
                }
                if (isEmpty(formData.projectChallenges)) {
                    setMessage({ type: 'error', text: 'Project challenges are required.' });
                    return false;
                }
                if (isEmpty(formData.goalByDecember)) {
                    setMessage({ type: 'error', text: 'Goal by December is required.' });
                    return false;
                }
                if (isEmpty(formData.measureSuccess)) {
                    setMessage({ type: 'error', text: 'How you measure success is required.' });
                    return false;
                }
                return true;

            case 3: // Experience & Background
                if (!formData.previousParticipation) {
                    setMessage({ type: 'error', text: 'Please answer about previous participation.' });
                    return false;
                }
                if ((formData.previousParticipation === 'season1' || formData.previousParticipation === 'season2' || formData.previousParticipation === 'season3' || formData.previousParticipation === 'both') && isEmpty(formData.previousParticipationReason)) {
                    setMessage({ type: 'error', text: 'Please explain why you couldn\'t complete previous sessions.' });
                    return false;
                }
                if (!formData.projectStage) {
                    setMessage({ type: 'error', text: 'Please select your project stage.' });
                    return false;
                }
                return true;

            case 4: // Commitment Understanding
                if (!formData.commitmentUnderstanding) {
                    setMessage({ type: 'error', text: 'Please confirm your understanding of commitments.' });
                    return false;
                }
                if (formData.commitmentUnderstanding === 'yes_all' && !Object.values(formData.commitmentRequirements).every(Boolean)) {
                    setMessage({ type: 'error', text: 'Please check all commitment requirements if you understand them.' });
                    return false;
                }
                if (isEmpty(formData.motivation)) {
                    setMessage({ type: 'error', text: 'Motivation is required.' });
                    return false;
                }
                if (isEmpty(formData.ensureCompletion)) {
                    setMessage({ type: 'error', text: 'How you will ensure completion is required.' });
                    return false;
                }
                return true;

            case 5: // Additional Information
                // These are optional fields
                return true;

            case 6: // Review & Submit
                if (isEmpty(formData.digitalSignature)) {
                    setMessage({ type: 'error', text: 'Digital signature is required.' });
                    return false;
                }
                // Compare names after trimming and normalizing whitespace/case
                const normalize = (str: string) => str.trim().replace(/\s+/g, ' ').toLowerCase();
                // Allow digital signature if it contains the account name (not just equals)
                if (!normalize(formData.digitalSignature).includes(normalize(formData.name))) {
                    setMessage({ type: 'error', text: `Digital signature must include your account name: "${formData.name}" (case and extra spaces ignored).` });
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    const validateForm = (): boolean => {
        // Validate each section in turn
        for (let i = 0; i < sections.length; i++) {
            if (!validateSection(i)) {
                handleSectionChange(i);
                return false;
            }
        }
        return true;
    };

    const handleSaveDraft = async (silent: boolean = false) => {
        if (!silent) setSaving(true);
        if (!silent) setMessage(null);
        try {
            const isUpdate = !!formData.id;
            const method = isUpdate ? 'PUT' : 'POST';
            const cleaned = cleanFormData({ ...formData, status: 'draft', submissionDate: new Date().toISOString() });
            let url = '/api/applications';
            if (isUpdate) {
                url = `/api/applications/${formData.id}`;
                delete cleaned.id;
            }
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleaned),
            });
            const data = await response.json();
            if (response.ok) {
                setFormData(prev => ({ ...prev, ...data.application, id: data.application._id, status: 'draft' }));
                setHasUnsavedChanges(false);
                setLastSaved(new Date());
                if (!silent) setMessage({ type: 'success', text: 'Draft saved successfully!' });
            } else {
                if (!silent) setMessage({ type: 'error', text: data.error || 'Failed to save draft' });
            }
        } catch (error) {
            if (!silent) setMessage({ type: 'error', text: 'An error occurred while saving draft' });
        } finally {
            if (!silent) setSaving(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSubmitting(true);
        setMessage(null);
        try {
            const isUpdate = !!formData.id;
            const method = isUpdate ? 'PUT' : 'POST';
            const cleaned = cleanFormData({ ...formData, status: 'submitted', submissionDate: new Date().toISOString() });
            let url = '/api/applications';
            if (isUpdate) {
                url = `/api/applications/${formData.id}`;
                delete cleaned.id;
            }
            // Remove submittedAt from payload (let backend set it)
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleaned),
            });
            const data = await response.json();
            if (response.ok) {
                setFormData(prev => ({ ...prev, ...data.application, id: data.application._id, status: 'submitted' }));
                setMessage({ type: 'success', text: 'Application submitted successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to submit application' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while submitting' });
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to clean formData before sending to backend
    const cleanFormData = (data: any) => {
        // Remove any _id from commitmentRequirements
        const cleanedCommitmentRequirements = { ...data.commitmentRequirements };
        if ('_id' in cleanedCommitmentRequirements) delete cleanedCommitmentRequirements._id;

        // Remove system fields from root
        const cleaned = { ...data };
        delete cleaned._id;
        delete cleaned.__v;
        delete cleaned.createdAt;
        delete cleaned.updatedAt;
        delete cleaned.statusHistory;
        delete cleaned.userId;

        return {
            ...cleaned,
            commitmentRequirements: cleanedCommitmentRequirements
        };
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
        "June 2025"
    ];

    // Save status component to show save state of individual fields
    const SaveStatus = ({ fieldChanged }: { fieldChanged: boolean }) => {
        if (isReadOnly) return null;

        return (
            <span className={`transition-opacity duration-300 ${fieldChanged ? 'opacity-100' : 'opacity-0'}`}>
                {fieldChanged ? (
                    <span className="unsaved-indicator">
                        <Clock className="h-3 w-3" /> Unsaved
                    </span>
                ) : (
                    <span className="saved-indicator">
                        <CheckCircle className="h-3 w-3" /> Saved
                    </span>
                )}
            </span>
        );
    };

    // Improved loading state
    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="relative">
                    <div className="h-10 w-10 rounded-full border-2 border-gray-200 opacity-25"></div>
                    <Loader2 className="h-10 w-10 animate-spin absolute top-0 left-0 text-primary opacity-80" />
                </div>
                <p className="text-sm text-gray-500 animate-pulse">Loading your application...</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center w-full px-4 sm:px-6">
            <div className="md:min-w-4xl max-w-4xl w-full">
                {formData.status && formData.status !== 'draft' && (
                    <div className={`p-3 mb-6 rounded-md ${formData.status === 'submitted' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        formData.status === 'reviewed' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            formData.status === 'accepted' ? 'bg-green-50 text-green-700 border border-green-100' :
                                formData.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
                                    'bg-gray-50 text-gray-700 border border-gray-100'
                        }`}>
                        <div className="flex items-center gap-2.5">
                            {getStatusIcon(formData.status)}
                            <div>
                                <span className="font-medium text-sm">
                                    {getStatusText(formData.status)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <Card className="form-card">
                    <CardHeader className="pb-4 border-b border-gray-100">
                        <CardTitle className="text-xl font-medium flex items-center gap-2 text-gray-800">
                            <PenTool className="h-5 w-5 text-primary" />
                            Ladder Program Application
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            Please fill out this form carefully. Your responses will help us understand your goals and commitment.
                        </CardDescription>

                        {!isReadOnly && (
                            <>
                                <div className="mt-5 mb-1">
                                    <div className="h-1 w-full bg-gray-100 rounded overflow-hidden">
                                        <div
                                            className="h-1 bg-primary/90 rounded transition-all duration-300"
                                            style={{ width: `${Math.min(100, (activeSection / (sections.length - 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs text-gray-400">
                                            {sections[activeSection].title}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Step {activeSection + 1} of {sections.length}
                                        </p>
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-wrap gap-1 mt-3 text-sm">
                                    {sections.map((section, index) => (
                                        <Button
                                            key={section.id}
                                            type="button"
                                            onClick={() => handleSectionChange(index)}
                                            variant={activeSection === index ? "default" : "ghost"}
                                            size="sm"
                                            className={`px-2 py-1 h-auto text-xs ${activeSection === index ? 'font-medium' : 'opacity-70 hover:opacity-100 text-gray-600'}`}
                                        >
                                            {index + 1}. {section.title}
                                        </Button>
                                    ))}
                                </div>

                                <div className="section-nav-indicator md:hidden">
                                    {sections.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSectionChange(index)}
                                            className={`section-nav-dot ${index === activeSection ? 'active' : ''}`}
                                            aria-label={`Go to section ${index + 1}: ${sections[index].title}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6 py-4">
                            {message && (
                                <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{message.text}</AlertDescription>
                                </Alert>
                            )}

                            {/* Personal Information Section */}
                            <section className={`form-section space-y-4 mb-8 pt-2 ${isReadOnly || activeSection === 0 ? 'active' : 'inactive'}`}>
                                <h2 className="section-header">
                                    <User className="h-4 w-4" /> Personal Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 form-input-subtle">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="field-label">Full Name</Label>
                                        <Input id="name" value={formData.name} disabled className="bg-gray-50" />
                                        <p className="helper-text">Auto-populated from your account.</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="field-label">Email Address</Label>
                                        <Input id="email" type="email" value={formData.email} disabled className="bg-gray-50" />
                                        <p className="helper-text">Auto-populated from your account.</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="phone" className="field-label">Phone Number *</Label>
                                            <SaveStatus fieldChanged={!!changedFields['phone']} />
                                        </div>
                                        <Input id="phone" name="phone" type="tel" placeholder="e.g., +1 123 456 7890" value={formData.phone} onChange={handleChange} disabled={isReadOnly} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="currentLocation" className="field-label">Current Location *</Label>
                                            <SaveStatus fieldChanged={!!changedFields['currentLocation']} />
                                        </div>
                                        <Input id="currentLocation" name="currentLocation" placeholder="e.g., City, Country" value={formData.currentLocation} onChange={handleChange} disabled={isReadOnly} required />
                                    </div>
                                </div>

                                {!isReadOnly && (
                                    <div className="form-nav-buttons">
                                        <div className="flex-1"></div>
                                        <Button
                                            type="button"
                                            onClick={() => handleSectionChange(1)}
                                            className="bg-primary/90 hover:bg-primary w-full sm:w-auto flex items-center gap-1"
                                        >
                                            <span className="sm:hidden">Next</span>
                                            <span className="hidden sm:inline">Next: Commitment & Availability</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </section>

                            {/* Commitment & Availability Section */}
                            <section className={`form-section space-y-4 mb-8 ${isReadOnly || activeSection === 1 ? 'active' : 'inactive'}`}>
                                <h2 className="section-header">
                                    <CalendarDays className="h-4 w-4" /> Commitment & Availability
                                </h2>
                                <div className="space-y-6 form-input-subtle">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <Label className="field-label">Can you commit to attending ALL 4 sessions during your assigned month? *</Label>
                                            <SaveStatus fieldChanged={!!changedFields['commitmentAttendance']} />
                                        </div>
                                        <p className="helper-text mb-1">3 online + 1 in-person at WORX Co-Working</p>
                                        <Select name="commitmentAttendance" onValueChange={(value) => handleSelectChange("commitmentAttendance", value)} value={formData.commitmentAttendance} disabled={isReadOnly} required>
                                            <SelectTrigger><SelectValue placeholder="Select your commitment" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes">Yes, I can fully commit</SelectItem>
                                                <SelectItem value="no">No, I have scheduling conflicts</SelectItem>
                                                <SelectItem value="unsure">Unsure at this time</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <Label className="field-label">Which month would work best for your participation? *</Label>
                                            <SaveStatus fieldChanged={!!changedFields['preferredMonth']} />
                                        </div>
                                        <Select name="preferredMonth" onValueChange={(value) => handleSelectChange("preferredMonth", value)} value={formData.preferredMonth} disabled={isReadOnly} required>
                                            <SelectTrigger><SelectValue placeholder="Select a month" /></SelectTrigger>
                                            <SelectContent>
                                                {months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <Label className="field-label">Are you available for weekend sessions? *</Label>
                                            <SaveStatus fieldChanged={!!changedFields['weekendAvailability']} />
                                        </div>
                                        <p className="helper-text mb-1">Maximum 30 minutes via Google Meet</p>
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
                                </div>

                                {!isReadOnly && (
                                    <div className="form-nav-buttons">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleSectionChange(0)}
                                            className="w-full sm:w-auto flex items-center gap-1"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span className="sm:hidden">Previous</span>
                                            <span className="hidden sm:inline">Previous: Personal Information</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => handleSectionChange(2)}
                                            className="bg-primary/90 hover:bg-primary w-full sm:w-auto flex items-center gap-1"
                                        >
                                            <span className="sm:hidden">Next</span>
                                            <span className="hidden sm:inline">Next: Goals & Projects</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </section>

                            {/* Goals & Projects Section */}
                            <section className={`space-y-4 mb-8 ${isReadOnly || activeSection === 2 ? '' : 'hidden'}`}>
                                <h2 className="text-lg font-medium flex items-center gap-1.5 border-b pb-2 mb-4">
                                    <Target className="h-4 w-4 text-primary" /> Goals & Projects
                                </h2>
                                <div className="space-y-1.5 mb-4">
                                    <Label htmlFor="mainProjectGoal" className="text-sm">What is your main project/goal you want to work on from June to December 2025? *</Label>
                                    <Textarea id="mainProjectGoal" name="mainProjectGoal" placeholder="Describe your main project or goal..." value={formData.mainProjectGoal} onChange={handleChange} disabled={isReadOnly} required className="resize-none bg-white" />
                                </div>
                                <div className="space-y-1.5 mb-4">
                                    <Label className="text-sm">What type of project is this? *</Label>
                                    <Select name="projectType" onValueChange={(value) => handleSelectChange("projectType", value)} value={formData.projectType} disabled={isReadOnly} required>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select project type" /></SelectTrigger>
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
                                    <div className="space-y-1.5 mb-4">
                                        <Label htmlFor="projectTypeOther" className="text-sm">If other, please specify: *</Label>
                                        <Input id="projectTypeOther" name="projectTypeOther" value={formData.projectTypeOther} onChange={handleChange} disabled={isReadOnly} required className="bg-white" />
                                    </div>
                                )}
                                <div className="space-y-1.5 mb-4">
                                    <Label htmlFor="projectChallenges" className="text-sm">What specific challenges are you currently facing with this project? *</Label>
                                    <Textarea id="projectChallenges" name="projectChallenges" placeholder="Describe your challenges..." value={formData.projectChallenges} onChange={handleChange} disabled={isReadOnly} required className="resize-none bg-white" />
                                </div>
                                <div className="space-y-1.5 mb-4">
                                    <Label htmlFor="goalByDecember" className="text-sm">What do you hope to achieve by the end of December 2025? *</Label>
                                    <Textarea id="goalByDecember" name="goalByDecember" placeholder="Describe your desired outcomes..." value={formData.goalByDecember} onChange={handleChange} disabled={isReadOnly} required className="resize-none bg-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="measureSuccess" className="text-sm">How would you measure success for your project? *</Label>
                                    <Textarea id="measureSuccess" name="measureSuccess" placeholder="e.g., KPIs, milestones, qualitative feedback..." value={formData.measureSuccess} onChange={handleChange} disabled={isReadOnly} required className="resize-none bg-white" />
                                </div>

                                {!isReadOnly && (
                                    <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleSectionChange(1)}
                                            className="w-full sm:w-auto order-2 sm:order-1"
                                        >
                                            <span className="sm:hidden">Previous</span>
                                            <span className="hidden sm:inline">Previous: Commitment & Availability</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => handleSectionChange(3)}
                                            className="bg-primary/90 hover:bg-primary w-full sm:w-auto order-1 sm:order-2"
                                        >
                                            <span className="sm:hidden">Next</span>
                                            <span className="hidden sm:inline">Next: Experience & Background</span>
                                        </Button>
                                    </div>
                                )}
                            </section>

                            {/* Experience & Background Section */}
                            <section className={`space-y-4 mb-8 ${isReadOnly || activeSection === 3 ? '' : 'hidden'}`}>
                                <h2 className="text-lg font-medium flex items-center gap-1.5 border-b pb-2 mb-4">
                                    <Briefcase className="h-4 w-4 text-primary" /> Experience & Background
                                </h2>
                                <div className="space-y-1.5 mb-4">
                                    <Label className="text-sm">Have you participated in our previous seasons (Season 1,2 or 3)? *</Label>
                                    <Select name="previousParticipation" onValueChange={(value) => handleSelectChange("previousParticipation", value)} value={formData.previousParticipation} disabled={isReadOnly} required>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select your experience" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="season1">Yes, Season 1 and 2 (Online Sessions)</SelectItem>
                                            <SelectItem value="season3">Yes, Season 3 (Physical Sessions)</SelectItem>
                                            <SelectItem value="both">Yes, all Season 1,2 & 3</SelectItem>
                                            <SelectItem value="none">No, this is my first time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {(formData.previousParticipation === 'season1' || formData.previousParticipation === 'season2' || formData.previousParticipation === 'season3' || formData.previousParticipation === 'both') && (
                                    <div className="space-y-1.5 mb-4">
                                        <Label htmlFor="previousParticipationReason" className="text-sm">If you participated before, what prevented you from completing all sessions? *</Label>
                                        <Textarea id="previousParticipationReason" name="previousParticipationReason" value={formData.previousParticipationReason} onChange={handleChange} disabled={isReadOnly} required className="resize-none bg-white" />
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <Label className="text-sm">What's your current stage with your project? *</Label>
                                    <Select name="projectStage" onValueChange={(value) => handleSelectChange("projectStage", value)} value={formData.projectStage} disabled={isReadOnly} required>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select project stage" /></SelectTrigger>
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

                                {!isReadOnly && (
                                    <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleSectionChange(2)}
                                            className="w-full sm:w-auto order-2 sm:order-1"
                                        >
                                            <span className="sm:hidden">Previous</span>
                                            <span className="hidden sm:inline">Previous: Goals & Projects</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => handleSectionChange(4)}
                                            className="bg-primary/90 hover:bg-primary w-full sm:w-auto order-1 sm:order-2"
                                        >
                                            <span className="sm:hidden">Next</span>
                                            <span className="hidden sm:inline">Next: Commitment Understanding</span>
                                        </Button>
                                    </div>
                                )}
                            </section>

                            {/* Commitment Understanding Section */}
                            <section className={`space-y-4 mb-8 ${isReadOnly || activeSection === 4 ? '' : 'hidden'}`}>
                                <h2 className="text-lg font-medium flex items-center gap-1.5 border-b pb-2 mb-4">
                                    <HelpCircle className="h-4 w-4 text-primary" /> Commitment Understanding
                                </h2>
                                <div className="space-y-1.5 mb-4">
                                    <Label className="text-sm">Do you understand that this program requires: *</Label>
                                    <Select name="commitmentUnderstanding" onValueChange={(value) => handleSelectChange("commitmentUnderstanding", value)} value={formData.commitmentUnderstanding} disabled={isReadOnly} required>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select your understanding" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yes_all">Yes, I understand ALL requirements</SelectItem>
                                            <SelectItem value="need_clarification">I need clarification on some points</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <h3 className="text-sm font-medium mb-2">Requirements Checklist:</h3>
                                    <div className="flex items-center space-x-2 mb-1.5">
                                        <Checkbox id="req1" checked={formData.commitmentRequirements.attendingAllSessions} onCheckedChange={() => handleCheckboxChange('attendingAllSessions')} disabled={isReadOnly} />
                                        <Label htmlFor="req1" className="font-normal text-sm">Attending ALL review sessions during my assigned month</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 mb-1.5">
                                        <Checkbox id="req2" checked={formData.commitmentRequirements.participatingExtra} onCheckedChange={() => handleCheckboxChange('participatingExtra')} disabled={isReadOnly} />
                                        <Label htmlFor="req2" className="font-normal text-sm">Participating in additional small sessions and meetups</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 mb-1.5">
                                        <Checkbox id="req3" checked={formData.commitmentRequirements.stayingActive} onCheckedChange={() => handleCheckboxChange('stayingActive')} disabled={isReadOnly} />
                                        <Label htmlFor="req3" className="font-normal text-sm">Staying actively engaged throughout participation</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="req4" checked={formData.commitmentRequirements.attendingInPerson} onCheckedChange={() => handleCheckboxChange('attendingInPerson')} disabled={isReadOnly} />
                                        <Label htmlFor="req4" className="font-normal text-sm">Attending 1 in-person session at WORX Co-Working</Label>
                                    </div>
                                </div>
                                <div className="space-y-1.5 mb-4">
                                    <Label htmlFor="motivation" className="text-sm">What motivates you to commit to this intensive program? *</Label>
                                    <Textarea id="motivation" name="motivation" placeholder="Share your motivations..." value={formData.motivation} onChange={handleChange} disabled={isReadOnly} required className="resize-none bg-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="ensureCompletion" className="text-sm">How will you ensure you don't drop out mid-way through your assigned month? *</Label>
                                    <Textarea id="ensureCompletion" name="ensureCompletion" placeholder="Describe your strategies..." value={formData.ensureCompletion} onChange={handleChange} disabled={isReadOnly} required className="resize-none bg-white" />
                                </div>

                                {!isReadOnly && (
                                    <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleSectionChange(3)}
                                            className="w-full sm:w-auto order-2 sm:order-1"
                                        >
                                            <span className="sm:hidden">Previous</span>
                                            <span className="hidden sm:inline">Previous: Experience & Background</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => handleSectionChange(5)}
                                            className="bg-primary/90 hover:bg-primary w-full sm:w-auto order-1 sm:order-2"
                                        >
                                            <span className="sm:hidden">Next</span>
                                            <span className="hidden sm:inline">Next: Additional Information</span>
                                        </Button>
                                    </div>
                                )}
                            </section>

                            {/* Additional Information Section */}
                            <section className={`space-y-4 mb-8 ${isReadOnly || activeSection === 5 ? '' : 'hidden'}`}>
                                <h2 className="text-lg font-medium flex items-center gap-1.5 border-b pb-2 mb-4">
                                    <Info className="h-4 w-4 text-primary" /> Additional Information
                                </h2>
                                <div className="space-y-1.5 mb-4">
                                    <Label htmlFor="expertiseSkills" className="text-sm">Do you have any specific expertise or skills that could benefit other participants?</Label>
                                    <Textarea id="expertiseSkills" name="expertiseSkills" placeholder="e.g., Marketing, Coding, Design..." value={formData.expertiseSkills} onChange={handleChange} disabled={isReadOnly} className="resize-none bg-white" />
                                </div>
                                <div className="space-y-1.5 mb-4">
                                    <Label htmlFor="valuableSupport" className="text-sm">What type of support or connections would be most valuable for your project?</Label>
                                    <Textarea id="valuableSupport" name="valuableSupport" placeholder="e.g., Mentorship, Funding, Technical advice..." value={formData.valuableSupport} onChange={handleChange} disabled={isReadOnly} className="resize-none bg-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="additionalComments" className="text-sm">Any additional comments or questions?</Label>
                                    <Textarea id="additionalComments" name="additionalComments" placeholder="Share any other thoughts..." value={formData.additionalComments} onChange={handleChange} disabled={isReadOnly} className="resize-none bg-white" />
                                </div>

                                {!isReadOnly && (
                                    <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleSectionChange(4)}
                                            className="w-full sm:w-auto order-2 sm:order-1"
                                        >
                                            <span className="sm:hidden">Previous</span>
                                            <span className="hidden sm:inline">Previous: Commitment Understanding</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => handleSectionChange(6)}
                                            className="bg-primary/90 hover:bg-primary w-full sm:w-auto order-1 sm:order-2"
                                        >
                                            <span className="sm:hidden">Next</span>
                                            <span className="hidden sm:inline">Next: Review & Submit</span>
                                        </Button>
                                    </div>
                                )}
                            </section>

                            {/* Final Commitment Statement Section */}
                            <section className={`form-section space-y-4 mb-8 border-t pt-6 ${isReadOnly || activeSection === 6 ? 'active' : 'inactive'}`}>
                                <h2 className="section-header text-red-600 border-b border-red-100">
                                    <AlertCircle className="h-4 w-4 text-red-500" /> Final Commitment Statement
                                </h2>
                                <div className="space-y-3 text-sm bg-red-50/50 border border-red-100 rounded-md p-4 my-4">
                                    <p className="font-medium">By submitting this form, I confirm that:</p>
                                    <ul className="list-disc list-outside space-y-1.5 ml-5 text-gray-700">
                                        <li>I have read and understood all requirements</li>
                                        <li>I am genuinely committed to participating fully during my assigned month</li>
                                        <li>I understand that inconsistent participation affects the entire group</li>
                                        <li>I am ready to actively work on my goals and engage with the community</li>
                                    </ul>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mt-3 form-input-subtle">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="digitalSignature" className="field-label">Digital Signature (Type your full name) *</Label>
                                            <SaveStatus fieldChanged={!!changedFields['digitalSignature']} />
                                        </div>
                                        <Input id="digitalSignature" name="digitalSignature" placeholder="Your Full Name" value={formData.digitalSignature} onChange={handleChange} disabled={isReadOnly} required />
                                        <p className="helper-text">Please type your account name: <strong>{formData.name}</strong></p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="submissionDate" className="field-label">Submission Date</Label>
                                        <Input id="submissionDate" type="date" value={(typeof formData.submissionDate === 'string' && formData.submissionDate) ? formData.submissionDate.split('T')[0] : ''} disabled className="bg-gray-50" />
                                        <p className="helper-text">Today's date will be recorded when you submit</p>
                                    </div>
                                </div>
                                <p className="text-xs text-red-600 mt-2 flex items-start gap-1.5">
                                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span>Only submit this form if you can honestly commit to the full program. We're looking for 15 dedicated participants who will make the most of this opportunity!</span>
                                </p>

                                {!isReadOnly && (
                                    <div className="form-nav-buttons">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleSectionChange(5)}
                                            className="w-full sm:w-auto flex items-center gap-1"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span className="sm:hidden">Previous</span>
                                            <span className="hidden sm:inline">Previous: Additional Information</span>
                                        </Button>
                                        <div className="flex-1"></div>
                                    </div>
                                )}
                            </section>

                            {/* Form summary shown on last step */}
                            {!isReadOnly && activeSection === 6 && (
                                <div className="mb-8">
                                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-md">
                                        <h3 className="text-sm font-medium flex items-center gap-2 text-blue-700 mb-3">
                                            <Info className="h-4 w-4" /> Application Summary
                                        </h3>
                                        <p className="text-sm text-blue-600 mb-4">
                                            Please review your application carefully before submitting. You can edit any section by clicking the section titles in the navigation.
                                        </p>

                                        <div className="space-y-5 text-sm">
                                            <div className="summary-section">
                                                <h4 className="summary-section-title flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5" /> Personal Information
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="summary-item">
                                                        <span className="summary-label">Name:</span>
                                                        <span className="summary-value">{formData.name}</span>
                                                    </div>
                                                    <div className="summary-item">
                                                        <span className="summary-label">Email:</span>
                                                        <span className="summary-value">{formData.email}</span>
                                                    </div>
                                                    <div className="summary-item">
                                                        <span className="summary-label">Phone:</span>
                                                        <span className="summary-value">{formData.phone}</span>
                                                    </div>
                                                    <div className="summary-item">
                                                        <span className="summary-label">Location:</span>
                                                        <span className="summary-value">{formData.currentLocation}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="summary-section">
                                                <h4 className="summary-section-title flex items-center gap-1.5">
                                                    <CalendarDays className="h-3.5 w-3.5" /> Commitment & Availability
                                                </h4>
                                                <div className="space-y-1">
                                                    <div className="summary-item">
                                                        <span className="summary-label">Month:</span>
                                                        <span className="summary-value">{formData.preferredMonth}</span>
                                                    </div>
                                                    <div className="summary-item">
                                                        <span className="summary-label">Availability:</span>
                                                        <span className="summary-value">{
                                                            formData.weekendAvailability === 'both' ? 'Both Saturday & Sunday' :
                                                                formData.weekendAvailability === 'saturday' ? 'Saturday only' :
                                                                    formData.weekendAvailability === 'sunday' ? 'Sunday only' :
                                                                        formData.weekendAvailability === 'none' ? 'No weekend availability' : 'Not specified'
                                                        }</span>
                                                    </div>
                                                    <div className="summary-item">
                                                        <span className="summary-label">Commitment:</span>
                                                        <span className="summary-value">{
                                                            formData.commitmentAttendance === 'yes' ? 'Can attend all sessions' :
                                                                formData.commitmentAttendance === 'no' ? 'Has scheduling conflicts' :
                                                                    formData.commitmentAttendance === 'unsure' ? 'Unsure about availability' : 'Not specified'
                                                        }</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="summary-section">
                                                <h4 className="summary-section-title flex items-center gap-1.5">
                                                    <Target className="h-3.5 w-3.5" /> Project Details
                                                </h4>
                                                <div className="space-y-2">
                                                    <div className="summary-item">
                                                        <span className="summary-label">Project type:</span>
                                                        <span className="summary-value">{
                                                            formData.projectType === 'startup' ? 'Startup/Business venture' :
                                                                formData.projectType === 'academic' ? 'University/Academic project' :
                                                                    formData.projectType === 'personal_dev' ? 'Personal development goal' :
                                                                        formData.projectType === 'career_transition' ? 'Career transition' :
                                                                            formData.projectType === 'creative' ? 'Creative project' :
                                                                                formData.projectType === 'other' ? formData.projectTypeOther : 'Not specified'
                                                        }</span>
                                                    </div>
                                                    <div className="summary-item">
                                                        <span className="summary-label">Stage:</span>
                                                        <span className="summary-value">{
                                                            formData.projectStage === 'idea' ? 'Just an idea' :
                                                                formData.projectStage === 'planning' ? 'Planning phase' :
                                                                    formData.projectStage === 'early_dev' ? 'Early development' :
                                                                        formData.projectStage === 'mid_dev' ? 'Mid-development' :
                                                                            formData.projectStage === 'near_completion' ? 'Near completion' :
                                                                                formData.projectStage === 'scaling' ? 'Looking to scale/improve' : 'Not specified'
                                                        }</span>
                                                    </div>
                                                    <div>
                                                        <span className="summary-label block mb-1">Main goal:</span>
                                                        <p className="text-xs bg-white p-2 rounded border border-blue-100 text-gray-700">{formData.mainProjectGoal ?
                                                            (formData.mainProjectGoal.length > 150 ?
                                                                formData.mainProjectGoal.substring(0, 150) + "..." :
                                                                formData.mainProjectGoal) :
                                                            "Not specified"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex justify-between items-center border-t border-blue-100 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                                onClick={() => handleSectionChange(0)}
                                            >
                                                <ArrowLeft className="h-3 w-3 mr-1" /> Edit information
                                            </Button>
                                            <p className="text-xs text-blue-600 flex items-center">
                                                <CheckCircle className="h-3 w-3 mr-1" /> All required fields are complete
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!isReadOnly && (
                                <div className={`flex flex-col sm:flex-row ${activeSection === 6 ? 'justify-center' : 'justify-end'} gap-3 pt-6 border-t`}>
                                    {activeSection === 6 && (
                                        <Button
                                            type="submit"
                                            disabled={saving || submitting}
                                            className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto max-w-xs mx-auto sm:mx-0 flex items-center justify-center gap-2 h-10"
                                            data-ph-event="application_form_action"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>{windowSize.width < 640 ? 'Submitting...' : 'Submitting Application...'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>{windowSize.width < 640 ? 'Submit Application' : 'Submit Application'}</span>
                                                    {!submitting && <CheckCircle className="h-4 w-4" />}
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Section loading indicator */}
                            {sectionLoading && (
                                <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
                                    <div className="bg-white p-3 rounded-full shadow-md">
                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                    </div>
                                </div>
                            )}

                            {isSubmitted && (
                                <div className="mt-6 flex items-center justify-center p-3 text-green-700">
                                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                    <span className="text-sm">
                                        Application submitted successfully! We'll review it and get back to you soon.
                                    </span>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Success Modal */}
                <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                    <DialogContent className="sm:max-w-md border-green-200">
                        <DialogHeader>
                            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-50 border-2 border-green-200 mb-3">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                            <DialogTitle className="text-xl font-medium text-center text-green-700">Congratulations!</DialogTitle>
                        </DialogHeader>
                        <DialogDescription className="text-center space-y-3">
                            <p className="text-gray-700">
                                Your application to the Ladder program has been <strong className="text-green-700">approved</strong>!
                                We're excited to have you join our community.
                            </p>
                            <p className="text-gray-600">
                                Please check your email for instructions and next steps.
                            </p>
                        </DialogDescription>
                        <div className="mt-5 flex justify-center">
                            <Button onClick={() => setShowSuccessModal(false)} className="w-auto px-8 bg-green-600 hover:bg-green-700">Close</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Rejection Modal */}
                <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
                    <DialogContent className="sm:max-w-md border-red-100">
                        <DialogHeader>
                            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 border-2 border-red-200 mb-3">
                                <XCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <DialogTitle className="text-xl font-medium text-center text-gray-700">Application Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-gray-700 text-center">
                                We regret to inform you that your application to the Ladder program was not approved at this time.
                            </p>
                            {formData.rejectionReason && (
                                <div className="text-left bg-red-50/50 p-3 rounded-md border border-red-100">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Reason for decision:</p>
                                    <p className="text-sm text-gray-600">{formData.rejectionReason}</p>
                                </div>
                            )}
                            <p className="text-center text-gray-600">
                                We encourage you to apply again in the future. Thank you for your interest.
                            </p>
                            <div className="mt-4 flex justify-center">
                                <Button variant="outline" onClick={() => setShowRejectionModal(false)} className="w-auto px-8 border-red-200 text-red-700 hover:bg-red-50">Close</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Auto-save notification */}
                {lastSaved && (
                    <div className="autosave-indicator">
                        <CheckCircle className="h-3 w-3" />
                        <span>Auto-saved {lastSaved ? new Date(lastSaved).toLocaleTimeString() : ''}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
