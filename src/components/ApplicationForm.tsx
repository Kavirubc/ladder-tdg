'use client';

import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Loader2,
    AlertCircle,
    Phone,
    MessageSquare
} from 'lucide-react';

interface ApplicationFormProps {
    session: Session;
}

interface FormData {
    id?: string;
    name: string;
    email: string;
    phone: string;
    whyJoin: string;
    status: 'draft' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
    rejectionReason?: string;
}

interface Message {
    type: 'success' | 'error';
    text: string;
}

export default function ApplicationForm({ session }: ApplicationFormProps) {
    const [formData, setFormData] = useState<FormData>({
        name: session.user?.name || '',
        email: session.user?.email || '',
        phone: '',
        whyJoin: '',
        status: 'draft'
    });

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
        try {
            const response = await fetch('/api/applications');
            if (response.ok) {
                const data = await response.json();
                if (data.application) {
                    setFormData(data.application);
                }
            }
        } catch (error) {
            console.error('Error loading application:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!formData.phone.trim() && !formData.whyJoin.trim()) {
            setMessage({ type: 'error', text: 'Please fill in at least one field before saving.' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch('/api/applications', {
                method: formData.id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    status: 'draft',
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setFormData(prev => ({ ...prev, id: data.application._id }));
                setMessage({ type: 'success', text: 'Draft saved successfully!' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save draft' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while saving' });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.phone.trim()) {
            setMessage({ type: 'error', text: 'Phone number is required' });
            return;
        }

        if (!formData.whyJoin.trim() || formData.whyJoin.length < 50) {
            setMessage({ type: 'error', text: 'Please provide at least 50 characters explaining why you want to join' });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch('/api/applications', {
                method: formData.id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    status: 'submitted',
                    submittedAt: new Date().toISOString(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setFormData(prev => ({
                    ...prev,
                    id: data.application._id,
                    status: 'submitted'
                }));
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft':
                return <FileText className="h-5 w-5 text-gray-600" />;
            case 'submitted':
                return <Clock className="h-5 w-5 text-blue-600" />;
            case 'reviewed':
                return <Clock className="h-5 w-5 text-yellow-600" />;
            case 'accepted':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'rejected':
                return <XCircle className="h-5 w-5 text-red-600" />;
            default:
                return <FileText className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'draft':
                return 'Draft saved - you can continue editing';
            case 'submitted':
                return 'Application submitted - under review';
            case 'reviewed':
                return 'Application under review';
            case 'accepted':
                return 'Congratulations! Your application has been accepted';
            case 'rejected':
                return 'Application not approved';
            default:
                return 'Ready to fill out your application';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Status Banner */}
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

            <Card>
                <CardHeader>
                    <CardTitle>Application Form</CardTitle>
                    <CardDescription>
                        Tell us about yourself and why you want to join the Ladder program
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {message && (
                        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    {/* Name (Read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            disabled
                            className="bg-gray-50"
                        />
                        <p className="text-sm text-gray-500">
                            Auto-populated from your account
                        </p>
                    </div>

                    {/* Email (Read-only) */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            disabled
                            className="bg-gray-50"
                        />
                        <p className="text-sm text-gray-500">
                            Auto-populated from your account
                        </p>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number *
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            disabled={isReadOnly}
                            className={isReadOnly ? 'bg-gray-50' : ''}
                        />
                    </div>

                    {/* Why Join */}
                    <div className="space-y-2">
                        <Label htmlFor="whyJoin" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Why do you want to join the Ladder program? *
                        </Label>
                        <textarea
                            id="whyJoin"
                            placeholder="Tell us about your goals, interests, and what you hope to achieve... (minimum 50 characters)"
                            value={formData.whyJoin}
                            onChange={(e) => setFormData(prev => ({ ...prev, whyJoin: e.target.value }))}
                            disabled={isReadOnly}
                            className={`flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isReadOnly ? 'bg-gray-50' : ''
                                }`}
                            rows={6}
                        />
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Minimum 50 characters required</span>
                            <span className={formData.whyJoin.length < 50 ? 'text-red-500' : 'text-green-600'}>
                                {formData.whyJoin.length}/50
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {!isReadOnly && (
                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={handleSaveDraft}
                                disabled={saving || submitting}
                                className="flex-1"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Draft'
                                )}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={saving || submitting || !formData.phone.trim() || formData.whyJoin.length < 50}
                                className="flex-1"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Application'
                                )}
                            </Button>
                        </div>
                    )}

                    {isSubmitted && (
                        <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-green-700 dark:text-green-400">
                                Application submitted successfully! We'll review it and get back to you soon.
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Success Modal */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 rounded-full">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <DialogTitle>Congratulations!</DialogTitle>
                        </div>
                        <DialogDescription className="text-left space-y-3">
                            <div>
                                Your application to the Ladder program has been <strong>approved</strong>!
                                We're excited to have you join our community.
                            </div>
                            <div>
                                You can now access exclusive resources and start your journey with us.
                                Check your email for more details and next steps.
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex justify-end">
                        <Button onClick={() => setShowSuccessModal(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rejection Modal */}
            <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-100 rounded-full">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <DialogTitle>Application Update</DialogTitle>
                        </div>
                        <DialogDescription className="text-left space-y-3">
                            <div>
                                We regret to inform you that your application to the Ladder program was not approved at this time.
                            </div>
                            {formData.rejectionReason && (
                                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                    <p className="text-sm font-medium text-red-700">Reason for decision:</p>
                                    <p className="text-sm text-red-600">{formData.rejectionReason}</p>
                                </div>
                            )}
                            <div>
                                We encourage you to apply again in the future. Thank you for your interest.
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex justify-end">
                        <Button variant="outline" onClick={() => setShowRejectionModal(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
