'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface QuestionField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: { value: string; label: string; }[];
    validation?: {
        minLength?: number;
        maxLength?: number;
        pattern?: string;
    };
}

interface LadderQuestion {
    _id: string;
    week: string;
    title: string;
    description: string;
    fields: QuestionField[];
}

interface SubmissionResponse {
    fieldId: string;
    value: any;
}

interface LadderSubmission {
    _id?: string;
    week: string;
    questionId: string;
    responses: SubmissionResponse[];
    status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
    submittedAt?: string;
    reviewComments?: string;
    score?: number;
}

interface LadderSubmissionFormProps {
    week: string;
}

export default function LadderSubmissionForm({ week }: LadderSubmissionFormProps) {
    const router = useRouter();
    const [questions, setQuestions] = useState<LadderQuestion[]>([]);
    const [submission, setSubmission] = useState<LadderSubmission | null>(null);
    const [formData, setFormData] = useState<{ [key: string]: any }>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadQuestionAndSubmission();
    }, [week]);

    const loadQuestionAndSubmission = async () => {
        try {
            setLoading(true);

            // Load questions for the week
            const questionRes = await fetch(`/api/ladder/questions?week=${week}`);
            if (!questionRes.ok) {
                throw new Error('Failed to load questions');
            }
            const questionData = await questionRes.json();

            if (!questionData.questions || questionData.questions.length === 0) {
                setMessage({ type: 'error', text: 'No questions available for this week yet.' });
                return;
            }

            setQuestions(questionData.questions);

            // Load existing submission
            const submissionRes = await fetch(`/api/ladder/submissions?week=${week}`);
            if (submissionRes.ok) {
                const submissionData = await submissionRes.json();
                if (submissionData.submissions && submissionData.submissions.length > 0) {
                    const existingSubmission = submissionData.submissions[0];
                    setSubmission(existingSubmission);

                    // Populate form data from existing submission
                    const initialFormData: { [key: string]: any } = {};
                    existingSubmission.responses.forEach((response: SubmissionResponse) => {
                        initialFormData[response.fieldId] = response.value;
                    });
                    setFormData(initialFormData);
                }
            }

        } catch (error) {
            console.error('Error loading data:', error);
            setMessage({ type: 'error', text: 'Failed to load submission form.' });
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (fieldId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const validateForm = (): boolean => {
        if (!questions || questions.length === 0) return false;

        for (const question of questions) {
            for (const field of question.fields) {
                if (field.required && (!formData[field.id] || formData[field.id] === '')) {
                    setMessage({ type: 'error', text: `${field.label} is required.` });
                    return false;
                }

                if (field.validation) {
                    const value = formData[field.id];
                    if (value && typeof value === 'string') {
                        if (field.validation.minLength && value.length < field.validation.minLength) {
                            setMessage({ type: 'error', text: `${field.label} must be at least ${field.validation.minLength} characters.` });
                            return false;
                        }
                        if (field.validation.maxLength && value.length > field.validation.maxLength) {
                            setMessage({ type: 'error', text: `${field.label} must be no more than ${field.validation.maxLength} characters.` });
                            return false;
                        }
                        if (field.validation.pattern && !new RegExp(field.validation.pattern).test(value)) {
                            setMessage({ type: 'error', text: `${field.label} format is invalid.` });
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    };

    const saveDraft = async () => {
        if (!questions || questions.length === 0) return;

        setSaving(true);
        setMessage(null);

        try {
            const responses = Object.entries(formData).map(([fieldId, value]) => ({
                fieldId,
                value
            }));

            // For multiple questions, we'll use the first question's ID as the primary
            // but store responses for all fields from all questions
            const primaryQuestionId = questions[0]._id;

            const response = await fetch('/api/ladder/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    week,
                    questionId: primaryQuestionId,
                    responses,
                    status: 'draft'
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save draft');
            }

            const data = await response.json();
            setSubmission(data.submission);
            setMessage({ type: 'success', text: 'Draft saved successfully!' });

        } catch (error) {
            console.error('Error saving draft:', error);
            setMessage({ type: 'error', text: 'Failed to save draft.' });
        } finally {
            setSaving(false);
        }
    };

    const submitForm = async () => {
        if (!questions || questions.length === 0 || !validateForm()) return;

        setSubmitting(true);
        setMessage(null);

        try {
            const responses = Object.entries(formData).map(([fieldId, value]) => ({
                fieldId,
                value
            }));

            // For multiple questions, we'll use the first question's ID as the primary
            const primaryQuestionId = questions[0]._id;

            const response = await fetch('/api/ladder/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    week,
                    questionId: primaryQuestionId,
                    responses,
                    status: 'submitted'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit');
            }

            const data = await response.json();
            setSubmission(data.submission);
            setMessage({ type: 'success', text: 'Submission successful! You will receive feedback soon.' });

        } catch (error) {
            console.error('Error submitting:', error);
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to submit.' });
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (field: QuestionField) => {
        const value = formData[field.id] || '';

        switch (field.type) {
            case 'text':
                return (
                    <Input
                        id={field.id}
                        value={value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        disabled={submission?.status === 'submitted'}
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        id={field.id}
                        value={value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        disabled={submission?.status === 'submitted'}
                    />
                );

            case 'select':
                return (
                    <Select
                        value={value}
                        onValueChange={(val) => handleFieldChange(field.id, val)}
                        disabled={submission?.status === 'submitted'}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || 'Select an option'} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'radio':
                return (
                    <div className="space-y-2">
                        {field.options?.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id={`${field.id}-${option.value}`}
                                    name={field.id}
                                    value={option.value}
                                    checked={value === option.value}
                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                    disabled={submission?.status === 'submitted'}
                                    className="text-blue-600"
                                />
                                <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                            </div>
                        ))}
                    </div>
                );

            case 'checkbox':
                const checkboxValue = Array.isArray(value) ? value : [];
                return (
                    <div className="space-y-2">
                        {field.options?.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${field.id}-${option.value}`}
                                    checked={checkboxValue.includes(option.value)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            handleFieldChange(field.id, [...checkboxValue, option.value]);
                                        } else {
                                            handleFieldChange(field.id, checkboxValue.filter((v: string) => v !== option.value));
                                        }
                                    }}
                                    disabled={submission?.status === 'submitted'}
                                />
                                <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                            </div>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto max-w-4xl py-10 px-4">
                <div className="flex items-center justify-center min-h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <div className="container mx-auto max-w-4xl py-10 px-4">
                <Card>
                    <CardContent className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            No questions are available for this week yet.
                        </p>
                        <Button asChild>
                            <Link href="/ladder">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Ladder
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const weekTitle = week.charAt(0).toUpperCase() + week.slice(1).replace(/(\d)/, ' $1');

    return (
        <div className="container mx-auto max-w-4xl py-10 px-4">
            <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                    <Link href="/ladder">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Ladder
                    </Link>
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{weekTitle} Submission</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {questions.length > 1 ? `${questions.length} questions` : questions[0].title}
                        </p>
                    </div>
                    {submission && (
                        <Badge
                            variant={submission.status === 'submitted' ? 'default' : 'secondary'}
                            className="ml-4"
                        >
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </Badge>
                    )}
                </div>
            </div>

            {message && (
                <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            {submission?.reviewComments && (
                <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                    <CardHeader>
                        <CardTitle className="text-blue-800 dark:text-blue-200">Review Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-blue-700 dark:text-blue-300">{submission.reviewComments}</p>
                        {submission.score !== undefined && (
                            <div className="mt-2">
                                <Badge variant="outline" className="border-blue-300 text-blue-800 dark:text-blue-200">
                                    Score: {submission.score}/100
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                {questions.map((question, questionIndex) => (
                    <Card key={question._id}>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                {questions.length > 1 && (
                                    <Badge variant="outline" className="mr-3">
                                        Question {questionIndex + 1}
                                    </Badge>
                                )}
                                {question.title}
                            </CardTitle>
                            {question.description && (
                                <CardDescription>{question.description}</CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {question.fields.map((field: QuestionField) => (
                                <div key={field.id} className="space-y-2">
                                    <Label htmlFor={field.id} className="flex items-center">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </Label>
                                    {renderField(field)}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}

                {submission?.status !== 'submitted' && (
                    <div className="flex space-x-4 pt-6">
                        <Button
                            onClick={saveDraft}
                            disabled={saving || submitting}
                            variant="outline"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Draft
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={submitForm}
                            disabled={saving || submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {submission?.status === 'submitted' && (
                    <div className="pt-6">
                        <Alert>
                            <AlertDescription>
                                This submission has been submitted and cannot be modified.
                                {submission.submittedAt && (
                                    <span className="block mt-1 text-sm text-gray-600">
                                        Submitted on: {new Date(submission.submittedAt).toLocaleDateString()}
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </div>
        </div>
    );
}
