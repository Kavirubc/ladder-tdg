// filepath: /Users/kaviruhapuarachchi/Downloads/ladder-tdg/src/components/ActivityForm.tsx
'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Activity, ActivityCategory, ActivityIntensity, ActivityFrequency } from '@/types/activity';

const activityFormSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title cannot be more than 100 characters'),
    description: z.string().max(500, 'Description cannot be more than 500 characters').optional(),
    intensity: z.nativeEnum(ActivityIntensity),
    category: z.nativeEnum(ActivityCategory),
    isRecurring: z.boolean().optional(), // Changed from .default(false) to .optional()
    targetFrequency: z.nativeEnum(ActivityFrequency).optional(),
    deadline: z.string().optional(),
}).refine(data => {
    const isRecurring = data.isRecurring ?? false; // Handle potentially undefined isRecurring
    if (isRecurring && (!data.targetFrequency || data.targetFrequency === ActivityFrequency.None)) {
        return false;
    }
    return true;
}, {
    message: "Target frequency is required for recurring activities and must not be 'None'.",
    path: ["targetFrequency"],
});

// Define a type for the form values based on the schema
type ActivityFormValues = z.infer<typeof activityFormSchema>;

const baseDefaultFormValues: ActivityFormValues = {
    title: '',
    description: undefined,
    intensity: ActivityIntensity.Medium,
    category: ActivityCategory.Other,
    isRecurring: false, // Application-level default
    targetFrequency: undefined,
    deadline: undefined,
};

interface ActivityFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onActivitySaved: () => void; // Callback to refresh data on parent
    userId: string;
    initialActivity?: Activity;
}

export default function ActivityForm({
    isOpen,
    onOpenChange,
    onActivitySaved,
    userId,
    initialActivity
}: ActivityFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const form = useForm<ActivityFormValues>({
        resolver: zodResolver(activityFormSchema),
        defaultValues: baseDefaultFormValues,
    });

    React.useEffect(() => {
        if (isOpen) {
            setFormError(null);
            const getIntensityEnum = (intensityStr?: 'easy' | 'medium' | 'hard'): ActivityIntensity => {
                return Object.values(ActivityIntensity).includes(intensityStr as ActivityIntensity)
                    ? intensityStr as ActivityIntensity
                    : ActivityIntensity.Medium;
            };
            const getCategoryEnum = (categoryStr?: 'health' | 'productivity' | 'learning' | 'mindfulness' | 'fitness' | 'creative' | 'social' | 'other'): ActivityCategory => {
                return Object.values(ActivityCategory).includes(categoryStr as ActivityCategory)
                    ? categoryStr as ActivityCategory
                    : ActivityCategory.Other;
            };
            const getFrequencyEnum = (frequencyStr?: 'daily' | 'weekly' | 'monthly' | 'none'): ActivityFrequency | undefined => {
                if (!frequencyStr || frequencyStr === 'none') return undefined;
                return Object.values(ActivityFrequency).includes(frequencyStr as ActivityFrequency)
                    ? frequencyStr as ActivityFrequency
                    : undefined;
            };

            if (initialActivity) {
                const currentIsRecurring = initialActivity.isRecurring ?? false;
                form.reset({
                    title: initialActivity.title || '',
                    description: initialActivity.description || undefined,
                    intensity: getIntensityEnum(initialActivity.intensity),
                    category: getCategoryEnum(initialActivity.category),
                    isRecurring: currentIsRecurring,
                    targetFrequency: currentIsRecurring
                        ? getFrequencyEnum(initialActivity.targetFrequency)
                        : undefined,
                    deadline: !currentIsRecurring && initialActivity.deadline 
                        ? initialActivity.deadline.split('T')[0] 
                        : undefined,
                });
            } else {
                form.reset(baseDefaultFormValues);
            }
        }
    }, [isOpen, initialActivity, form.reset]);

    const isRecurringWatched = form.watch("isRecurring") ?? false; // Handle undefined from watch if schema is optional

    const onSubmit = async (values: ActivityFormValues) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setFormError(null);

        const isEditMode = !!initialActivity?._id;
        const finalIsRecurring = values.isRecurring ?? false; // Ensure boolean for logic

        const payload: any = { 
            ...values, 
            userId, 
            isRecurring: finalIsRecurring // Send the definite boolean value
        };

        if (!finalIsRecurring) {
            payload.targetFrequency = undefined; 
        } else {
            payload.deadline = undefined; 
            if (!payload.targetFrequency || payload.targetFrequency === ActivityFrequency.None) {
                setFormError("Target frequency is required for recurring activities and cannot be 'None'.");
                setIsSubmitting(false);
                return;
            }
        }

        if (payload.description === '') payload.description = undefined;
        if (payload.deadline === '') payload.deadline = undefined;
        // Ensure targetFrequency is not empty string if it was somehow set to it
        if (payload.targetFrequency === '') payload.targetFrequency = undefined;

        try {
            const url = isEditMode ? `/api/activities/${initialActivity._id}` : '/api/activities';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                onActivitySaved(); // Call the callback
                onOpenChange(false); // Close dialog
                // form.reset(); // Reset is now handled by useEffect on isOpen change
            } else {
                const errorData = await response.json().catch(() => ({ message: "An unknown error occurred." }));
                const errorMessage = errorData.message || (isEditMode ? 'Failed to update activity' : 'Failed to create activity');
                console.error(`Error ${isEditMode ? 'updating' : 'creating'} activity:`, errorData);
                setFormError(errorMessage);
                // alert(`Failed to ${isEditMode ? 'update' : 'create'} activity: ${errorMessage}`);
            }
        } catch (error) {
            console.error(`Network error ${isEditMode ? 'updating' : 'creating'} activity:`, error);
            const networkErrorMessage = error instanceof Error ? error.message : 'A network error occurred. Please try again.';
            setFormError(networkErrorMessage);
            // alert(`Network error: ${networkErrorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{initialActivity?._id ? 'Edit Activity' : 'Create New Activity'}</DialogTitle>
                    <DialogDescription>
                        Define your new goal or recurring habit. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        {formError && (
                            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                                <span className="font-medium">Error:</span> {formError}
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Morning workout, Read a book" {...field} />
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
                                        <Input placeholder="Brief description of your activity" {...field} />
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
                                                <SelectTrigger><SelectValue placeholder="Select intensity" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(ActivityIntensity).map(val => (
                                                    <SelectItem key={val} value={val} className="capitalize">{val}</SelectItem>
                                                ))}
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
                                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(ActivityCategory).map(val => (
                                                    <SelectItem key={val} value={val} className="capitalize">{val}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="isRecurring"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value} // field.value here is boolean due to schema default
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Is this a recurring activity (e.g., a habit)?</FormLabel>
                                        <FormDescription>
                                            Recurring activities can be tracked daily, weekly, etc.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {isRecurringWatched ? (
                            <FormField
                                control={form.control}
                                name="targetFrequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Frequency</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(ActivityFrequency).filter(f => f !== ActivityFrequency.None).map(val => (
                                                    <SelectItem key={val} value={val} className="capitalize">{val}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                            <FormField
                                control={form.control}
                                name="deadline"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deadline (Optional)</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Set a deadline for one-time goals.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : (initialActivity ? 'Save Changes' : 'Create Activity')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
