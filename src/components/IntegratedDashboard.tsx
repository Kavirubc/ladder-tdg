'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Circle, Calendar, Plus, Repeat, Target, ListChecks, RotateCcw } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import type { Activity, ActivityCompletion, Todo, ActivityProgressStats } from '@/types/activity';
import ActivityForm from '@/components/ActivityForm'; // Import the ActivityForm component
import TodoComponent from '@/components/TodoComponent'; // Import TodoComponent
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface IntegratedDashboardProps {
    userId: string;
}

export default function IntegratedDashboard({
    userId,
}: IntegratedDashboardProps) {
    const router = useRouter(); // Initialize useRouter
    const [activities, setActivities] = useState<Activity[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [archivedTodos, setArchivedTodos] = useState<Todo[]>([]);
    const [activityCompletions, setActivityCompletions] = useState<ActivityCompletion[]>([]);
    const [progressStats, setProgressStats] = useState<ActivityProgressStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
    const [selectedActivityForTodo, setSelectedActivityForTodo] = useState<string | undefined>(undefined);
    const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | undefined>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [activitiesRes, todosRes, archivedTodosRes, completionsRes, progressRes] = await Promise.all([
                fetch('/api/activities'),
                fetch('/api/todos'),
                fetch('/api/todos/archived'),
                fetch('/api/activities/completions'),
                fetch('/api/activities/progress')
            ]);

            if (activitiesRes.ok) {
                const activitiesData = await activitiesRes.json();
                setActivities(activitiesData);
            }

            if (todosRes.ok) {
                const todosData = await todosRes.json();
                setTodos(todosData.todos || []);
            }

            if (archivedTodosRes.ok) {
                const archivedTodosData = await archivedTodosRes.json();
                setArchivedTodos(archivedTodosData.todos || []);
            }

            if (completionsRes.ok) {
                const completionsData = await completionsRes.json();
                setActivityCompletions(completionsData);
            }
            if (progressRes.ok) {
                const progressData = await progressRes.json();
                setProgressStats(progressData);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const completeActivity = async (activityId: string) => {
        try {
            const activity = activities.find(a => a._id === activityId);
            if (!activity) return;

            const response = await fetch('/api/activities/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activityId, pointsEarned: activity.pointValue }),
            });

            if (response.ok) {
                // Refresh data after completion
                fetchData();
            }
        } catch (error) {
            console.error('Error completing activity:', error);
        }
    };

    const undoActivityCompletion = async (activityId: string) => {
        try {
            const response = await fetch(`/api/activities/completions?activityId=${activityId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Refresh data after undo
                fetchData();
            } else {
                const errorData = await response.json();
                console.error('Error undoing completion:', errorData.message);
            }
        } catch (error) {
            console.error('Error undoing activity completion:', error);
        }
    };

    const restoreArchivedTodo = async (todoId: string) => {
        try {
            const response = await fetch('/api/todos/archived', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ todoId }),
            });

            if (response.ok) {
                // Refresh data after restore
                fetchData();
            } else {
                const errorData = await response.json();
                console.error('Error restoring todo:', errorData.message);
            }
        } catch (error) {
            console.error('Error restoring archived todo:', error);
        }
    };

    const toggleTodo = async (todoId: string, isCompleted: boolean) => {
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: !isCompleted }),
            });

            if (response.ok) {
                setTodos(todos.map(todo =>
                    todo._id === todoId
                        ? { ...todo, isCompleted: !isCompleted }
                        : todo
                ));
                // Optionally, refresh all data if todo completion affects progress stats
                // fetchData(); 
            }
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const getTodaysCompletions = useCallback(() => {
        return activityCompletions.filter(completion =>
            isSameDay(parseISO(completion.completedAt), new Date())
        );
    }, [activityCompletions]);

    const getActivityIntensityColor = (intensity: string) => {
        switch (intensity) {
            case 'easy': return 'bg-green-500';
            case 'medium': return 'bg-yellow-500';
            case 'hard': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const handleActivitySaved = () => {
        fetchData(); // Refresh all data when an activity is created/updated
        setEditingActivity(undefined); // Clear editing state
    };

    const openActivityForm = (activity?: Activity) => {
        setEditingActivity(activity);
        setIsActivityFormOpen(true);
    };

    const openTodoModal = (activityId?: string) => {
        setSelectedActivityForTodo(activityId);
        setIsTodoModalOpen(true);
    };

    const navigateToActivityTasks = (activityId: string) => {
        router.push(`/tasks?activityId=${activityId}`);
    };

    const renderActivityCard = (activity: Activity) => {
        const isCompletedToday = todaysCompletions.some(c => c.activityId === activity._id || (typeof c.activityId === 'object' && c.activityId._id === activity._id));

        // Determine intensity class
        const intensityClass = activity.intensity === 'easy' ? 'intensity-easy' :
            activity.intensity === 'medium' ? 'intensity-medium' : 'intensity-hard';

        return (
            <div key={activity._id} className={`activity-card ${isCompletedToday ? 'completed' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`intensity-dot ${intensityClass}`} />
                        <div>
                            <div className="font-medium text-gray-800">{activity.title}</div>
                            {activity.description && (
                                <div className="text-sm text-gray-500 mt-0.5">{activity.description}</div>
                            )}
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Repeat className="h-3 w-3" /> {activity.targetFrequency}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="status-badge status-badge-outline status-badge-primary">
                            {activity.pointValue} pts
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateToActivityTasks(activity._id!)}
                            title="Manage Tasks"
                            data-ph-event="integrated_dashboard_action"
                            className="rounded-full p-1 h-8 w-8"
                        >
                            <ListChecks className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => completeActivity(activity._id!)}
                            disabled={isCompletedToday}
                            variant={isCompletedToday ? "secondary" : "default"}
                            size="sm"
                            data-ph-event="integrated_dashboard_action"
                            className={`rounded-full p-1 h-8 w-8 ${isCompletedToday ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'}`}
                        >
                            {isCompletedToday ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <Circle className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading-spinner" role="status" aria-label="Loading dashboard">
                <div className="spinner"></div>
                <span className="sr-only">Loading your dashboard content...</span>

                {/* Skeleton loading UI */}
                <div className="w-full space-y-6 mt-6 animate-pulse">
                    {/* Skeleton for stats card */}
                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex flex-col items-center">
                                    <div className="h-8 bg-gray-200 rounded-full w-16 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Skeleton for tab navigation */}
                    <div className="h-10 bg-gray-200 rounded-md w-full"></div>

                    {/* Skeleton for content cards */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {[1, 2].map(card => (
                            <div key={card} className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                                <div className="space-y-3">
                                    {[1, 2, 3].map(item => (
                                        <div key={item} className="h-16 bg-gray-200 rounded-md"></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const todaysCompletions = getTodaysCompletions();
    const todaysPoints = todaysCompletions.reduce((sum, completion) => sum + completion.pointsEarned, 0);

    // Filter activities: recurring (habits) and non-recurring (goals)
    const recurringActivities = activities.filter(a => a.isRecurring && a.isActive);
    const oneTimeActivities = activities.filter(a => !a.isRecurring && a.isActive);

    return (
        <div className="space-y-6">
            {/* Today's Overview */}
            <div className="dashboard-card">
                <div className="dashboard-card-header">
                    <h2 className="flex items-center gap-2 text-xl font-medium text-gray-800">
                        <Calendar className="h-5 w-5 text-indigo-500" />
                        Today&apos;s Overview - {format(new Date(), 'EEEE, MMMM d')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Your daily progress across activities and tasks
                    </p>
                </div>
                <div className="dashboard-card-content">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="dashboard-stat">
                            <div className="dashboard-stat-value text-indigo-600">{todaysCompletions.length}</div>
                            <div className="dashboard-stat-label">Activities Completed</div>
                        </div>
                        <div className="dashboard-stat">
                            <div className="dashboard-stat-value text-green-600">{todos.filter(t => t.isCompleted).length}</div>
                            <div className="dashboard-stat-label">Tasks Completed</div>
                        </div>
                        <div className="dashboard-stat">
                            <div className="dashboard-stat-value text-amber-600">{progressStats?.totalPoints ?? '0'}</div>
                            <div className="dashboard-stat-label">Total Points</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="today" className="w-full dashboard-tabs">
                <TabsList
                    className="flex w-full overflow-x-auto mb-4 bg-gray-50 border rounded-md p-1"
                    aria-label="Dashboard sections"
                >
                    <TabsTrigger
                        value="today"
                        className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        aria-label="Today's Focus tab"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M10 16h4" /></svg>
                        Today's Focus
                    </TabsTrigger>
                    <TabsTrigger
                        value="recurring"
                        className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        aria-label="Recurring activities tab"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3v2" /><path d="M10 18H7" /><path d="M7 14v4" /><path d="m14 10-3.5 3.5" /><path d="M10 13.5 7 17" /><path d="M17 21v-2" /><path d="M21 7V4a1 1 0 0 0-1-1h-3" /><path d="M3 7v3a1 1 0 0 0 1 1h3" /><path d="M21 17v3a1 1 0 0 1-1 1h-3" /><path d="M3 17v-3a1 1 0 0 1 1-1h3" /></svg>
                        Recurring
                    </TabsTrigger>
                    <TabsTrigger
                        value="goals"
                        className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        aria-label="One-Time Goals tab"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
                        One-Time Goals
                    </TabsTrigger>
                    <TabsTrigger
                        value="all-tasks"
                        className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        aria-label="All Tasks tab"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 12H3" /><path d="m16 6-4 6 4 6" /><path d="M21 12h-5" /></svg>
                        All Tasks
                    </TabsTrigger>
                    <TabsTrigger
                        value="archived"
                        className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        aria-label="Archived Tasks tab"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></svg>
                        Archived Tasks
                    </TabsTrigger>
                </TabsList>

                {/* Tab Content for Today's Focus */}
                <TabsContent value="today" className="space-y-4">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Today's Activities (Both Recurring and One-Time) */}
                        <div className="dashboard-card">
                            <div className="dashboard-card-header flex flex-row items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800">Today&apos;s Activities</h3>
                                    <p className="text-sm text-gray-500 mt-1">Focus on your habits and goals for today</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openActivityForm()}
                                    data-ph-event="integrated_dashboard_action"
                                    className="bg-white hover:bg-gray-50"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Activity
                                </Button>
                            </div>
                            <div className="dashboard-card-content space-y-3">
                                {/* Show both recurring activities for today and incomplete one-time goals */}
                                {(() => {
                                    const todaysRecurringActivities = recurringActivities.filter(act =>
                                        act.targetFrequency === 'daily' || act.targetFrequency === 'weekly'
                                    );
                                    const incompleteOneTimeActivities = oneTimeActivities.filter(act =>
                                        !activityCompletions.some(c =>
                                            c.activityId === act._id ||
                                            (typeof c.activityId === 'object' && c.activityId._id === act._id)
                                        )
                                    );
                                    const allTodaysActivities = [...todaysRecurringActivities, ...incompleteOneTimeActivities];

                                    if (allTodaysActivities.length === 0) {
                                        return (
                                            <div className="text-gray-500 text-center py-6 bg-gray-50/50 rounded-md border border-dashed border-gray-200">
                                                <p>No activities set up for today.</p>
                                                <p className="text-sm mt-1">Add some activities to get started!</p>
                                            </div>
                                        );
                                    }

                                    return allTodaysActivities.map((activity) => {
                                        const isCompletedToday = todaysCompletions.some(c =>
                                            c.activityId === activity._id ||
                                            (typeof c.activityId === 'object' && c.activityId._id === activity._id)
                                        );
                                        const isOneTime = !activity.isRecurring;
                                        const intensityClass = activity.intensity === 'easy' ? 'intensity-easy' :
                                            activity.intensity === 'medium' ? 'intensity-medium' : 'intensity-hard';

                                        return (
                                            <div key={activity._id} className={`activity-card ${isCompletedToday ? 'completed' : ''}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`intensity-dot ${intensityClass}`} />
                                                        <div>
                                                            <div className="font-medium text-gray-800 flex items-center gap-2">
                                                                {activity.title}
                                                                {isOneTime && <span className="status-badge status-badge-outline status-badge-primary text-xs">Goal</span>}
                                                            </div>
                                                            {activity.description && (
                                                                <div className="text-sm text-gray-500 mt-0.5">{activity.description}</div>
                                                            )}
                                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                {isOneTime ? (
                                                                    <><Target className="h-3 w-3" /> One-time goal</>
                                                                ) : (
                                                                    <><Repeat className="h-3 w-3" /> {activity.targetFrequency}</>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="status-badge status-badge-outline status-badge-primary">
                                                            {activity.pointValue} pts
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigateToActivityTasks(activity._id!)}
                                                            title="Manage Tasks"
                                                            data-ph-event="integrated_dashboard_action"
                                                            className="rounded-full p-1 h-8 w-8"
                                                        >
                                                            <ListChecks className="h-4 w-4" />
                                                        </Button>
                                                        {isCompletedToday ? (
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    disabled
                                                                    className="bg-green-100 text-green-700 rounded-full p-1 h-8 w-8"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => undoActivityCompletion(activity._id!)}
                                                                    title="Undo completion"
                                                                    data-ph-event="integrated_dashboard_action"
                                                                    className="rounded-full p-1 h-8 w-8"
                                                                >
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                onClick={() => completeActivity(activity._id!)}
                                                                variant="default"
                                                                size="sm"
                                                                data-ph-event="integrated_dashboard_action"
                                                                className="rounded-full p-1 h-8 w-8 hover:bg-gray-100"
                                                            >
                                                                <Circle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Today's Tasks (Sub-tasks) */}
                        <div className="dashboard-card">
                            <div className="dashboard-card-header flex flex-row items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-800">Active Tasks</h3>
                                    <p className="text-sm text-gray-500 mt-1">Manage your to-do items for today</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openTodoModal()}
                                    data-ph-event="integrated_dashboard_action"
                                    className="bg-white hover:bg-gray-50"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Quick Add Task
                                </Button>
                            </div>
                            <div className="dashboard-card-content space-y-3">
                                {todos.length === 0 ? (
                                    <div className="text-gray-500 text-center py-6 bg-gray-50/50 rounded-md border border-dashed border-gray-200">
                                        <p>No tasks yet.</p>
                                        <p className="text-sm mt-1">Add your first task to get started!</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Show pending tasks first */}
                                        {todos.filter(t => !t.isCompleted).slice(0, 5).map((todo) => (
                                            <div key={todo._id} className="activity-card">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleTodo(todo._id, todo.isCompleted)}
                                                            className="p-0 h-auto"
                                                            data-ph-event="integrated_dashboard_action"
                                                        >
                                                            <Circle className="h-4 w-4 text-gray-400" />
                                                        </Button>
                                                        <div>
                                                            <div className="font-medium text-gray-800">{todo.title}</div>
                                                            {todo.description && (
                                                                <div className="text-sm text-gray-500 mt-0.5">{todo.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="status-badge status-badge-outline bg-amber-50 text-amber-600 border-amber-100">
                                                        Pending
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Show completed tasks for today */}
                                        {todos.filter(t => t.isCompleted).slice(0, 3).map((todo) => (
                                            <div key={todo._id} className="activity-card completed">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleTodo(todo._id, todo.isCompleted)}
                                                            className="p-0 h-auto"
                                                            data-ph-event="integrated_dashboard_action"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <div>
                                                            <div className="font-medium line-through text-gray-600">{todo.title}</div>
                                                            {todo.description && (
                                                                <div className="text-sm text-gray-500 line-through mt-0.5">{todo.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="status-badge status-badge-outline bg-green-50 text-green-600 border-green-100">
                                                        Done
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Show count of remaining tasks if there are more */}
                                        {(todos.filter(t => !t.isCompleted).length > 5 || todos.filter(t => t.isCompleted).length > 3) && (
                                            <p className="text-sm text-gray-500 text-center border-t border-gray-100 mt-3 pt-3">
                                                {todos.filter(t => !t.isCompleted).length > 5 && `${todos.filter(t => !t.isCompleted).length - 5} more pending tasks`}
                                                {todos.filter(t => !t.isCompleted).length > 5 && todos.filter(t => t.isCompleted).length > 3 && ' • '}
                                                {todos.filter(t => t.isCompleted).length > 3 && `${todos.filter(t => t.isCompleted).length - 3} more completed tasks`}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Recurring Activities (Habits) Tab */}
                <TabsContent value="recurring" className="space-y-4">
                    <div className="dashboard-card">
                        <div className="dashboard-card-header flex flex-row items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">All Recurring Activities</h3>
                                <p className="text-sm text-gray-500 mt-1">Habits and recurring tasks you want to maintain</p>
                            </div>
                            <Button
                                onClick={() => openActivityForm()}
                                data-ph-event="integrated_dashboard_action"
                                className="bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100"
                            >
                                <Plus className="h-4 w-4 mr-2" /> New Habit
                            </Button>
                        </div>
                        <div className="dashboard-card-content">
                            {recurringActivities.length === 0 ? (
                                <div className="text-gray-500 text-center py-10 bg-gray-50/50 rounded-md border border-dashed border-gray-200">
                                    <div className="mb-2">
                                        <Repeat className="h-10 w-10 text-gray-300 mx-auto" />
                                    </div>
                                    <p className="font-medium">No recurring activities defined yet</p>
                                    <p className="text-sm mt-1 max-w-md mx-auto">Habits are activities you perform regularly. Add your first recurring activity to start building consistent habits.</p>
                                    <Button
                                        onClick={() => openActivityForm()}
                                        className="mt-4"
                                        data-ph-event="integrated_dashboard_action"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Your First Habit
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {recurringActivities.map((activity) => {
                                        const isCompletedToday = todaysCompletions.some(c => c.activityId === activity._id || (typeof c.activityId === 'object' && c.activityId._id === activity._id));
                                        const intensityClass = activity.intensity === 'easy' ? 'intensity-easy' :
                                            activity.intensity === 'medium' ? 'intensity-medium' : 'intensity-hard';

                                        return (
                                            <div key={activity._id} className={`activity-card h-full flex flex-col ${isCompletedToday ? 'completed' : ''}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`intensity-dot ${intensityClass}`} />
                                                        <h4 className="font-medium text-gray-800">{activity.title}</h4>
                                                    </div>
                                                    <Badge variant="outline" className="capitalize status-badge status-badge-info">
                                                        <Repeat className="h-3 w-3 mr-1" /> {activity.targetFrequency}
                                                    </Badge>
                                                </div>

                                                {activity.description && (
                                                    <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                                                )}

                                                <div className="mt-auto pt-3 border-t border-gray-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="status-badge status-badge-primary">{activity.pointValue} pts</span>
                                                        <span className="status-badge status-badge-neutral capitalize">{activity.intensity}</span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openActivityForm(activity)}
                                                                className="text-xs h-7 px-2"
                                                                data-ph-event="integrated_dashboard_action"
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigateToActivityTasks(activity._id!)}
                                                                className="text-xs h-7 px-2"
                                                                data-ph-event="integrated_dashboard_action"
                                                            >
                                                                <ListChecks className="h-3 w-3 mr-1" /> Tasks
                                                            </Button>
                                                        </div>

                                                        {isCompletedToday ? (
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    disabled
                                                                    className="bg-green-50 text-green-600 border-green-100 text-xs h-7"
                                                                >
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Done Today
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => undoActivityCompletion(activity._id!)}
                                                                    title="Undo completion"
                                                                    className="text-xs h-7 px-1"
                                                                    data-ph-event="integrated_dashboard_action"
                                                                >
                                                                    <RotateCcw className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                onClick={() => completeActivity(activity._id!)}
                                                                variant="default"
                                                                size="sm"
                                                                className="text-xs h-7"
                                                                data-ph-event="integrated_dashboard_action"
                                                            >
                                                                <Circle className="h-3 w-3 mr-1" /> Mark Complete
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* One-Time Goals Tab */}
                <TabsContent value="goals" className="space-y-4">
                    <div className="dashboard-card">
                        <div className="dashboard-card-header flex flex-row items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">One-Time Goals</h3>
                                <p className="text-sm text-gray-500 mt-1">Specific achievements you want to accomplish</p>
                            </div>
                            <Button
                                onClick={() => openActivityForm()}
                                data-ph-event="integrated_dashboard_action"
                                className="bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100"
                            >
                                <Plus className="h-4 w-4 mr-2" /> New Goal
                            </Button>
                        </div>
                        <div className="dashboard-card-content">
                            {oneTimeActivities.length === 0 ? (
                                <div className="text-gray-500 text-center py-10 bg-gray-50/50 rounded-md border border-dashed border-gray-200">
                                    <div className="mb-2">
                                        <Target className="h-10 w-10 text-gray-300 mx-auto" />
                                    </div>
                                    <p className="font-medium">No one-time goals defined yet</p>
                                    <p className="text-sm mt-1 max-w-md mx-auto">Goals are one-time accomplishments you're working toward. Set your first goal to start tracking your progress.</p>
                                    <Button
                                        onClick={() => openActivityForm()}
                                        className="mt-4"
                                        data-ph-event="integrated_dashboard_action"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Your First Goal
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {oneTimeActivities.map((activity) => {
                                        const isCompleted = activityCompletions.some(c => c.activityId === activity._id || (typeof c.activityId === 'object' && c.activityId._id === activity._id));
                                        const intensityClass = activity.intensity === 'easy' ? 'intensity-easy' :
                                            activity.intensity === 'medium' ? 'intensity-medium' : 'intensity-hard';
                                        const hasDeadline = activity.deadline && activity.deadline !== '';
                                        const deadlineDate = activity.deadline ? parseISO(activity.deadline) : null;

                                        return (
                                            <div key={activity._id} className={`activity-card h-full flex flex-col ${isCompleted ? 'completed' : ''}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`intensity-dot ${intensityClass}`} />
                                                        <h4 className="font-medium text-gray-800">{activity.title}</h4>
                                                    </div>
                                                    <Badge variant="outline" className="capitalize status-badge status-badge-warning">
                                                        <Target className="h-3 w-3 mr-1" /> Goal
                                                    </Badge>
                                                </div>

                                                {activity.description && (
                                                    <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                                                )}

                                                <div className="mt-auto pt-3 border-t border-gray-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="status-badge status-badge-primary">{activity.pointValue} pts</span>
                                                        {hasDeadline && deadlineDate && (
                                                            <span className="text-xs text-gray-600 flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" /> Due: {format(deadlineDate, 'MMM d, yyyy')}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openActivityForm(activity)}
                                                                className="text-xs h-7 px-2"
                                                                data-ph-event="integrated_dashboard_action"
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigateToActivityTasks(activity._id!)}
                                                                className="text-xs h-7 px-2"
                                                                data-ph-event="integrated_dashboard_action"
                                                            >
                                                                <ListChecks className="h-3 w-3 mr-1" /> Tasks
                                                            </Button>
                                                        </div>

                                                        {isCompleted ? (
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    disabled
                                                                    className="bg-green-50 text-green-600 border-green-100 text-xs h-7"
                                                                >
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => undoActivityCompletion(activity._id!)}
                                                                    title="Undo completion"
                                                                    className="text-xs h-7 px-1"
                                                                    data-ph-event="integrated_dashboard_action"
                                                                >
                                                                    <RotateCcw className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                onClick={() => completeActivity(activity._id!)}
                                                                variant="default"
                                                                size="sm"
                                                                className="text-xs h-7"
                                                                data-ph-event="integrated_dashboard_action"
                                                            >
                                                                <Circle className="h-3 w-3 mr-1" /> Mark Complete
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Tab Content for All Tasks */}
                <TabsContent value="all-tasks">
                    <div className="dashboard-card">
                        <div className="dashboard-card-header flex flex-row items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">All Tasks</h3>
                                <p className="text-sm text-gray-500 mt-1">View and manage all your tasks across all activities</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openTodoModal()}
                                data-ph-event="integrated_dashboard_action"
                                className="bg-white hover:bg-gray-50"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Task
                            </Button>
                        </div>
                        <div className="dashboard-card-content">
                            <TodoComponent userId={userId} /> {/* General TodoComponent for all tasks */}
                        </div>
                    </div>
                </TabsContent>

                {/* Tab Content for Archived Tasks */}
                <TabsContent value="archived">
                    <div className="dashboard-card">
                        <div className="dashboard-card-header flex flex-row items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Archived Tasks</h3>
                                <p className="text-sm text-gray-500 mt-1">View and restore your archived tasks</p>
                            </div>
                        </div>
                        <div className="dashboard-card-content">
                            {archivedTodos.length === 0 ? (
                                <div className="text-gray-500 text-center py-10 bg-gray-50/50 rounded-md border border-dashed border-gray-200">
                                    <div className="mb-2">
                                        <svg className="h-10 w-10 text-gray-300 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                        </svg>
                                    </div>
                                    <p className="font-medium">No archived tasks found</p>
                                    <p className="text-sm mt-1">When you archive tasks, they will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {archivedTodos.map((todo: any) => {
                                        const archivedDate = todo.archivedAt ? new Date(todo.archivedAt) : null;

                                        return (
                                            <div key={todo._id} className="activity-card bg-gray-50 border-gray-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <CheckCircle2 className="h-5 w-5 text-gray-300" />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-400 line-through">
                                                                {todo.title}
                                                            </div>
                                                            {todo.description && (
                                                                <div className="text-sm text-gray-400 line-through">
                                                                    {todo.description}
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                                                {todo.activityId?.title && (
                                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
                                                                        {todo.activityId.title}
                                                                    </div>
                                                                )}
                                                                {archivedDate && (
                                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
                                                                        Archived: {format(archivedDate, 'MMM d, yyyy')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="status-badge status-badge-neutral">Archived</span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => restoreArchivedTodo(todo._id)}
                                                            title="Restore task"
                                                            data-ph-event="integrated_dashboard_action"
                                                            className="h-7 w-7 p-0 rounded-full"
                                                        >
                                                            <RotateCcw className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <ActivityForm
                isOpen={isActivityFormOpen}
                onOpenChange={setIsActivityFormOpen}
                onActivitySaved={handleActivitySaved} // Changed from onActivityCreated
                userId={userId}
                initialActivity={editingActivity} // Pass the activity to be edited
            />

            {/* Todo Modal - Render TodoComponent in a dialog if an activity is selected for adding a todo */}
            {isTodoModalOpen && selectedActivityForTodo && (
                <Dialog open={isTodoModalOpen} onOpenChange={setIsTodoModalOpen}>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle>Add Task</DialogTitle>
                            <DialogDescription>
                                Add a new task to the selected activity.
                            </DialogDescription>
                        </DialogHeader>
                        <TodoComponent
                            userId={userId}
                            activityId={selectedActivityForTodo} // This remains for the modal
                            isModal={true}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
