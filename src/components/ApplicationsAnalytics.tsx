'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Users,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Loader2,
    TrendingUp
} from 'lucide-react';

interface Application {
    _id: string;
    name: string;
    email: string;
    phone: string;
    whyJoin: string;
    status: 'draft' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
    submittedAt?: string;
}

interface Analytics {
    total: number;
    byStatus: {
        draft: number;
        submitted: number;
        reviewed: number;
        accepted: number;
        rejected: number;
    };
    recentApplications: number;
}

export default function ApplicationsAnalytics() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [applicationsRes, analyticsRes] = await Promise.all([
                fetch('/api/admin/applications'),
                fetch('/api/admin/applications/analytics')
            ]);

            if (applicationsRes.ok && analyticsRes.ok) {
                const applicationsData = await applicationsRes.json();
                const analyticsData = await analyticsRes.json();

                setApplications(applicationsData.applications);
                setAnalytics(analyticsData);
            } else {
                setError('Failed to fetch data');
            }
        } catch (error) {
            setError('An error occurred while fetching data');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
        setUpdating(applicationId);
        setError(null);

        try {
            const response = await fetch(`/api/admin/applications/${applicationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                // Refresh data
                fetchData();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update status');
            }
        } catch (error) {
            setError('An error occurred while updating');
        } finally {
            setUpdating(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            draft: 'secondary',
            submitted: 'default',
            reviewed: 'outline',
            accepted: 'default',
            rejected: 'destructive',
        } as const;

        return (
            <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Analytics Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.byStatus.submitted}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.byStatus.accepted}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recent (7 days)</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.recentApplications}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Applications Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Applications</CardTitle>
                    <CardDescription>
                        Manage and review all program applications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Applicant</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Applied</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((application) => (
                                    <TableRow key={application._id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{application.name}</div>
                                                <div className="text-sm text-muted-foreground">{application.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{application.phone}</TableCell>
                                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                                        <TableCell>
                                            {application.submittedAt ? formatDate(application.submittedAt) : 'Not submitted'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedApplication(application)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {application.status === 'submitted' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateApplicationStatus(application._id, 'accepted')}
                                                            disabled={updating === application._id}
                                                        >
                                                            {updating === application._id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateApplicationStatus(application._id, 'rejected')}
                                                            disabled={updating === application._id}
                                                        >
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Application Detail Modal */}
            {selectedApplication && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{selectedApplication.name}'s Application</CardTitle>
                                    <CardDescription>{selectedApplication.email}</CardDescription>
                                </div>
                                <Button variant="ghost" onClick={() => setSelectedApplication(null)}>
                                    ×
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <strong>Phone:</strong> {selectedApplication.phone}
                                </div>
                                <div>
                                    <strong>Status:</strong> {getStatusBadge(selectedApplication.status)}
                                </div>
                                <div>
                                    <strong>Applied:</strong> {formatDate(selectedApplication.createdAt)}
                                </div>
                                {selectedApplication.submittedAt && (
                                    <div>
                                        <strong>Submitted:</strong> {formatDate(selectedApplication.submittedAt)}
                                    </div>
                                )}
                            </div>

                            <div>
                                <strong>Why they want to join:</strong>
                                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    {selectedApplication.whyJoin}
                                </div>
                            </div>

                            {selectedApplication.status === 'submitted' && (
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => updateApplicationStatus(selectedApplication._id, 'rejected')}
                                        disabled={updating === selectedApplication._id}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => updateApplicationStatus(selectedApplication._id, 'accepted')}
                                        disabled={updating === selectedApplication._id}
                                    >
                                        Accept
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
