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
                                    <CardDescription>Manage questions for each week of the ladder program</CardDescription>
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
                                                    <Button variant="outline" size="sm">
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
        </div>
    );
}
