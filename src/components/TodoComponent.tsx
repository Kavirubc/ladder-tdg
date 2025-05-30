'use client';

import { useState, useEffect, useOptimistic, startTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// Import Activity types
import { Activity, Todo as TodoType } from '@/types/activity';

// Form schema validation
const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
});

// Todo interface (updated to use TodoType from global types)
interface Todo extends TodoType { }

// Optimistic action types
type OptimisticAction =
  | { type: 'ADD'; todo: Todo }
  | { type: 'UPDATE'; todo: Todo }
  | { type: 'DELETE'; id: string }
  | { type: 'SET'; todos: Todo[] };

interface TodoComponentProps {
  userId: string;
  activityId?: string; // Changed from goalId to activityId
  isModal?: boolean;
}

export default function TodoComponent({ userId, activityId, isModal }: TodoComponentProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

  const [optimisticTodos, updateOptimisticTodos] = useOptimistic<Todo[], OptimisticAction>(
    todos,
    (state, action) => {
      switch (action.type) {
        case 'SET':
          return action.todos;
        case 'ADD':
          // Check if todo already exists to prevent duplicates
          const exists = state.some(todo => todo._id === action.todo._id);
          if (exists) return state;
          return [...state, action.todo];
        case 'UPDATE':
          return state.map(todo =>
            todo._id === action.todo._id ? action.todo : todo
          );
        case 'DELETE':
          return state.filter(todo => todo._id !== action.id);
        default:
          return state;
      }
    }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const endpoint = activityId
          ? `/api/todos?activityId=${activityId}`
          : `/api/todos?userId=${userId}`;
        const todosResponse = await fetch(endpoint);

        if (!todosResponse.ok) {
          throw new Error('Failed to fetch todos');
        }
        const todosData = await todosResponse.json();
        // Ensure that the fetched data structure is correctly handled
        const fetchedTodos = Array.isArray(todosData.todos)
          ? todosData.todos
          : (Array.isArray(todosData.data) ? todosData.data : []);

        startTransition(() => {
          updateOptimisticTodos({ type: 'SET', todos: fetchedTodos });
          setTodos(fetchedTodos);
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId, activityId, updateOptimisticTodos]);

  const commonTodoFields = (values: z.infer<typeof formSchema>, currentActivityId: string) => ({
    title: values.title,
    description: values.description || '',
    user: userId,
    activityId: currentActivityId,
    // Default values for new fields from TodoType, adjust as necessary
    category: 'General',
    priority: 'Medium',
    // dueDate: undefined, // Or handle as needed
  });

  const addTodo = async (values: z.infer<typeof formSchema>) => {
    if (!activityId) {
      form.setError("root", { type: "manual", message: "An activity context is required to add tasks." });
      console.error("Activity ID is required to add a task.");
      return;
    }

    const newTodoServerData = {
      ...commonTodoFields(values, activityId),
      isCompleted: false,
    };

    const optimisticTodo: Todo = {
      _id: 'temp-' + Date.now(),
      ...newTodoServerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    startTransition(() => {
      updateOptimisticTodos({ type: 'ADD', todo: optimisticTodo });
    });

    setPendingActions(prev => new Set([...prev, optimisticTodo._id]));

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTodoServerData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add todo');
      }

      const { todo: savedTodo } = await response.json();

      // Update both actual state and optimistic state
      setTodos(prevTodos => {
        const filteredTodos = prevTodos.filter(t => t._id !== optimisticTodo._id);
        return [...filteredTodos, savedTodo];
      });

      startTransition(() => {
        updateOptimisticTodos({ type: 'UPDATE', todo: { ...optimisticTodo, ...savedTodo } });
      });
      form.reset();
    } catch (error) {
      console.error('Error adding todo:', error);
      // Remove the optimistic todo and revert state
      setTodos(prevTodos => prevTodos.filter(t => t._id !== optimisticTodo._id));
      startTransition(() => {
        updateOptimisticTodos({ type: 'DELETE', id: optimisticTodo._id });
      });
    } finally {
      setPendingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(optimisticTodo._id);
        return newSet;
      });
    }
  };

  const toggleTodo = async (todoToToggle: Todo) => {
    const updatedTodo = { ...todoToToggle, isCompleted: !todoToToggle.isCompleted, updatedAt: new Date().toISOString() };

    startTransition(() => {
      updateOptimisticTodos({ type: 'UPDATE', todo: updatedTodo });
    });

    setPendingActions(prev => new Set([...prev, todoToToggle._id]));

    try {
      const response = await fetch(`/api/todos/${todoToToggle._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted: updatedTodo.isCompleted }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      const { todo: savedTodo } = await response.json();
      setTodos(prevTodos => prevTodos.map(t => t._id === savedTodo._id ? savedTodo : t));
      startTransition(() => {
        updateOptimisticTodos({ type: 'SET', todos: todos.map(t => t._id === savedTodo._id ? savedTodo : t) });
      });
    } catch (error) {
      console.error('Error updating todo:', error);
      startTransition(() => {
        updateOptimisticTodos({ type: 'SET', todos }); // Revert
      });
    } finally {
      setPendingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(todoToToggle._id);
        return newSet;
      });
    }
  };

  const archiveTodo = async (todoId: string) => {
    const originalTodos = [...todos]; // Keep a copy for potential revert
    startTransition(() => {
      updateOptimisticTodos({ type: 'DELETE', id: todoId });
    });

    setPendingActions(prev => new Set([...prev, todoId]));

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE', // This now archives instead of deletes
      });

      if (!response.ok) {
        throw new Error('Failed to archive todo');
      }
      setTodos(prevTodos => prevTodos.filter(todo => todo._id !== todoId));
      // No need to update optimistic state here as it's already done and real state matches
    } catch (error) {
      console.error('Error archiving todo:', error);
      setTodos(originalTodos); // Revert real state
      startTransition(() => {
        updateOptimisticTodos({ type: 'SET', todos: originalTodos }); // Revert optimistic state
      });
    } finally {
      setPendingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(todoId);
        return newSet;
      });
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    form.reset({ title: todo.title, description: todo.description });
    setDialogOpen(true);
  };

  const saveEdit = async (values: z.infer<typeof formSchema>) => {
    if (!editingTodo) return;

    const currentActivityId = editingTodo.activityId;
    if (!currentActivityId) {
      console.error("Activity ID is missing from the todo being edited.");
      form.setError("root", { type: "manual", message: "Cannot save task: Activity association is missing." });
      return;
    }

    const updatedTodoPayload = {
      ...commonTodoFields(values, currentActivityId),
      // Retain fields not in form but part of Todo, like isCompleted, createdAt
      isCompleted: editingTodo.isCompleted,
      createdAt: editingTodo.createdAt,
    };

    const optimisticUpdatedTodo: Todo = {
      ...editingTodo,
      ...updatedTodoPayload,
      updatedAt: new Date().toISOString(),
    };

    startTransition(() => {
      updateOptimisticTodos({ type: 'UPDATE', todo: optimisticUpdatedTodo });
    });

    setPendingActions(prev => new Set([...prev, editingTodo._id]));

    try {
      const response = await fetch(`/api/todos/${editingTodo._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTodoPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to save todo');
      }

      const { todo: savedTodo } = await response.json();
      setTodos(prevTodos => prevTodos.map(t => t._id === savedTodo._id ? savedTodo : t));
      startTransition(() => {
        updateOptimisticTodos({ type: 'SET', todos: todos.map(t => t._id === savedTodo._id ? savedTodo : t) });
      });
      setDialogOpen(false);
      setEditingTodo(null);
    } catch (error) {
      console.error('Error saving todo:', error);
      startTransition(() => {
        updateOptimisticTodos({ type: 'SET', todos }); // Revert
      });
    } finally {
      if (editingTodo) { // ensure editingTodo is not null
        setPendingActions(prev => {
          const newSet = new Set(prev);
          newSet.delete(editingTodo._id);
          return newSet;
        });
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (editingTodo) {
      await saveEdit(values);
    } else {
      await addTodo(values);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading tasks...</p></div>;
  }

  // Filter todos to display: if activityId is provided, show only those todos.
  // Otherwise (general task page), show all todos fetched for the user.
  const todosToDisplay = activityId
    ? optimisticTodos.filter(todo => todo.activityId === activityId)
    : optimisticTodos;

  return (
    <div className={`p-4 ${isModal ? '' : 'max-w-4xl mx-auto'}`}>
      {!isModal && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <Button onClick={() => {
            if (!activityId && !isModal) {
              alert("To add a new task here, please ensure an activity context is available or use the 'Add Task' button within a specific activity.");
              return;
            }
            setEditingTodo(null);
            form.reset({ title: '', description: '' });
            setDialogOpen(true);
          }}>Add New Task</Button>
        </div>
      )}

      {todosToDisplay.length === 0 && !isModal && (
        <p className="text-center text-gray-500">No tasks found. Add some to get started!</p>
      )}
      {isModal && todosToDisplay.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-4">No tasks for this activity yet.</p>
      )}

      <div className="space-y-4">
        {todosToDisplay.map((todo, index) => (
          <Card key={`${todo._id}-${index}`} className={`transition-all duration-300 ease-in-out ${pendingActions.has(todo._id) ? 'opacity-50' : 'opacity-100'} ${todo.isCompleted ? 'bg-green-50 dark:bg-green-900/30' : 'bg-white dark:bg-slate-900'}`}>
            <CardContent className="p-4 flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={`todo-${todo._id}`}
                  checked={todo.isCompleted}
                  onCheckedChange={() => toggleTodo(todo)}
                  className="mt-1"
                  aria-label={`Mark ${todo.title} as ${todo.isCompleted ? 'incomplete' : 'complete'}`}
                />
                <div className="flex-1">
                  <label htmlFor={`todo-${todo._id}`} className={`font-medium cursor-pointer ${todo.isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                    {todo.title}
                  </label>
                  {todo.description && (
                    <p className={`text-sm ${todo.isCompleted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                      {todo.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Created: {new Date(todo.createdAt || Date.now()).toLocaleDateString()}
                    {todo.isRepetitive && <Badge variant="outline" className="ml-2">Repetitive</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 items-center">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(todo)} aria-label="Edit task">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => archiveTodo(todo._id)} aria-label="Archive task">
                  <Archive className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTodo ? 'Edit Task' : 'Add New Task'}</DialogTitle>
            <DialogDescription>
              {editingTodo
                ? `Editing task: ${editingTodo.title}. Make your changes below.`
                : activityId
                  ? 'Adding a new task to the selected activity. Fill in the details below.'
                  : 'Please select an activity before adding a task. (This message indicates a potential configuration issue if no activity is selected.)'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
              {!activityId && !editingTodo && (
                <div className="text-sm text-red-600 dark:text-red-400 p-2 my-2 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/20">
                  <strong>Action Required:</strong> An activity must be associated with this task.
                  This form currently requires an activity to be pre-selected (e.g., by opening it from an activity's detail page).
                </div>
              )}
              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
              )}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Finish project report" {...field} />
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
              <Button type="submit" disabled={(!activityId && !editingTodo) || pendingActions.size > 0 || form.formState.isSubmitting}>
                {pendingActions.size > 0 || form.formState.isSubmitting ? 'Saving...' : (editingTodo ? 'Save Changes' : 'Add Task')}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
