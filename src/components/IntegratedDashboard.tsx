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
        return (
            <div key={activity._id} className={`p-3 rounded-lg border transition-all ${isCompletedToday ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'hover:bg-muted'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getActivityIntensityColor(activity.intensity)}`} />
                        <div>
                            <div className="font-medium">{activity.title}</div>
                            {activity.description && (
                                <div className="text-sm text-muted-foreground">{activity.description}</div>
                            )}
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Repeat className="h-3 w-3" /> {activity.targetFrequency}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{activity.pointValue} pts</Badge>
                        <Button variant="ghost" size="sm" onClick={() => navigateToActivityTasks(activity._id!)} title="Manage Tasks">
                            <ListChecks className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => completeActivity(activity._id!)}
                            disabled={isCompletedToday}
                            variant={isCompletedToday ? "secondary" : "default"}
                            size="sm"
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
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Today&apos;s Overview - {format(new Date(), 'EEEE, MMMM d')}
                    </CardTitle>
                    <CardDescription>
                        Your daily progress across activities and tasks
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{todaysCompletions.length}</div>
                            <div className="text-sm text-muted-foreground">Activities Completed Today</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{todos.filter(t => t.isCompleted).length}</div>
                            <div className="text-sm text-muted-foreground">Tasks Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{progressStats?.totalPoints ?? 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">Total Points</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Tabs defaultValue="today" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4">
                    <TabsTrigger value="today">Today's Focus</TabsTrigger>
                    <TabsTrigger value="recurring">Recurring</TabsTrigger>
                    <TabsTrigger value="goals">One-Time Goals</TabsTrigger>
                    <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
                    <TabsTrigger value="archived">Archived Tasks</TabsTrigger>
                </TabsList>

                {/* Tab Content for Today's Focus */}
                <TabsContent value="today" className="space-y-4">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Today's Activities (Both Recurring and One-Time) */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Today&apos;s Activities</CardTitle>
                                    <CardDescription>Focus on your habits and goals for today</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => openActivityForm()}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Activity
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
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
                                            <p className="text-muted-foreground text-center py-4">
                                                No activities set up for today. Add some activities to get started!
                                            </p>
                                        );
                                    }

                                    return allTodaysActivities.map((activity) => {
                                        const isCompletedToday = todaysCompletions.some(c =>
                                            c.activityId === activity._id ||
                                            (typeof c.activityId === 'object' && c.activityId._id === activity._id)
                                        );
                                        const isOneTime = !activity.isRecurring;

                                        return (
                                            <div key={activity._id} className={`p-3 rounded-lg border transition-all ${isCompletedToday ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'hover:bg-muted'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full ${getActivityIntensityColor(activity.intensity)}`} />
                                                        <div>
                                                            <div className="font-medium flex items-center gap-2">
                                                                {activity.title}
                                                                {isOneTime && <Badge variant="secondary" className="text-xs">Goal</Badge>}
                                                            </div>
                                                            {activity.description && (
                                                                <div className="text-sm text-muted-foreground">{activity.description}</div>
                                                            )}
                                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                                {isOneTime ? (
                                                                    <><Target className="h-3 w-3" /> One-time goal</>
                                                                ) : (
                                                                    <><Repeat className="h-3 w-3" /> {activity.targetFrequency}</>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">{activity.pointValue} pts</Badge>
                                                        <Button variant="ghost" size="sm" onClick={() => navigateToActivityTasks(activity._id!)} title="Manage Tasks">
                                                            <ListChecks className="h-4 w-4" />
                                                        </Button>
                                                        {isCompletedToday ? (
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    disabled
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => undoActivityCompletion(activity._id!)}
                                                                    title="Undo completion"
                                                                >
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                onClick={() => completeActivity(activity._id!)}
                                                                variant="default"
                                                                size="sm"
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
                            </CardContent>
                        </Card>

                        {/* Today's Tasks (Sub-tasks) */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Active Tasks</CardTitle>
                                    <CardDescription>Manage your to-do items for today</CardDescription>
                                </div>
                                {/* This button can still open the modal for a quick add if desired, or be removed if all task additions go via /tasks page */}
                                <Button variant="outline" size="sm" onClick={() => openTodoModal()}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Quick Add Task
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {todos.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">
                                        No tasks yet. Add your first task!
                                    </p>
                                ) : (
                                    <>
                                        {/* Show pending tasks first */}
                                        {todos.filter(t => !t.isCompleted).slice(0, 5).map((todo) => (
                                            <div key={todo._id} className={`p-3 rounded-lg border transition-all hover:bg-muted`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleTodo(todo._id, todo.isCompleted)}
                                                            className="p-0 h-auto"
                                                        >
                                                            <Circle className="h-5 w-5" />
                                                        </Button>
                                                        <div>
                                                            <div className={`font-medium`}>{todo.title}</div>
                                                            {todo.description && (
                                                                <div className="text-sm text-muted-foreground">{todo.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant={"default"}>Pending</Badge>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Show completed tasks for today */}
                                        {todos.filter(t => t.isCompleted).slice(0, 3).map((todo) => (
                                            <div key={todo._id} className={`p-3 rounded-lg border transition-all bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleTodo(todo._id, todo.isCompleted)}
                                                            className="p-0 h-auto"
                                                        >
                                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                        </Button>
                                                        <div>
                                                            <div className={`font-medium line-through text-green-700 dark:text-green-300`}>{todo.title}</div>
                                                            {todo.description && (
                                                                <div className="text-sm text-green-600 dark:text-green-400">{todo.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge variant={"secondary"} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Show count of remaining tasks if there are more */}
                                        {(todos.filter(t => !t.isCompleted).length > 5 || todos.filter(t => t.isCompleted).length > 3) && (
                                            <p className="text-sm text-muted-foreground text-center pt-2">
                                                {todos.filter(t => !t.isCompleted).length > 5 && `${todos.filter(t => !t.isCompleted).length - 5} more pending tasks`}
                                                {todos.filter(t => !t.isCompleted).length > 5 && todos.filter(t => t.isCompleted).length > 3 && ' • '}
                                                {todos.filter(t => t.isCompleted).length > 3 && `${todos.filter(t => t.isCompleted).length - 3} more completed tasks`}
                                            </p>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Recurring Activities (Habits) Tab */}
                <TabsContent value="recurring" className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">All Recurring Activities</h3>
                        <Button onClick={() => openActivityForm()}><Plus className="h-4 w-4 mr-2" /> Add Recurring Activity</Button>
                    </div>
                    {recurringActivities.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No recurring activities defined yet.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {recurringActivities.map((activity) => {
                                const isCompletedToday = todaysCompletions.some(c => c.activityId === activity._id || (typeof c.activityId === 'object' && c.activityId._id === activity._id));
                                return (
                                    <Card key={activity._id} className={`transition-all hover:shadow-md ${isCompletedToday ? 'ring-2 ring-green-500' : ''}`}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg">{activity.title}</CardTitle>
                                                <div className={`w-3 h-3 rounded-full ${getActivityIntensityColor(activity.intensity)}`} />
                                            </div>
                                            {activity.description && (
                                                <CardDescription>{activity.description}</CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <Badge variant="secondary" className="capitalize"><Repeat className="h-3 w-3 mr-1" /> {activity.targetFrequency}</Badge>
                                                <Badge variant="outline" className="capitalize">{activity.intensity}</Badge>
                                            </div>
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <Badge variant="outline">{activity.pointValue} pts</Badge>
                                                <Button variant="ghost" size="sm" onClick={() => openActivityForm(activity)}>
                                                    Edit
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => navigateToActivityTasks(activity._id!)} title="Manage Tasks">
                                                    <ListChecks className="h-4 w-4 mr-1" /> Tasks
                                                </Button>
                                                {isCompletedToday ? (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            disabled
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 mr-2" /> Completed Today
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => undoActivityCompletion(activity._id!)}
                                                            title="Undo completion"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => completeActivity(activity._id!)}
                                                        variant="default"
                                                        size="sm"
                                                    >
                                                        <Circle className="h-4 w-4 mr-2" /> Mark Done
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* One-Time Goals Tab */}
                <TabsContent value="goals" className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">One-Time Goals</h3>
                        <Button onClick={() => openActivityForm()}><Plus className="h-4 w-4 mr-2" /> Add Goal</Button>
                    </div>
                    {oneTimeActivities.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No one-time goals defined yet.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {oneTimeActivities.map((activity) => {
                                const isCompleted = activityCompletions.some(c => c.activityId === activity._id || (typeof c.activityId === 'object' && c.activityId._id === activity._id));
                                return (
                                    <Card key={activity._id} className={`transition-all hover:shadow-md ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg">{activity.title}</CardTitle>
                                                <div className={`w-3 h-3 rounded-full ${getActivityIntensityColor(activity.intensity)}`} />
                                            </div>
                                            {activity.description && (
                                                <CardDescription>{activity.description}</CardDescription>
                                            )}
                                            {activity.deadline && (
                                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Target className="h-3 w-3" /> Deadline: {format(parseISO(activity.deadline), 'MMM d, yyyy')}
                                                </div>
                                            )}
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <Badge variant="outline" className="capitalize">{activity.intensity}</Badge>
                                                {activity.deadline && <Badge variant="secondary"><Target className="h-3 w-3 mr-1" /> {format(parseISO(activity.deadline), 'MMM d, yyyy')}</Badge>}
                                            </div>
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <Badge variant="outline">{activity.pointValue} pts</Badge>
                                                <Button variant="ghost" size="sm" onClick={() => openActivityForm(activity)}>
                                                    Edit
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => navigateToActivityTasks(activity._id!)} title="Manage Tasks">
                                                    <ListChecks className="h-4 w-4 mr-1" /> Tasks
                                                </Button>
                                                {isCompleted ? (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            disabled
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 mr-2" /> Completed
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => undoActivityCompletion(activity._id!)}
                                                            title="Undo completion"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => completeActivity(activity._id!)}
                                                        variant="default"
                                                        size="sm"
                                                    >
                                                        <Circle className="h-4 w-4 mr-2" /> Mark as Done
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Tab Content for All Tasks */}
                <TabsContent value="all-tasks">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>All Tasks</CardTitle>
                            </div>
                            <CardDescription>View and manage all your tasks across all activities.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TodoComponent userId={userId} /> {/* General TodoComponent for all tasks */}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab Content for Archived Tasks */}
                <TabsContent value="archived">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Archived Tasks</CardTitle>
                            </div>
                            <CardDescription>View and restore your archived tasks.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {archivedTodos.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No archived tasks found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {archivedTodos.map((todo: any) => (
                                        <div key={todo._id} className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-900/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-5 w-5 text-gray-400" />
                                                        <div>
                                                            <div className="font-medium text-gray-600 dark:text-gray-400 line-through">
                                                                {todo.title}
                                                            </div>
                                                            {todo.description && (
                                                                <div className="text-sm text-gray-500 dark:text-gray-500">
                                                                    {todo.description}
                                                                </div>
                                                            )}
                                                            {todo.activityId?.title && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                                    Activity: {todo.activityId.title}
                                                                </div>
                                                            )}
                                                            {todo.archivedAt && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                                                    Archived: {format(new Date(todo.archivedAt), 'MMM d, yyyy')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-gray-500">Archived</Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => restoreArchivedTodo(todo._id)}
                                                        title="Restore task"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
