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
import { Pencil, Trash2 } from 'lucide-react';

// Form schema validation
const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
});

// Todo interface
interface Todo {
  _id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  user: string;
}

// Optimistic action types
type OptimisticAction =
  | { type: 'ADD'; todo: Todo }
  | { type: 'UPDATE'; todo: Todo }
  | { type: 'DELETE'; id: string }
  | { type: 'SET'; todos: Todo[] };

interface TodoComponentProps {
  userId: string;
}

export default function TodoComponent({ userId }: TodoComponentProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

  // Optimistic UI updates with proper reducer
  const [optimisticTodos, updateOptimisticTodos] = useOptimistic<Todo[], OptimisticAction>(
    todos,
    (state, action) => {
      switch (action.type) {
        case 'SET':
          return action.todos;
        case 'ADD':
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

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Fetch todos
  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/todos`);

      if (!response.ok) {
        throw new Error('Failed to fetch todos');
      }

      const data = await response.json();
      setTodos(data.todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  // Add new todo
  const addTodo = async (values: z.infer<typeof formSchema>) => {
    const optimisticTodo: Todo = {
      _id: 'temp-' + Date.now(),
      ...values,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      user: userId,
    };

    // Optimistically add the new todo
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
        body: JSON.stringify({ ...values }),
      });

      if (!response.ok) {
        throw new Error('Failed to add todo');
      }

      const { todo: savedTodo } = await response.json();

      // Update both the real state and refresh optimistic state
      setTodos(prevTodos => [...prevTodos, savedTodo]);
      form.reset();
    } catch (error) {
      console.error('Error adding todo:', error);
      // Revert optimistic update by refreshing from real state
      startTransition(() => {
        updateOptimisticTodos({ type: 'SET', todos });
      });
    } finally {
      setPendingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(optimisticTodo._id);
        return newSet;
      });
    }
  };

  // Toggle todo completion
  const toggleTodo = async (todoToToggle: Todo) => {
    const updatedTodo = { ...todoToToggle, isCompleted: !todoToToggle.isCompleted };

    // Optimistically update the todo
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
      // Update the real state
      setTodos(prevTodos => prevTodos.map(t => t._id === savedTodo._id ? savedTodo : t));
    } catch (error) {
      console.error('Error updating todo:', error);
      // Revert optimistic update
      startTransition(() => {
        updateOptimisticTodos({ type: 'SET', todos });
      });
    } finally {
      setPendingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(todoToToggle._id);
        return newSet;
      });
    }
  };

  // Delete todo
  const deleteTodo = async (todoId: string) => {
    // Optimistically remove the todo
    startTransition(() => {
      updateOptimisticTodos({ type: 'DELETE', id: todoId });
    });

    setPendingActions(prev => new Set([...prev, todoId]));

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }

      // Update the real state
      setTodos(prevTodos => prevTodos.filter(todo => todo._id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
      // Revert optimistic update
      startTransition(() => {
        updateOptimisticTodos({ type: 'SET', todos });
      });
    } finally {
      setPendingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(todoId);
        return newSet;
      });
    }
  };

  // Edit todo
  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    form.reset({ title: todo.title, description: todo.description });
    setDialogOpen(true);
  };

  // Save edited todo
  const saveEdit = async (values: z.infer<typeof formSchema>) => {
    if (!editingTodo) return;

    const updatedTodo: Todo = { ...editingTodo, ...values };

    // Optimistically update the todo
    startTransition(() => {
      updateOptimisticTodos({ type: 'UPDATE', todo: updatedTodo });
    });

    setPendingActions(prev => new Set([...prev, editingTodo._id]));

    try {
      const response = await fetch(`/api/todos/${editingTodo._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: values.title, description: values.description }),
      });

      if (!response.ok) {
        throw new Error('Failed to save todo');
      }

      const { todo: savedTodo } = await response.json();
      setTodos(prevTodos => prevTodos.map(t => t._id === savedTodo._id ? savedTodo : t));
      setDialogOpen(false);
      setEditingTodo(null);
    } catch (error) {
      console.error('Error saving todo:', error);
      // Revert optimistic update
      startTransition(() => {
        updateOptimisticTodos({ type: 'SET', todos });
      });
    } finally {
      setPendingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(editingTodo._id);
        return newSet;
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (editingTodo) {
      await saveEdit(values);
    } else {
      await addTodo(values);
    }
    setDialogOpen(false); // Close dialog on submit
  };

  const openAddDialog = () => {
    setEditingTodo(null);
    form.reset({ title: '', description: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (todo: Todo) => {
    handleEdit(todo);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">My Tasks</h2>
          <Button onClick={openAddDialog}>Add New Task</Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-10">Loading tasks...</div>
        ) : optimisticTodos.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No tasks yet. Click &quot;Add New Task&quot; to get started.
          </div>
        ) : (
          <div className="grid gap-4">
            {optimisticTodos.map((todo) => {
              const isPending = pendingActions.has(todo._id);
              const isOptimistic = todo._id.startsWith('temp-');

              return (
                <Card
                  key={todo._id}
                  className={`${todo.isCompleted ? 'opacity-70' : ''} ${isPending || isOptimistic ? 'opacity-60 animate-pulse' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={todo.isCompleted}
                          onCheckedChange={() => toggleTodo(todo)}
                          id={`todo-${todo._id}`}
                          disabled={isPending}
                        />
                        <div className="flex-1">
                          <h3 className={`font-medium ${todo.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {todo.title}
                            {isOptimistic && <span className="ml-2 text-xs text-blue-500">(syncing...)</span>}
                          </h3>
                          {todo.description && (
                            <p className={`mt-1 text-sm ${todo.isCompleted ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                              {todo.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(todo.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(todo)}
                          disabled={isPending || isOptimistic}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTodo(todo._id)}
                          disabled={isPending || isOptimistic}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTodo ? 'Edit Task' : 'Add New Task'}</DialogTitle>
              <DialogDescription>
                {editingTodo
                  ? 'Update your task details below'
                  : 'Enter the details of your new task'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Task title" {...field} />
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
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Task description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTodo ? 'Update Task' : 'Add Task'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
