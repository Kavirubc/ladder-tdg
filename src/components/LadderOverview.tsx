'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, Clock, FileText, Loader2 } from 'lucide-react';

interface LadderSubmission {
    _id: string;
    week: string;
    status: string;
    submittedAt?: string;
    score?: number;
}

interface Session {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
    };
}

interface LadderOverviewProps {
    session: Session;
}

export default function LadderOverview({ session }: LadderOverviewProps) {
    const [submissions, setSubmissions] = useState<LadderSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        try {
            const response = await fetch('/api/ladder/submissions');
            if (response.ok) {
                const data = await response.json();
                setSubmissions(data.submissions);
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const weeks = [
        {
            id: 'week1',
            title: 'Week 1 Submission',
            description: 'Complete your first week assignments and reflections',
        },
        {
            id: 'week2',
            title: 'Week 2 Submission',
            description: 'Submit your progress updates and learnings',
        },
        {
            id: 'week3',
            title: 'Week 3 Submission',
            description: 'Document your project milestones and challenges',
        },
        {
            id: 'week4',
            title: 'Week 4 Submission',
            description: 'Final week progress and upcoming goals',
        },
        {
            id: 'complete',
            title: 'Program Completion',
            description: 'Final project submission and program reflection',
        },
    ];

    const getWeekStatus = (weekId: string) => {
        const submission = submissions.find(s => s.week === weekId);

        if (!submission) {
            // Check if previous weeks are completed to determine if this week is available
            const weekOrder = ['week1', 'week2', 'week3', 'week4', 'complete'];
            const currentIndex = weekOrder.indexOf(weekId);

            if (currentIndex === 0) return 'available'; // Week 1 is always available

            // Check if previous week is completed
            const previousWeekId = weekOrder[currentIndex - 1];
            const previousSubmission = submissions.find(s => s.week === previousWeekId);

            if (previousSubmission && (previousSubmission.status === 'approved' || previousSubmission.status === 'submitted')) {
                return 'available';
            }

            return 'locked';
        }

        if (submission.status === 'approved') return 'completed';
        if (submission.status === 'submitted' || submission.status === 'reviewed') return 'submitted';
        if (submission.status === 'draft') return 'in-progress';

        return 'available';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'submitted':
                return <Clock className="h-5 w-5 text-blue-500" />;
            case 'in-progress':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'available':
                return <FileText className="h-5 w-5 text-blue-500" />;
            default:
                return <FileText className="h-5 w-5 text-gray-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
            case 'submitted':
                return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Submitted</Badge>;
            case 'in-progress':
                return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</Badge>;
            case 'available':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Available</Badge>;
            default:
                return <Badge variant="secondary">Locked</Badge>;
        }
    };

    const getButtonText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'View';
            case 'submitted':
                return 'View';
            case 'in-progress':
                return 'Continue';
            case 'available':
                return 'Start';
            default:
                return 'Locked';
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto max-w-6xl py-10 px-4">
                <div className="flex items-center justify-center min-h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl py-10 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-center mb-2">Ladder Program Submissions</h1>
                <p className="text-center text-gray-600 dark:text-gray-400">
                    Track your progress and submit your weekly assignments
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {weeks.map((week) => {
                    const status = getWeekStatus(week.id);
                    const submission = submissions.find(s => s.week === week.id);

                    return (
                        <Card key={week.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(status)}
                                        <CardTitle className="text-lg">{week.title}</CardTitle>
                                    </div>
                                    {getStatusBadge(status)}
                                </div>
                                <CardDescription>{week.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col space-y-1">
                                        {submission?.submittedAt && (
                                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                <Calendar className="h-4 w-4" />
                                                <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                        {submission?.score !== undefined && (
                                            <div className="text-sm text-gray-600">
                                                Score: {submission.score}/100
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        asChild
                                        variant={status === 'available' || status === 'in-progress' ? 'default' : 'secondary'}
                                        disabled={status === 'locked'}
                                        size="sm"
                                    >
                                        <Link href={`/ladder/${week.id}`}>
                                            {getButtonText(status)}
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-12 text-center">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Program Guidelines</CardTitle>
                    </CardHeader>
                    <CardContent className="text-left space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Submission Requirements:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <li>Complete all required fields for each week</li>
                                <li>Submit before the deadline to avoid late penalties</li>
                                <li>Provide detailed and thoughtful responses</li>
                                <li>Upload any required documents or files</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Review Process:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <li>Submissions are reviewed by program administrators</li>
                                <li>Feedback will be provided within 3-5 business days</li>
                                <li>You may be asked to revise and resubmit if needed</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Progress Logic:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <li>Each week unlocks after the previous week is submitted</li>
                                <li>Week 1 is available immediately for all participants</li>
                                <li>You can save drafts and continue working on submissions</li>
                                <li>Completed submissions cannot be modified</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
