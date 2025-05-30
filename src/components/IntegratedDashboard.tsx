'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Circle, Calendar, Plus } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import type { Habit, HabitCompletion } from '@/types/habit';

interface Todo {
    _id: string;
    title: string;
    description?: string;
    isCompleted: boolean;
    createdAt: string;
    user: string;
}

interface IntegratedDashboardProps {
    userId: string;
    onAddHabit: () => void;
    onAddTodo: () => void;
}

export default function IntegratedDashboard({
    userId,
    onAddHabit,
    onAddTodo
}: IntegratedDashboardProps) {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [completions, setCompletions] = useState<HabitCompletion[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [habitsRes, todosRes, completionsRes] = await Promise.all([
                    fetch('/api/habits'),
                    fetch('/api/todos'),
                    fetch('/api/habits/completions')
                ]);

                if (habitsRes.ok) {
                    const habitsData = await habitsRes.json();
                    setHabits(habitsData);
                }

                if (todosRes.ok) {
                    const todosData = await todosRes.json();
                    setTodos(todosData.todos || []);
                }

                if (completionsRes.ok) {
                    const completionsData = await completionsRes.json();
                    setCompletions(completionsData);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const completeHabit = async (habitId: string) => {
        try {
            const response = await fetch('/api/habits/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habitId }),
            });

            if (response.ok) {
                // Refresh completions
                const completionsRes = await fetch('/api/habits/completions');
                if (completionsRes.ok) {
                    const completionsData = await completionsRes.json();
                    setCompletions(completionsData);
                }
            }
        } catch (error) {
            console.error('Error completing habit:', error);
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
            }
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const getTodaysCompletions = () => {
        return completions.filter(completion =>
            isSameDay(new Date(completion.completedAt), new Date())
        );
    };

    const getTodaysProgress = () => {
        const todaysCompletions = getTodaysCompletions();
        const totalHabits = habits.length;
        const completedHabits = todaysCompletions.length;
        const totalTodos = todos.length;
        const completedTodos = todos.filter(todo => todo.isCompleted).length;

        return {
            habitsProgress: totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0,
            todosProgress: totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0,
            totalPoints: todaysCompletions.reduce((sum, completion) => sum + completion.points, 0)
        };
    };

    const getHabitIntensityColor = (intensity: string) => {
        switch (intensity) {
            case 'easy': return 'bg-green-500';
            case 'medium': return 'bg-yellow-500';
            case 'hard': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    const progress = getTodaysProgress();
    const todaysCompletions = getTodaysCompletions();

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
                        Your daily progress across habits and tasks
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{todaysCompletions.length}</div>
                            <div className="text-sm text-muted-foreground">Habits Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{todos.filter(t => t.isCompleted).length}</div>
                            <div className="text-sm text-muted-foreground">Tasks Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{progress.totalPoints}</div>
                            <div className="text-sm text-muted-foreground">Points Earned</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Tabs defaultValue="today" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="today">Today&apos;s Focus</TabsTrigger>
                    <TabsTrigger value="habits">All Habits</TabsTrigger>
                    <TabsTrigger value="todos">All Tasks</TabsTrigger>
                </TabsList>

                {/* Today's Focus Tab */}
                <TabsContent value="today" className="space-y-4">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Today's Habits */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Today&apos;s Habits</CardTitle>
                                    <CardDescription>Complete your daily habits</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={onAddHabit}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Habit
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {habits.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">
                                        No habits yet. Add your first habit to get started!
                                    </p>
                                ) : (
                                    habits.map((habit) => {
                                        const isCompleted = todaysCompletions.some(c => c.habitId === habit._id);

                                        return (
                                            <div key={habit._id} className={`p-3 rounded-lg border transition-all ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'hover:bg-muted'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full ${getHabitIntensityColor(habit.intensity)}`} />
                                                        <div>
                                                            <div className="font-medium">{habit.title}</div>
                                                            {habit.description && (
                                                                <div className="text-sm text-muted-foreground">{habit.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">{habit.pointValue} pts</Badge>
                                                        <Button
                                                            onClick={() => completeHabit(habit._id!)}
                                                            disabled={isCompleted}
                                                            variant={isCompleted ? "secondary" : "default"}
                                                            size="sm"
                                                        >
                                                            {isCompleted ? (
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            ) : (
                                                                <Circle className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>

                        {/* Today's Tasks */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Active Tasks</CardTitle>
                                    <CardDescription>Manage your to-do items</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={onAddTodo}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Task
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {todos.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">
                                        No tasks yet. Add your first task to get organized!
                                    </p>
                                ) : (
                                    todos.slice(0, 6).map((todo) => (
                                        <div key={todo._id} className={`p-3 rounded-lg border transition-all ${todo.isCompleted ? 'bg-gray-50 dark:bg-gray-900/20' : 'hover:bg-muted'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleTodo(todo._id, todo.isCompleted)}
                                                        className="p-0 h-auto"
                                                    >
                                                        {todo.isCompleted ? (
                                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <Circle className="h-5 w-5" />
                                                        )}
                                                    </Button>
                                                    <div>
                                                        <div className={`font-medium ${todo.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                                            {todo.title}
                                                        </div>
                                                        {todo.description && (
                                                            <div className="text-sm text-muted-foreground">{todo.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge variant={todo.isCompleted ? "secondary" : "default"}>
                                                    {todo.isCompleted ? "Done" : "Pending"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {todos.length > 6 && (
                                    <p className="text-sm text-muted-foreground text-center pt-2">
                                        And {todos.length - 6} more tasks...
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* All Habits Tab */}
                <TabsContent value="habits" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">All Habits</h3>
                        <Button onClick={onAddHabit}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Habit
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {habits.map((habit) => {
                            const isCompleted = todaysCompletions.some(c => c.habitId === habit._id);

                            return (
                                <Card key={habit._id} className={`transition-all hover:shadow-md ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{habit.title}</CardTitle>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${getHabitIntensityColor(habit.intensity)}`} />
                                                <Badge variant="outline">{habit.pointValue} pts</Badge>
                                            </div>
                                        </div>
                                        {habit.description && (
                                            <CardDescription>{habit.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Badge variant="secondary">{habit.category}</Badge>
                                                <Badge variant="outline">{habit.intensity}</Badge>
                                            </div>
                                            <Button
                                                onClick={() => completeHabit(habit._id!)}
                                                disabled={isCompleted}
                                                variant={isCompleted ? "secondary" : "default"}
                                                size="sm"
                                            >
                                                {isCompleted ? (
                                                    <>
                                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                                        Done
                                                    </>
                                                ) : (
                                                    <>
                                                        <Circle className="h-4 w-4 mr-2" />
                                                        Mark Done
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* All Todos Tab */}
                <TabsContent value="todos" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">All Tasks</h3>
                        <Button onClick={onAddTodo}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Task
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {todos.map((todo) => (
                            <Card key={todo._id} className={`transition-all hover:shadow-md ${todo.isCompleted ? 'opacity-75' : ''}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleTodo(todo._id, todo.isCompleted)}
                                                className="p-0 h-auto"
                                            >
                                                {todo.isCompleted ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <Circle className="h-5 w-5" />
                                                )}
                                            </Button>
                                            <div className="flex-1">
                                                <div className={`font-medium ${todo.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                                    {todo.title}
                                                </div>
                                                {todo.description && (
                                                    <div className="text-sm text-muted-foreground mt-1">{todo.description}</div>
                                                )}
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Created {format(new Date(todo.createdAt), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={todo.isCompleted ? "secondary" : "default"}>
                                            {todo.isCompleted ? "Completed" : "Pending"}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
