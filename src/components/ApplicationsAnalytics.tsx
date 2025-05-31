'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Users, 
    FileText, 
    Clock, 
    CheckCircle, 
    XCircle, 
    Eye,
    Loader2,
    TrendingUp,
    Edit,
    RotateCcw
} from 'lucide-react';

interface Application {
    _id: string;
    name: string;
    email: string;
    phone: string;
    whyJoin: string;
    status: 'draft' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
    submittedAt?: string;
    statusHistory?: Array<{
        status: string;
        timestamp: string;
        comment: string;
    }>;
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
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusUpdateData, setStatusUpdateData] = useState({
        applicationId: '',
        newStatus: '',
        comment: ''
    });
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

    const openStatusModal = (applicationId: string, currentStatus: string) => {
        setStatusUpdateData({
            applicationId,
            newStatus: '',
            comment: ''
        });
        setShowStatusModal(true);
    };

    const updateApplicationStatus = async () => {
        if (!statusUpdateData.newStatus) {
            setError('Please select a status');
            return;
        }

        if (statusUpdateData.newStatus === 'rejected' && !statusUpdateData.comment.trim()) {
            setError('Please provide a reason for rejection');
            return;
        }

        setUpdating(statusUpdateData.applicationId);
        setError(null);

        try {
            const response = await fetch(`/api/admin/applications/${statusUpdateData.applicationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    status: statusUpdateData.newStatus,
                    comment: statusUpdateData.comment
                }),
            });

            if (response.ok) {
                setShowStatusModal(false);
                fetchData();
                setStatusUpdateData({ applicationId: '', newStatus: '', comment: '' });
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

    const quickStatusUpdate = async (applicationId: string, newStatus: string) => {
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
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openStatusModal(application._id, application.status)}
                                                    disabled={updating === application._id}
                                                >
                                                    {updating === application._id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Edit className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                {application.status === 'submitted' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => quickStatusUpdate(application._id, 'accepted')}
                                                            disabled={updating === application._id}
                                                        >
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
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

            {/* Status Update Modal */}
            <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Application Status</DialogTitle>
                        <DialogDescription>
                            Change the status of this application and optionally add a comment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="status">New Status</Label>
                            <Select 
                                value={statusUpdateData.newStatus} 
                                onValueChange={(value) => setStatusUpdateData(prev => ({ ...prev, newStatus: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="reviewed">Reviewed</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="comment">
                                Comment {statusUpdateData.newStatus === 'rejected' && <span className="text-red-500">*</span>}
                            </Label>
                            <textarea
                                id="comment"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder={statusUpdateData.newStatus === 'rejected' ? 'Please provide a reason for rejection...' : 'Optional comment...'}
                                value={statusUpdateData.comment}
                                onChange={(e) => setStatusUpdateData(prev => ({ ...prev, comment: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={updateApplicationStatus}
                            disabled={!statusUpdateData.newStatus || (statusUpdateData.newStatus === 'rejected' && !statusUpdateData.comment.trim())}
                        >
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Application Detail Modal */}
            {selectedApplication && (
                <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
                    <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <DialogTitle>{selectedApplication.name}'s Application</DialogTitle>
                                    <DialogDescription>{selectedApplication.email}</DialogDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(selectedApplication.status)}
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => openStatusModal(selectedApplication._id, selectedApplication.status)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <strong>Phone:</strong> {selectedApplication.phone}
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
                                <div className="mt-2 p-4 bg-muted rounded-lg">
                                    {selectedApplication.whyJoin}
                                </div>
                            </div>

                            {selectedApplication.status === 'rejected' && selectedApplication.rejectionReason && (
                                <div>
                                    <strong>Rejection Reason:</strong>
                                    <div className="mt-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                        {selectedApplication.rejectionReason}
                                    </div>
                                </div>
                            )}

                            {selectedApplication.status === 'submitted' && (
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => openStatusModal(selectedApplication._id, selectedApplication.status)}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => quickStatusUpdate(selectedApplication._id, 'accepted')}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Accept
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
