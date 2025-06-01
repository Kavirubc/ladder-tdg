'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Activity } from '@/types/activity';

// Form schema validation
const formSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().max(500).optional(),
    activityId: z.string().optional(),
});

interface QuickAddTodoProps {
    userId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function QuickAddTodo({ userId, onSuccess, onCancel }: QuickAddTodoProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            activityId: 'none', // Set default to 'none' instead of undefined or empty string
        },
    });

    // Fetch activities for dropdown
    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await fetch('/api/activities');
                if (response.ok) {
                    const activitiesData = await response.json();
                    setActivities(activitiesData);
                } else {
                    console.error('Failed to fetch activities');
                }
            } catch (error) {
                console.error('Error fetching activities:', error);
            }
        };

        fetchActivities();
    }, [userId]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        setError(null);

        try {
            const todoData = {
                title: values.title,
                description: values.description || '',
                user: userId,
            };

            // Use different endpoints based on whether an activity is selected
            const endpoint = values.activityId !== 'none'
                ? '/api/todos'
                : '/api/todos/standalone';

            // If using the regular endpoint, include the activityId
            const dataToSend = values.activityId !== 'none'
                ? { ...todoData, activityId: values.activityId }
                : todoData;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add todo');
            }

            form.reset();
            onSuccess();
        } catch (error) {
            console.error('Error adding todo:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Filter active activities
    const activeActivities = activities.filter(a => a.isActive !== false);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Quick Add Task</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Task Title *</FormLabel>
                                <FormControl>
                                    <Input placeholder="What do you need to do?" {...field} />
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
                                    <Input placeholder="Add more details..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="activityId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Related Goal/Habit (Optional)</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a goal or habit (optional)" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">None (General Task)</SelectItem>
                                        {activeActivities.map((activity) => (
                                            <SelectItem key={activity._id} value={activity._id}>
                                                {activity.title} {activity.isRecurring ? '(Habit)' : '(Goal)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Adding...' : 'Add Task'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
