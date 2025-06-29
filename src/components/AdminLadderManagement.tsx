'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit, Trash2, Eye, Star } from 'lucide-react';

interface QuestionField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
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
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

interface LadderSubmission {
    _id: string;
    userId: string;
    userEmail: string;
    userName: string;
    week: string;
    questionId: any;
    responses: { fieldId: string; value: any }[];
    status: string;
    submittedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewComments?: string;
    score?: number;
    createdAt: string;
    updatedAt: string;
    enhancedResponses?: { fieldId: string; value: any; fieldInfo?: any }[];
}

export default function AdminLadderManagement() {
    const [questions, setQuestions] = useState<LadderQuestion[]>([]);
    const [submissions, setSubmissions] = useState<LadderSubmission[]>([]);
    const [groupedSubmissions, setGroupedSubmissions] = useState<{ [key: string]: LadderSubmission[] }>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('questions');
    const [selectedWeek, setSelectedWeek] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<LadderQuestion | null>(null);
    const [viewingSubmission, setViewingSubmission] = useState<LadderSubmission | null>(null);
    const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state for question creation/editing
    const [questionForm, setQuestionForm] = useState({
        week: '',
        title: '',
        description: '',
        fields: [] as QuestionField[],
    });

    const [newField, setNewField] = useState<Partial<QuestionField>>({
        type: 'text',
        required: false,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([loadQuestions(), loadSubmissions()]);
        } catch (error) {
            console.error('Error loading data:', error);
            setMessage({ type: 'error', text: 'Failed to load data' });
        } finally {
            setLoading(false);
        }
    };

    const loadQuestions = async () => {
        const response = await fetch('/api/admin/ladder/questions');
        if (response.ok) {
            const data = await response.json();
            setQuestions(data.questions);
        }
    };

    const loadSubmissions = async () => {
        const params = new URLSearchParams();
        if (selectedWeek !== 'all') params.set('week', selectedWeek);
        if (selectedStatus !== 'all') params.set('status', selectedStatus);

        const response = await fetch(`/api/admin/ladder/submissions?${params}`);
        if (response.ok) {
            const data = await response.json();
            setSubmissions(data.submissions);
            setGroupedSubmissions(data.groupedSubmissions);
        }
    };

    const resetQuestionForm = () => {
        setQuestionForm({
            week: '',
            title: '',
            description: '',
            fields: [],
        });
        setEditingQuestion(null);
        setShowQuestionForm(false);
    };

    const handleCreateQuestion = async () => {
        try {
            if (!questionForm.title || !questionForm.week || questionForm.fields.length === 0) {
                setMessage({ type: 'error', text: 'Please fill in all required fields' });
                return;
            }

            const response = await fetch('/api/admin/ladder/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionForm),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Question created successfully!' });
                resetQuestionForm();
                loadQuestions();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Failed to create question' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to create question' });
        }
    };

    const handleUpdateQuestion = async () => {
        if (!editingQuestion) return;

        try {
            const response = await fetch(`/api/admin/ladder/questions/${editingQuestion._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionForm),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Question updated successfully!' });
                resetQuestionForm();
                loadQuestions();
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.error || 'Failed to update question' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update question' });
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            const response = await fetch(`/api/admin/ladder/questions/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Question deleted successfully!' });
                loadQuestions();
            } else {
                setMessage({ type: 'error', text: 'Failed to delete question' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete question' });
        }
    };

    const handleEditQuestion = (question: LadderQuestion) => {
        setEditingQuestion(question);
        setQuestionForm({
            week: question.week,
            title: question.title,
            description: question.description,
            fields: [...question.fields],
        });
        setShowQuestionForm(true);
    };

    const addField = () => {
        if (!newField.id || !newField.label) {
            setMessage({ type: 'error', text: 'Field ID and label are required' });
            return;
        }

        // Check for field ID uniqueness across all questions for the same week
        if (questionForm.fields.some(field => field.id === newField.id)) {
            setMessage({ type: 'error', text: 'Field ID must be unique within this question' });
            return;
        }

        const field: QuestionField = {
            id: newField.id!,
            type: newField.type as any,
            label: newField.label!,
            placeholder: newField.placeholder,
            required: newField.required || false,
            options: newField.options,
            validation: newField.validation,
        };

        setQuestionForm(prev => ({
            ...prev,
            fields: [...prev.fields, field],
        }));

        setNewField({
            type: 'text',
            required: false,
        });
    };

    const removeField = (index: number) => {
        setQuestionForm(prev => ({
            ...prev,
            fields: prev.fields.filter((_, i) => i !== index),
        }));
    };

    const updateSubmissionStatus = async (submissionId: string, status: string, reviewComments?: string, score?: number) => {
        try {
            const response = await fetch(`/api/admin/ladder/submissions/${submissionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reviewComments, score }),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Submission updated successfully!' });
                loadSubmissions();
            } else {
                setMessage({ type: 'error', text: 'Failed to update submission' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update submission' });
        }
    };

    const handleViewSubmission = async (submissionId: string) => {
        try {
            const response = await fetch(`/api/admin/ladder/submissions/${submissionId}`);
            if (response.ok) {
                const data = await response.json();
                const submission = data.submission;

                // Fetch all questions for this week to get proper field labels
                const questionsResponse = await fetch(`/api/admin/ladder/questions`);
                if (questionsResponse.ok) {
                    const questionsData = await questionsResponse.json();
                    const weekQuestions = questionsData.questions.filter((q: any) =>
                        q.week === submission.week && q.isActive
                    );

                    // Create a field lookup map
                    const fieldMap: { [key: string]: any } = {};
                    weekQuestions.forEach((question: any) => {
                        question.fields.forEach((field: any) => {
                            fieldMap[field.id] = {
                                ...field,
                                questionTitle: question.title
                            };
                        });
                    });

                    // Enhance responses with field information
                    submission.enhancedResponses = submission.responses.map((response: any) => ({
                        ...response,
                        fieldInfo: fieldMap[response.fieldId] || null
                    }));
                }

                setViewingSubmission(submission);
                setShowSubmissionDetails(true);
            } else {
                setMessage({ type: 'error', text: 'Failed to load submission details' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load submission details' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {message && (
                <Alert className={`${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="questions">Manage Questions</TabsTrigger>
                    <TabsTrigger value="submissions">View Submissions</TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Ladder Questions</CardTitle>
                                    <CardDescription>
                                        Manage questions for each week of the ladder program.
                                        Multiple questions per week will be displayed together in one form.
                                    </CardDescription>
                                </div>
                                <Dialog open={showQuestionForm} onOpenChange={setShowQuestionForm}>
                                    <DialogTrigger asChild>
                                        <Button onClick={() => setShowQuestionForm(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Question
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>
                                                {editingQuestion ? 'Edit Question' : 'Create New Question'}
                                            </DialogTitle>
                                            <DialogDescription>
                                                Create questions with custom fields for ladder submissions
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="week">Week</Label>
                                                    <Select
                                                        value={questionForm.week}
                                                        onValueChange={(value) => setQuestionForm(prev => ({ ...prev, week: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select week" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="week1">Week 1</SelectItem>
                                                            <SelectItem value="week2">Week 2</SelectItem>
                                                            <SelectItem value="week3">Week 3</SelectItem>
                                                            <SelectItem value="week4">Week 4</SelectItem>
                                                            <SelectItem value="complete">Program Complete</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="title">Title</Label>
                                                    <Input
                                                        id="title"
                                                        value={questionForm.title}
                                                        onChange={(e) => setQuestionForm(prev => ({ ...prev, title: e.target.value }))}
                                                        placeholder="Question title"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea
                                                    id="description"
                                                    value={questionForm.description}
                                                    onChange={(e) => setQuestionForm(prev => ({ ...prev, description: e.target.value }))}
                                                    placeholder="Question description"
                                                    rows={3}
                                                />
                                            </div>

                                            {/* Fields management */}
                                            <div>
                                                <Label>Fields</Label>
                                                <div className="space-y-2 mt-2">
                                                    {questionForm.fields.map((field, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                                                            <div>
                                                                <span className="font-medium">{field.label}</span>
                                                                <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                                                                {field.required && <Badge variant="outline" className="ml-2">Required</Badge>}
                                                            </div>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => removeField(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Add new field */}
                                                <div className="border rounded p-4 mt-4 space-y-3">
                                                    <h4 className="font-medium">Add New Field</h4>
                                                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                                                        <strong>Important:</strong> Field IDs must be unique across ALL questions in the same week since they'll be displayed together.
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <Label>Field ID</Label>
                                                            <Input
                                                                value={newField.id || ''}
                                                                onChange={(e) => setNewField(prev => ({ ...prev, id: e.target.value }))}
                                                                placeholder="field_id"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Type</Label>
                                                            <Select
                                                                value={newField.type}
                                                                onValueChange={(value) => setNewField(prev => ({ ...prev, type: value as any }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="text">Text</SelectItem>
                                                                    <SelectItem value="textarea">Textarea</SelectItem>
                                                                    <SelectItem value="select">Select</SelectItem>
                                                                    <SelectItem value="radio">Radio</SelectItem>
                                                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label>Label</Label>
                                                        <Input
                                                            value={newField.label || ''}
                                                            onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                                                            placeholder="Field label"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Placeholder</Label>
                                                        <Input
                                                            value={newField.placeholder || ''}
                                                            onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                                                            placeholder="Placeholder text"
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id="required"
                                                            checked={newField.required}
                                                            onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                                                        />
                                                        <Label htmlFor="required">Required field</Label>
                                                    </div>
                                                    <Button onClick={addField} type="button">
                                                        Add Field
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex justify-end space-x-2">
                                                <Button variant="outline" onClick={resetQuestionForm}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}>
                                                    {editingQuestion ? 'Update' : 'Create'} Question
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Week Summary */}
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <h3 className="font-semibold mb-3">Questions per Week</h3>
                                <div className="grid grid-cols-5 gap-4">
                                    {['week1', 'week2', 'week3', 'week4', 'complete'].map((week) => {
                                        const weekQuestions = questions.filter(q => q.week === week && q.isActive);
                                        return (
                                            <div key={week} className="text-center">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {week.replace('week', 'Week ').replace('complete', 'Complete')}
                                                </div>
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {weekQuestions.length}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {weekQuestions.length === 1 ? 'question' : 'questions'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Week</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Fields</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {questions.map((question) => (
                                        <TableRow key={question._id}>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {question.week.replace('week', 'Week ').replace('complete', 'Complete')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{question.title}</TableCell>
                                            <TableCell>{question.fields.length} fields</TableCell>
                                            <TableCell>
                                                <Badge variant={question.isActive ? 'default' : 'secondary'}>
                                                    {question.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{new Date(question.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditQuestion(question)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteQuestion(question._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="submissions" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Ladder Submissions</CardTitle>
                                    <CardDescription>Review and manage user submissions</CardDescription>
                                </div>
                                <div className="flex space-x-2">
                                    <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Weeks</SelectItem>
                                            <SelectItem value="week1">Week 1</SelectItem>
                                            <SelectItem value="week2">Week 2</SelectItem>
                                            <SelectItem value="week3">Week 3</SelectItem>
                                            <SelectItem value="week4">Week 4</SelectItem>
                                            <SelectItem value="complete">Complete</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="reviewed">Reviewed</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={loadSubmissions}>
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Week</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {submissions.map((submission) => (
                                        <TableRow key={submission._id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{submission.userName}</div>
                                                    <div className="text-sm text-gray-500">{submission.userEmail}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {submission.week.replace('week', 'Week ').replace('complete', 'Complete')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={submission.status === 'approved' ? 'default' :
                                                        submission.status === 'rejected' ? 'destructive' : 'secondary'}
                                                >
                                                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {submission.submittedAt ?
                                                    new Date(submission.submittedAt).toLocaleDateString() :
                                                    'Not submitted'
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {submission.score !== undefined ? (
                                                    <div className="flex items-center space-x-1">
                                                        <Star className="h-4 w-4 text-yellow-500" />
                                                        <span>{submission.score}/100</span>
                                                    </div>
                                                ) : (
                                                    'Not scored'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewSubmission(submission._id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Select onValueChange={(status) => updateSubmissionStatus(submission._id, status)}>
                                                        <SelectTrigger className="w-24">
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="reviewed">Review</SelectItem>
                                                            <SelectItem value="approved">Approve</SelectItem>
                                                            <SelectItem value="rejected">Reject</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Submission Details Dialog */}
            <Dialog open={showSubmissionDetails} onOpenChange={setShowSubmissionDetails}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Submission Details</DialogTitle>
                        <DialogDescription>
                            {viewingSubmission && (
                                <span>
                                    {viewingSubmission.userName} - {viewingSubmission.week.replace('week', 'Week ').replace('complete', 'Program Complete')}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {viewingSubmission && (
                        <div className="space-y-6">
                            {/* Submission Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">User</Label>
                                    <p className="text-sm">{viewingSubmission.userName}</p>
                                    <p className="text-xs text-gray-500">{viewingSubmission.userEmail}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <Badge
                                            variant={viewingSubmission.status === 'approved' ? 'default' :
                                                viewingSubmission.status === 'rejected' ? 'destructive' : 'secondary'}
                                        >
                                            {viewingSubmission.status.charAt(0).toUpperCase() + viewingSubmission.status.slice(1)}
                                        </Badge>
                                        {viewingSubmission.score !== undefined && (
                                            <Badge variant="outline">Score: {viewingSubmission.score}/100</Badge>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Submitted</Label>
                                    <p className="text-sm">
                                        {viewingSubmission.submittedAt ?
                                            new Date(viewingSubmission.submittedAt).toLocaleDateString() :
                                            'Not submitted'
                                        }
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Reviewed</Label>
                                    <p className="text-sm">
                                        {viewingSubmission.reviewedAt ?
                                            new Date(viewingSubmission.reviewedAt).toLocaleDateString() :
                                            'Not reviewed'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Question Title */}
                            {viewingSubmission.questionId && (
                                <div>
                                    <Label className="text-lg font-semibold">Question</Label>
                                    <p className="text-gray-700 mt-1">{viewingSubmission.questionId.title}</p>
                                    {viewingSubmission.questionId.description && (
                                        <p className="text-gray-600 text-sm mt-1">{viewingSubmission.questionId.description}</p>
                                    )}
                                </div>
                            )}

                            {/* Responses */}
                            <div>
                                <Label className="text-lg font-semibold">All Responses</Label>
                                <div className="space-y-6 mt-3">
                                    {viewingSubmission.enhancedResponses ? (
                                        // Group responses by question
                                        (() => {
                                            const groupedByQuestion: { [key: string]: any[] } = {};
                                            viewingSubmission.enhancedResponses.forEach((response: any) => {
                                                const questionTitle = response.fieldInfo?.questionTitle || 'Unknown Question';
                                                if (!groupedByQuestion[questionTitle]) {
                                                    groupedByQuestion[questionTitle] = [];
                                                }
                                                groupedByQuestion[questionTitle].push(response);
                                            });

                                            return Object.entries(groupedByQuestion).map(([questionTitle, responses]) => (
                                                <div key={questionTitle} className="border-2 border-blue-200 rounded-lg p-4">
                                                    <h3 className="text-lg font-semibold text-blue-800 mb-4">{questionTitle}</h3>
                                                    <div className="space-y-3">
                                                        {responses.map((response: any) => (
                                                            <div key={response.fieldId} className="border rounded-lg p-3 bg-white">
                                                                <Label className="font-medium">
                                                                    {response.fieldInfo?.label || response.fieldId}
                                                                    {response.fieldInfo?.required && <span className="text-red-500 ml-1">*</span>}
                                                                </Label>
                                                                <div className="mt-2 p-3 bg-gray-50 rounded border">
                                                                    {response.value ? (
                                                                        Array.isArray(response.value) ? (
                                                                            <ul className="list-disc list-inside">
                                                                                {response.value.map((item: any, index: number) => (
                                                                                    <li key={index}>{item}</li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : (
                                                                            <p className="whitespace-pre-wrap">{response.value}</p>
                                                                        )
                                                                    ) : (
                                                                        <p className="text-gray-500 italic">No response provided</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ));
                                        })()
                                    ) : (
                                        // Fallback for submissions without enhanced data
                                        viewingSubmission.responses.map((response: any, index: number) => (
                                            <div key={response.fieldId} className="border rounded-lg p-4">
                                                <Label className="font-medium">
                                                    Field ID: {response.fieldId}
                                                </Label>
                                                <div className="mt-2 p-3 bg-gray-50 rounded border">
                                                    {response.value ? (
                                                        Array.isArray(response.value) ? (
                                                            <ul className="list-disc list-inside">
                                                                {response.value.map((item: any, index: number) => (
                                                                    <li key={index}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="whitespace-pre-wrap">{response.value}</p>
                                                        )
                                                    ) : (
                                                        <p className="text-gray-500 italic">No response provided</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Review Comments */}
                            {viewingSubmission.reviewComments && (
                                <div>
                                    <Label className="text-lg font-semibold">Review Comments</Label>
                                    <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="whitespace-pre-wrap">{viewingSubmission.reviewComments}</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons for Review */}
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSubmissionDetails(false)}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        updateSubmissionStatus(viewingSubmission._id, 'reviewed');
                                        setShowSubmissionDetails(false);
                                    }}
                                    variant="secondary"
                                >
                                    Mark as Reviewed
                                </Button>
                                <Button
                                    onClick={() => {
                                        updateSubmissionStatus(viewingSubmission._id, 'approved');
                                        setShowSubmissionDetails(false);
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Approve
                                </Button>
                                <Button
                                    onClick={() => {
                                        updateSubmissionStatus(viewingSubmission._id, 'rejected');
                                        setShowSubmissionDetails(false);
                                    }}
                                    variant="destructive"
                                >
                                    Reject
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
