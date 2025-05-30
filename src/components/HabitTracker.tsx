'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Trophy,
    Target,
    Flame,
    Calendar as CalendarIcon,
    Plus,
    Star,
    TrendingUp,
    Award,
    CheckCircle2,
    Circle,
    Mountain,
    ChevronUp,
    Crown
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks } from 'date-fns';
import type {
    Goal,
    GoalCompletion,
    LadderProgress,
    GoalCalendarDay,
    LadderRung,
    Todo // Added Todo type
} from '@/types/habit';
import TodoComponent from './TodoComponent'; // Import TodoComponent

// Form schema validation
const goalFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title cannot be more than 100 characters'),
    description: z.string().max(500, 'Description cannot be more than 500 characters').optional(),
    intensity: z.enum(['easy', 'medium', 'hard']),
    category: z.enum(['health', 'productivity', 'learning', 'mindfulness', 'fitness', 'creative', 'social', 'other']),
    targetFrequency: z.enum(['daily', 'weekly']),
});

interface GoalTrackerProps {
    userId: string;
}

const LADDER_RUNGS: LadderRung[] = [
    { level: 1, pointsRequired: 0, title: 'Ground Level', description: 'Starting your journey' },
    { level: 2, pointsRequired: 50, title: 'First Step', description: 'Building momentum', reward: 'Neon theme unlocked' },
    { level: 3, pointsRequired: 150, title: 'Getting Higher', description: 'Consistency pays off', reward: 'Streak multiplier x1.2' },
    { level: 4, pointsRequired: 300, title: 'Midway Point', description: 'Halfway to mastery', reward: 'Nature theme unlocked' },
    { level: 5, pointsRequired: 500, title: 'Almost There', description: 'Excellence in sight', reward: 'Bonus achievements unlocked' },
    { level: 6, pointsRequired: 750, title: 'Peak Performance', description: 'Master of habits', reward: 'Space theme unlocked' },
    { level: 7, pointsRequired: 1000, title: 'Ladder Legend', description: 'Transcended ordinary limits', reward: 'Crown badge & all themes' },
];

