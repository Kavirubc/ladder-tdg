'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Users,
    Activity,
    ListChecks,
    Target,
    Trash2,
    AlertTriangle,
    Database,
    TrendingUp,
    Calendar,
    Award,
    Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface AdminStats {
    totalUsers: number;
    totalActivities: number;
    totalTodos: number;
    totalCompletions: number;
}

interface User {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
}

interface ActivityWithCompletions {
    _id: string;
    title: string;
    category: string;
    completionCount: number;
    userInfo: Array<{ name: string; email: string }>;
}

interface RecentCompletion {
    _id: string;
    completedAt: string;
    pointsEarned: number;
    activityId: {
        title: string;
        category: string;
    };
    userId: {
        name: string;
        email: string;
    };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [topActivities, setTopActivities] = useState<ActivityWithCompletions[]>([]);
    const [recentCompletions, setRecentCompletions] = useState<RecentCompletion[]>([]);
    const [loading, setLoading] = useState(true);
    const [cleanupPassword, setCleanupPassword] = useState('');
    const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
    const [isCleaningUp, setIsCleaningUp] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<any>(null);

    const collections = [
        { id: 'activities', label: 'Activities', description: 'All user activities and habits' },
        { id: 'todos', label: 'Todos', description: 'All tasks and todo items' },
        { id: 'completions', label: 'Completions', description: 'Activity completion records' },
        { id: 'progress', label: 'Progress', description: 'User progress and ladder data' },
        { id: 'ladder-questions', label: 'Ladder Questions', description: 'All ladder program questions' },
        { id: 'ladder-submissions', label: 'Ladder Submissions', description: 'All ladder program submissions' },
        { id: 'users', label: 'Users', description: 'All users (except admin)' }
    ];

    useEffect(() => {
        fetchAdminData();
        fetchUsers();
    }, []);

