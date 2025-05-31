'use client';

import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Send, CheckCircle } from 'lucide-react';

interface ApplicationFormProps {
    session: Session;
}

interface ApplicationData {
    id?: string;
    phone: string;
    whyJoin: string;
    status: 'draft' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
}

export default function ApplicationForm({ session }: ApplicationFormProps) {
    const [formData, setFormData] = useState<ApplicationData>({
        phone: '',
        whyJoin: '',
        status: 'draft',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Load existing application on mount
    useEffect(() => {
        loadExistingApplication();
    }, []);

    const loadExistingApplication = async () => {
        try {
            const response = await fetch('/api/applications');
            if (response.ok) {
                const data = await response.json();
                if (data.application) {
                    setFormData({
                        id: data.application._id,
                        phone: data.application.phone || '',
                        whyJoin: data.application.whyJoin || '',
                        status: data.application.status,
                    });
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

        if (!formData.whyJoin.trim()) {
            setMessage({ type: 'error', text: 'Please tell us why you want to join Ladder' });
            return;
        }

        if (formData.whyJoin.length < 50) {
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const isSubmitted = formData.status === 'submitted';
    const canEdit = formData.status === 'draft' || !formData.id;

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Application Form</CardTitle>
                        <CardDescription>
                            {isSubmitted
                                ? 'Your application has been submitted and is under review'
                                : 'Fill out the form below to apply for the Ladder program'
                            }
                        </CardDescription>
                    </div>
                    <Badge variant={
                        formData.status === 'submitted' ? 'default' :
                            formData.status === 'accepted' ? 'default' :
                                formData.status === 'rejected' ? 'destructive' :
                                    'secondary'
                    }>
                        {formData.status === 'submitted' ? 'Submitted' :
                            formData.status === 'accepted' ? 'Accepted' :
                                formData.status === 'rejected' ? 'Rejected' :
                                    'Draft'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* User Info (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={session.user?.name || ''}
                            disabled
                            className="bg-gray-50 dark:bg-gray-800"
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={session.user?.email || ''}
                            disabled
                            className="bg-gray-50 dark:bg-gray-800"
                        />
                    </div>
                </div>

                {/* Phone Number */}
                <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!canEdit}
                    />
                </div>

                {/* Why Join */}
                <div>
                    <Label htmlFor="whyJoin">Why do you want to join Ladder? *</Label>
                    <textarea
                        id="whyJoin"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tell us about your motivation, goals, and what you hope to achieve through the Ladder program... (minimum 50 characters)"
                        value={formData.whyJoin}
                        onChange={(e) => setFormData(prev => ({ ...prev, whyJoin: e.target.value }))}
                        disabled={!canEdit}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                        {formData.whyJoin.length}/1000 characters (minimum 50 required)
                    </p>
                </div>

                {/* Message */}
                {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                {/* Action Buttons */}
                {canEdit && (
                    <div className="flex gap-4 justify-end">
                        <Button
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={saving || submitting}
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Draft
                        </Button>

                        <Button
                            onClick={handleSubmit}
                            disabled={saving || submitting || formData.whyJoin.length < 50 || !formData.phone.trim()}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            Submit Application
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
    );
}
