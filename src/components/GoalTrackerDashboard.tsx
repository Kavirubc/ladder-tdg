'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Clock, RefreshCcw, Target } from 'lucide-react';
import { startOfDay } from 'date-fns';

interface GoalSummary {
    _id: string;
    title: string;
    completedTasks: number;
    totalTasks: number;
    repetitiveTasks: number;
    progress: number;
}

interface GoalTrackerDashboardProps {
    userId: string;
}

export default function GoalTrackerDashboard({ userId }: GoalTrackerDashboardProps) {
    const [goalSummaries, setGoalSummaries] = useState<GoalSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalStats, setTotalStats] = useState({
        completedTasks: 0,
        totalTasks: 0,
        repetitiveTasks: 0,
        activeGoals: 0,
        completedGoals: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch all goals
                const goalsResponse = await fetch('/api/goals');
                if (!goalsResponse.ok) {
                    throw new Error('Failed to fetch goals');
                }
                const goals = await goalsResponse.json();

                // 2. Fetch all todos
                const todosResponse = await fetch('/api/todos');
                if (!todosResponse.ok) {
                    throw new Error('Failed to fetch todos');
                }
                const todosData = await todosResponse.json();
                const todos = todosData.todos || [];

                // Process data to create dashboard metrics
                const summaries: GoalSummary[] = [];
                let totalCompletedTasks = 0;
                let totalTasks = 0;
                let totalRepetitiveTasks = 0;

                goals.forEach(goal => {
                    const goalTodos = todos.filter(todo => todo.goalId === goal._id);
                    const completedTasks = goalTodos.filter(todo => todo.isCompleted).length;
                    const repetitiveTasks = goalTodos.filter(todo => todo.isRepetitive).length;

                    totalCompletedTasks += completedTasks;
                    totalTasks += goalTodos.length;
                    totalRepetitiveTasks += repetitiveTasks;

                    if (goalTodos.length > 0) {
                        summaries.push({
                            _id: goal._id,
                            title: goal.title,
                            completedTasks,
                            totalTasks: goalTodos.length,
                            repetitiveTasks,
                            progress: goalTodos.length ? Math.round((completedTasks / goalTodos.length) * 100) : 0
                        });
                    }
                });

                setGoalSummaries(summaries);
                setTotalStats({
                    completedTasks: totalCompletedTasks,
                    totalTasks,
                    repetitiveTasks: totalRepetitiveTasks,
                    activeGoals: goals.filter(g => g.isActive).length,
                    completedGoals: summaries.filter(s => s.progress === 100).length
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    return (
        <Card className="max-w-4xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                    <Target className="mr-2 h-6 w-6" />
                    Goal Tracker Dashboard
                </CardTitle>
                <CardDescription>
                    Monitor your progress across all goals and repetitive tasks
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-10">
                        <p className="text-lg text-muted-foreground">Loading dashboard...</p>
                    </div>
                ) : (
                    <>
                        {/* Overall Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <h3 className="text-muted-foreground mb-1">Tasks Completion</h3>
                                        <p className="text-3xl font-bold">{totalStats.completedTasks}/{totalStats.totalTasks}</p>
                                        <Progress
                                            value={totalStats.totalTasks ? (totalStats.completedTasks / totalStats.totalTasks) * 100 : 0}
                                            className="h-2 mt-2"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <h3 className="text-muted-foreground mb-1">Active Goals</h3>
                                        <p className="text-3xl font-bold">{totalStats.activeGoals}</p>
                                        <div className="text-sm text-muted-foreground mt-2">
                                            {totalStats.completedGoals} goals at 100%
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <h3 className="text-muted-foreground mb-1">Repetitive Tasks</h3>
                                        <p className="text-3xl font-bold">{totalStats.repetitiveTasks}</p>
                                        <div className="text-sm flex items-center justify-center text-muted-foreground mt-2">
                                            <RefreshCcw className="h-3 w-3 mr-1" /> Auto-renewing
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Goals Progress */}
                        <Tabs defaultValue="progress">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="progress">Progress By Goal</TabsTrigger>
                                <TabsTrigger value="tasks">Task Status</TabsTrigger>
                            </TabsList>
                            <TabsContent value="progress">
                                {goalSummaries.length > 0 ? (
                                    <div className="space-y-6">
                                        {goalSummaries.map(goal => (
                                            <div key={goal._id}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="font-medium">{goal.title}</h3>
                                                    <Badge variant={goal.progress === 100 ? "default" : "outline"}>
                                                        {goal.progress}%
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center">
                                                    <Progress value={goal.progress} className="h-2 flex-1" />
                                                    <span className="ml-2 text-sm text-muted-foreground">
                                                        {goal.completedTasks}/{goal.totalTasks}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {goal.repetitiveTasks > 0 && (
                                                        <span className="flex items-center">
                                                            <RefreshCcw className="h-3 w-3 mr-1" /> {goal.repetitiveTasks} repetitive tasks
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 border-2 border-dashed border-muted rounded-lg">
                                        <p className="text-muted-foreground">No goals with tasks found.</p>
                                        <p className="text-sm text-muted-foreground mt-1">Create goals and add tasks to track progress.</p>
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="tasks">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center">
                                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                                Completed
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-3xl font-bold mb-2">{totalStats.completedTasks}</p>
                                            <Progress value={100} className="h-2 bg-green-200" />
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center">
                                                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                                Pending
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-3xl font-bold mb-2">{totalStats.totalTasks - totalStats.completedTasks}</p>
                                            <Progress value={100} className="h-2 bg-red-200" />
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex items-center">
                                                <RefreshCcw className="h-4 w-4 mr-2 text-blue-500" />
                                                Repetitive
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-3xl font-bold mb-2">{totalStats.repetitiveTasks}</p>
                                            <Progress value={100} className="h-2 bg-blue-200" />
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