export default function GoalTracker({ userId }: GoalTrackerProps) {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [completions, setCompletions] = useState<GoalCompletion[]>([]);
    const [ladderProgress, setLadderProgress] = useState<LadderProgress | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [calendarData, setCalendarData] = useState<GoalCalendarDay[]>([]);
    const [isAddingHabit, setIsAddingHabit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [todos, setTodos] = useState<Todo[]>([]); // Added state for todos
    const [showTodoModalForHabit, setShowTodoModalForHabit] = useState<string | null>(null);

    // Initialize form
    const form = useForm<z.infer<typeof goalFormSchema>>({
        resolver: zodResolver(goalFormSchema),
        defaultValues: {
            title: '',
            description: '',
            intensity: 'medium',
            category: 'other',
            targetFrequency: 'daily',
        },
    });

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchGoals(),
                    fetchCompletions(),
                    fetchLadderProgress(),
                    fetchTodos() // Fetch todos
                ]);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const generateCalendarData = useCallback(() => {
        const today = new Date();
        const startDate = subWeeks(today, 12); // Last 12 weeks
        const days = eachDayOfInterval({ start: startDate, end: today });

        const calendarDays: GoalCalendarDay[] = days.map(date => {
            const dayCompletions = completions.filter(completion =>
                isSameDay(new Date(completion.completedAt), date)
            );

            const totalPoints = dayCompletions.reduce((sum, completion) => sum + completion.points, 0);

            return {
                date,
                completedGoals: dayCompletions,
                totalPoints,
                hasCompletions: dayCompletions.length > 0,
            };
        });

        setCalendarData(calendarDays);
    }, [completions]);

    // Update calendar data when completions change
    useEffect(() => {
        generateCalendarData();
    }, [generateCalendarData]);

    const fetchGoals = async () => {
        try {
            const response = await fetch('/api/goals');
            if (response.ok) {
                const data = await response.json();
                setGoals(data);
            }
        } catch (error) {
            console.error('Error fetching goals:', error);
        }
    };

    const fetchCompletions = async () => {
        try {
            const response = await fetch('/api/goals/completions');
            if (response.ok) {
                const data = await response.json();
                setCompletions(data);
            }
        } catch (error) {
            console.error('Error fetching completions:', error);
        }
    };

    const fetchLadderProgress = async () => {
        try {
            const response = await fetch('/api/goals/progress');
            if (response.ok) {
                const data = await response.json();
                setLadderProgress(data);
            }
        } catch (error) {
            console.error('Error fetching ladder progress:', error);
        }
    };

    const fetchTodos = async () => { // Function to fetch todos
        try {
            const response = await fetch('/api/todos');
            if (response.ok) {
                const data = await response.json();
                setTodos(data.todos || []);
            }
        } catch (error) {
            console.error('Error fetching todos:', error);
        }
    };

    const completeHabit = async (habitId: string) => {
        try {
            const response = await fetch('/api/goals/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habitId }),
            });

            if (response.ok) {
                await Promise.all([fetchCompletions(), fetchLadderProgress()]);
            }
        } catch (error) {
            console.error('Error completing habit:', error);
        }
    };

    const undoHabitCompletion = async (habitId: string) => {
        try {
            const response = await fetch(`/api/goals/completions?habitId=${habitId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await Promise.all([fetchCompletions(), fetchLadderProgress()]);
            }
        } catch (error) {
            console.error('Error undoing habit completion:', error);
        }
    };

    const areAllSubtasksCompleted = (habitId: string) => {
        const habitTodos = todos.filter(todo => todo.habitId === habitId);
        if (habitTodos.length === 0) return true; // If no subtasks, consider it complete
        return habitTodos.every(todo => todo.isCompleted);
    };

    const createHabit = async (values: z.infer<typeof goalFormSchema>) => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                await fetchGoals();
                setIsAddingHabit(false);
                form.reset();
            } else {
                const errorData = await response.json();
                console.error('Error creating habit:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                });
                // You could add toast notifications here
                alert(`Failed to create habit: ${errorData.details || errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating habit:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                error
            });
            alert(`Network error creating habit: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCurrentRung = (): LadderRung => {
        if (!ladderProgress) return LADDER_RUNGS[0];

        for (let i = LADDER_RUNGS.length - 1; i >= 0; i--) {
            if (ladderProgress.totalPoints >= LADDER_RUNGS[i].pointsRequired) {
                return LADDER_RUNGS[i];
            }
        }
        return LADDER_RUNGS[0];
    };

    const getNextRung = (): LadderRung | null => {
        const currentRung = getCurrentRung();
        const nextIndex = LADDER_RUNGS.findIndex(rung => rung.level === currentRung.level) + 1;
        return nextIndex < LADDER_RUNGS.length ? LADDER_RUNGS[nextIndex] : null;
    };

    const getProgressToNextRung = (): number => {
        if (!ladderProgress) return 0;
        const nextRung = getNextRung();
        if (!nextRung) return 100;

        const currentRung = getCurrentRung();
        const progress = ladderProgress.totalPoints - currentRung.pointsRequired;
        const total = nextRung.pointsRequired - currentRung.pointsRequired;

        return Math.min((progress / total) * 100, 100);
    };

    const getTodaysCompletions = () => {
        return completions.filter(completion =>
            isSameDay(new Date(completion.completedAt), new Date())
        );
    };

    const getHabitIntensityColor = (intensity: string) => {
        switch (intensity) {
            case 'easy': return 'bg-green-500';
            case 'medium': return 'bg-yellow-500';
            case 'hard': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getHeatmapIntensity = (points: number): string => {
        if (points === 0) return 'bg-gray-100 dark:bg-gray-800';
        if (points <= 10) return 'bg-green-200 dark:bg-green-900';
        if (points <= 25) return 'bg-green-300 dark:bg-green-800';
        if (points <= 50) return 'bg-green-400 dark:bg-green-700';
        return 'bg-green-500 dark:bg-green-600';
    };

    const WeeklyStats = () => {
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

        const weekCompletions = completions.filter(completion => {
            const completionDate = new Date(completion.completedAt);
            return completionDate >= weekStart && completionDate <= weekEnd;
        });

        const weekPoints = weekCompletions.reduce((sum, completion) => sum + completion.points, 0);

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        This Week
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Weekly Points</span>
                                <span className="font-medium">{weekPoints}/200</span>
                            </div>
                            <Progress value={(weekPoints / 200) * 100} className="h-2" />
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {weekDays.map((day, index) => {
                                const dayCompletions = completions.filter(completion =>
                                    isSameDay(new Date(completion.completedAt), day)
                                );
                                const dayPoints = dayCompletions.reduce((sum, completion) => sum + completion.points, 0);

                                return (
                                    <div key={index} className="text-center">
                                        <div className="text-xs font-medium mb-1">
                                            {format(day, 'EEE')}
                                        </div>
                                        <div
                                            className={`w-8 h-8 rounded-md mx-auto flex items-center justify-center text-xs font-medium ${getHeatmapIntensity(dayPoints)}`}
                                        >
                                            {dayPoints > 0 && dayPoints}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header with Ladder Progress */}
            <div className="flex flex-col lg:flex-row gap-6">
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mountain className="h-6 w-6" />
                            Ladder to Success
                            {getCurrentRung().level >= 7 && <Crown className="h-5 w-5 text-yellow-500" />}
                        </CardTitle>
                        <CardDescription>
                            {getCurrentRung().description} • Level {getCurrentRung().level}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                    <span className="font-medium">{getCurrentRung().title}</span>
                                </div>
                                <Badge variant="secondary">{ladderProgress?.totalPoints || 0} points</Badge>
                            </div>

                            {getNextRung() && (
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Progress to {getNextRung()?.title}</span>
                                        <span>{ladderProgress?.totalPoints || 0}/{getNextRung()?.pointsRequired}</span>
                                    </div>
                                    <Progress value={getProgressToNextRung()} className="h-3" />
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4 pt-2">
                                <div className="text-center">
                                    <div className="font-semibold text-lg">{ladderProgress?.currentStreak || 0}</div>
                                    <div className="text-sm text-muted-foreground">Current Streak</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-lg">{ladderProgress?.longestStreak || 0}</div>
                                    <div className="text-sm text-muted-foreground">Best Streak</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-lg">{ladderProgress?.completedChallenges || 0}</div>
                                    <div className="text-sm text-muted-foreground">Challenges</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <WeeklyStats />
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="today" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="today">Today&apos;s Goals</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                    <TabsTrigger value="progress">Progress & Stats</TabsTrigger>
                </TabsList>

                {/* Today&apos;s Goals Tab */}
                <TabsContent value="today" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Today&apos;s Goals</h2>
                        <Dialog open={isAddingHabit} onOpenChange={setIsAddingHabit}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Goal
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Goal</DialogTitle>
                                    <DialogDescription>
                                        Add a new goal to your ladder journey. Choose the intensity wisely!
                                    </DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(createHabit)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Goal Title</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g., Morning workout"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Brief description of your goal"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="intensity"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Intensity</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select intensity" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="easy">Easy (5 points)</SelectItem>
                                                                <SelectItem value="medium">Medium (10 points)</SelectItem>
                                                                <SelectItem value="hard">Hard (20 points)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Category</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select category" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="health">Health</SelectItem>
                                                                <SelectItem value="fitness">Fitness</SelectItem>
                                                                <SelectItem value="productivity">Productivity</SelectItem>
                                                                <SelectItem value="learning">Learning</SelectItem>
                                                                <SelectItem value="mindfulness">Mindfulness</SelectItem>
                                                                <SelectItem value="creative">Creative</SelectItem>
                                                                <SelectItem value="social">Social</SelectItem>
                                                                <SelectItem value="other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Creating...' : 'Create Goal'}
                                        </Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {goals.map((goal) => {
                            const todaysCompletions = getTodaysCompletions();
                            const isCompleted = todaysCompletions.some(c => c.habitId === goal._id);

                            return (
                                <Card key={goal._id} className={`transition-all hover:shadow-md ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{goal.title}</CardTitle>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${getHabitIntensityColor(goal.intensity)}`} />
                                                <Badge variant="outline">{goal.pointValue} pts</Badge>
                                            </div>
                                        </div>
                                        {goal.description && (
                                            <CardDescription>{goal.description}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Badge variant="secondary">{goal.category}</Badge>
                                                <Badge variant="outline">{goal.intensity}</Badge>
                                            </div>

                                            {isCompleted ? (
                                                <Button
                                                    onClick={() => undoHabitCompletion(goal._id!)}
                                                    variant="secondary"
                                                    size="sm"
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                    Undo
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => completeHabit(goal._id!)}
                                                    disabled={!areAllSubtasksCompleted(goal._id!)}
                                                    variant={!areAllSubtasksCompleted(goal._id!) ? "outline" : "default"}
                                                    size="sm"
                                                    title={!areAllSubtasksCompleted(goal._id!) ? "Complete all sub-tasks first" : ""}
                                                >
                                                    <Circle className="h-4 w-4 mr-2" />
                                                    Mark Done
                                                </Button>
                                            )}
                                        </div>

                                        {/* Display sub-tasks (todos) for this goal */}
                                        <div className="mt-4 pt-3 border-t border-muted">
                                            <h4 className="text-sm font-medium mb-2 flex justify-between items-center">
                                                Sub-Tasks
                                                <Button variant="ghost" size="sm" onClick={() => setShowTodoModalForHabit(goal._id!)}>
                                                    <Plus className="h-3 w-3 mr-1" /> Add Task
                                                </Button>
                                            </h4>
                                            {todos.filter(todo => todo.habitId === goal._id).length > 0 ? (
                                                <ul className="space-y-2">
                                                    {todos.filter(todo => todo.habitId === goal._id).map(todo => (
                                                        <li key={todo._id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-md">
                                                            <span className={`${todo.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{todo.title}</span>
                                                            <Badge variant={todo.isCompleted ? "default" : "outline"} className={`${todo.isCompleted ? 'bg-green-500 text-white' : ''}`}>
                                                                {todo.isCompleted ? 'Done' : 'Pending'}
                                                            </Badge>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">No sub-tasks for this goal yet.</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                {/* Calendar View Tab */}
                <TabsContent value="calendar" className="space-y-4">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CalendarIcon className="h-5 w-5" />
                                        Goal Heatmap
                                    </CardTitle>
                                    <CardDescription>
                                        Your goal completion journey over the past 12 weeks
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-7 gap-1 text-xs">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                            <div key={day} className="text-center font-medium p-1">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 mt-2">
                                        {calendarData.map((day, index) => (
                                            <TooltipProvider key={index}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={`w-4 h-4 rounded-sm cursor-pointer transition-all hover:scale-110 ${getHeatmapIntensity(day.totalPoints)}`}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{format(day.date, 'MMM d, yyyy')}</p>
                                                        <p>{day.totalPoints} points</p>
                                                        <p>{day.completedGoals.length} goals completed</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                                        <span>Less</span>
                                        <div className="flex gap-1">
                                            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                                            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
                                            <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-800" />
                                            <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
                                            <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
                                        </div>
                                        <span>More</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Selected Day</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => date && setSelectedDate(date)}
                                        className="rounded-md border"
                                    />
                                </CardContent>
                            </Card>

                            {selectedDate && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            {format(selectedDate, 'MMM d, yyyy')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            const dayData = calendarData.find(day =>
                                                isSameDay(day.date, selectedDate)
                                            );

                                            if (!dayData || dayData.completedGoals.length === 0) {
                                                return <p className="text-muted-foreground">No goals completed this day.</p>;
                                            }

                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="font-medium">Total Points</span>
                                                        <Badge>{dayData.totalPoints}</Badge>
                                                    </div>
                                                    {dayData.completedGoals.map((completion) => {
                                                        const goal = goals.find(g => g._id === completion.habitId);
                                                        return (
                                                            <div key={completion._id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                                <span className="text-sm">{goal?.title || 'Unknown Goal'}</span>
                                                                <Badge variant="secondary">{completion.points} pts</Badge>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Progress & Stats Tab */}
                <TabsContent value="progress" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Ladder Visualization */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mountain className="h-5 w-5" />
                                    Ladder Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {LADDER_RUNGS.slice().reverse().map((rung) => {
                                        const isCurrentLevel = getCurrentRung().level === rung.level;
                                        const isCompleted = (ladderProgress?.totalPoints || 0) >= rung.pointsRequired;
                                        const isNext = getNextRung()?.level === rung.level;

                                        return (
                                            <div
                                                key={rung.level}
                                                className={`p-3 rounded-lg border transition-all ${isCurrentLevel
                                                    ? 'bg-primary/10 border-primary'
                                                    : isCompleted
                                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                                                        : isNext
                                                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                                                            : 'bg-muted'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {rung.title}
                                                            {isCurrentLevel && <ChevronUp className="h-4 w-4 text-primary" />}
                                                            {rung.level >= 7 && <Crown className="h-4 w-4 text-yellow-500" />}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">{rung.description}</div>
                                                        {rung.reward && (
                                                            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                                                🎁 {rung.reward}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium">{rung.pointsRequired}</div>
                                                        <div className="text-xs text-muted-foreground">points</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Achievements */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5" />
                                    Achievements
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {ladderProgress?.achievements && ladderProgress.achievements.length > 0 ? (
                                    <div className="space-y-3">
                                        {ladderProgress.achievements.map((achievement) => (
                                            <div key={achievement.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                                <div className="text-2xl">{achievement.icon}</div>
                                                <div>
                                                    <div className="font-medium">{achievement.title}</div>
                                                    <div className="text-sm text-muted-foreground">{achievement.description}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(new Date(achievement.unlockedAt), 'MMM d, yyyy')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">No achievements yet. Keep climbing the ladder!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Additional Stats */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                                        <p className="text-2xl font-bold">{ladderProgress?.totalPoints || 0}</p>
                                    </div>
                                    <Star className="h-8 w-8 text-yellow-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                                        <p className="text-2xl font-bold">{ladderProgress?.currentStreak || 0}</p>
                                    </div>
                                    <Flame className="h-8 w-8 text-orange-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                                        <p className="text-2xl font-bold">{goals.length}</p>
                                    </div>
                                    <Target className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Todo Modal - Render TodoComponent in a Dialog when showTodoModalForHabit is set */}
            {showTodoModalForHabit && (
                <Dialog open={!!showTodoModalForHabit} onOpenChange={() => setShowTodoModalForHabit(null)}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Manage Tasks for Goal</DialogTitle>
                            <DialogDescription>
                                Add, edit, or complete tasks related to this goal.
                            </DialogDescription>
                        </DialogHeader>
                        <TodoComponent userId={userId} habitId={showTodoModalForHabit} isModal={true} />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