    const fetchAdminData = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
                setTopActivities(data.topActivities);
                setRecentCompletions(data.recentCompletions);
            }
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const users = await response.json();
                setUsers(users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (response.ok) {
                setUsers(users.filter(user => user._id !== userId));
            } else {
                const error = await response.json();
                alert(error.message);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user');
        }
    };

    const handleCollectionToggle = (collectionId: string) => {
        setSelectedCollections(prev =>
            prev.includes(collectionId)
                ? prev.filter(id => id !== collectionId)
                : [...prev, collectionId]
        );
    };

    const handleDatabaseCleanup = async () => {
        if (!cleanupPassword) {
            alert('Please enter the admin password');
            return;
        }

        if (selectedCollections.length === 0) {
            alert('Please select at least one collection to clean');
            return;
        }

        const confirmMessage = `Are you sure you want to clean the following collections?\n${selectedCollections.map(id => collections.find(c => c.id === id)?.label).join(', ')}\n\nThis action cannot be undone!`;

        if (!confirm(confirmMessage)) {
            return;
        }

        setIsCleaningUp(true);
        setCleanupResult(null);

        try {
            const response = await fetch('/api/admin/cleanup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: cleanupPassword,
                    collections: selectedCollections
                })
            });

            const result = await response.json();

            if (response.ok) {
                setCleanupResult(result);
                setCleanupPassword('');
                setSelectedCollections([]);
                // Refresh data
                fetchAdminData();
                fetchUsers();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error cleaning database:', error);
            alert('Error cleaning database');
        } finally {
            setIsCleaningUp(false);
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            health: 'bg-green-100 text-green-800',
            productivity: 'bg-blue-100 text-blue-800',
            learning: 'bg-purple-100 text-purple-800',
            mindfulness: 'bg-indigo-100 text-indigo-800',
            fitness: 'bg-red-100 text-red-800',
            creative: 'bg-yellow-100 text-yellow-800',
            social: 'bg-pink-100 text-pink-800',
            other: 'bg-gray-100 text-gray-800'
        };
        return colors[category] || colors.other;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Loading admin dashboard...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalActivities || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Todos</CardTitle>
                        <ListChecks className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalTodos || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalCompletions || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-500" />
                            Ladder Program
                        </CardTitle>
                        <CardDescription>
                            Manage ladder questions and review submissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <a href="/admin/ladder">
                                Manage Ladder Program
                            </a>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-500" />
                            Application Reviews
                        </CardTitle>
                        <CardDescription>
                            Review and manage user applications
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full" variant="outline">
                            <a href="/admin/applications">
                                Review Applications
                            </a>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                            Analytics
                        </CardTitle>
                        <CardDescription>
                            View detailed system analytics and reports
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full" variant="outline">
                            <a href="#analytics">
                                View Analytics
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="users" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="activities">Top Activities</TabsTrigger>
                    <TabsTrigger value="completions">Recent Completions</TabsTrigger>
                    <TabsTrigger value="cleanup">Database Cleanup</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                User Management
                            </CardTitle>
                            <CardDescription>
                                Manage all registered users in the system
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>
                                                {user.email}
                                                {user.email === 'hapuarachchikaviru@gmail.com' && (
                                                    <Badge variant="secondary" className="ml-2">
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        Admin
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                {user.email !== 'hapuarachchikaviru@gmail.com' && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        data-ph-event="admin_dashboard_action"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activities">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Top Activities
                            </CardTitle>
                            <CardDescription>
                                Most completed activities across all users
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Activity</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Completions</TableHead>
                                        <TableHead>Created By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topActivities.map((activity) => (
                                        <TableRow key={activity._id}>
                                            <TableCell className="font-medium">{activity.title}</TableCell>
                                            <TableCell>
                                                <Badge className={getCategoryColor(activity.category)}>
                                                    {activity.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{activity.completionCount}</TableCell>
                                            <TableCell>
                                                {activity.userInfo[0]?.name || 'Unknown'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="completions">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Recent Completions
                            </CardTitle>
                            <CardDescription>
                                Latest activity completions across all users
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Activity</TableHead>
                                        <TableHead>Points</TableHead>
                                        <TableHead>Completed</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentCompletions.map((completion) => (
                                        <TableRow key={completion._id}>
                                            <TableCell>{completion.userId.name}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{completion.activityId.title}</div>
                                                    <Badge className={getCategoryColor(completion.activityId.category)} variant="outline">
                                                        {completion.activityId.category}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>{completion.pointsEarned}</TableCell>
                                            <TableCell>
                                                {format(new Date(completion.completedAt), 'MMM dd, yyyy HH:mm')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cleanup">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Database Cleanup
                            </CardTitle>
                            <CardDescription>
                                Clean database collections - use with extreme caution
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Danger Zone</AlertTitle>
                                <AlertDescription>
                                    Database cleanup operations are irreversible. Make sure you have backups before proceeding.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Select collections to clean:
                                    </label>
                                    <div className="space-y-2">
                                        {collections.map((collection) => (
                                            <div key={collection.id} className="flex items-start space-x-2">
                                                <Checkbox
                                                    id={collection.id}
                                                    checked={selectedCollections.includes(collection.id)}
                                                    onCheckedChange={() => handleCollectionToggle(collection.id)}
                                                />
                                                <div className="grid gap-1.5 leading-none">
                                                    <label
                                                        htmlFor={collection.id}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {collection.label}
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {collection.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="cleanup-password" className="text-sm font-medium mb-2 block">
                                        Admin Password:
                                    </label>
                                    <Input
                                        id="cleanup-password"
                                        type="password"
                                        value={cleanupPassword}
                                        onChange={(e) => setCleanupPassword(e.target.value)}
                                        placeholder="Enter admin password to confirm"
                                        className="max-w-md"
                                    />
                                </div>

                                <Button
                                    onClick={handleDatabaseCleanup}
                                    disabled={isCleaningUp || !cleanupPassword || selectedCollections.length === 0}
                                    variant="destructive"
                                    className="w-full max-w-md"
                                    data-ph-event="admin_dashboard_action"
                                >
                                    {isCleaningUp ? 'Cleaning Database...' : 'Clean Selected Collections'}
                                </Button>

                                {cleanupResult && (
                                    <Alert>
                                        <Database className="h-4 w-4" />
                                        <AlertTitle>Cleanup Completed</AlertTitle>
                                        <AlertDescription>
                                            <div className="mt-2">
                                                {Object.entries(cleanupResult.results).map(([collection, count]) => (
                                                    <div key={collection}>
                                                        <strong>{collection}:</strong> {String(count)} records deleted
                                                    </div>
                                                ))}
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
