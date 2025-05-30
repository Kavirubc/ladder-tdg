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
import { Badge } from '@/components/ui/badge'; // Added Badge import

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
  habitId?: string; // Added habitId
}

// Habit interface
interface Habit {
  _id: string;
  title: string;
  // Add other habit fields as necessary
}

// Optimistic action types
type OptimisticAction =
  | { type: 'ADD'; todo: Todo }
  | { type: 'UPDATE'; todo: Todo }
  | { type: 'DELETE'; id: string }
  | { type: 'SET'; todos: Todo[] };

interface TodoComponentProps {
  userId: string;
  habitId?: string; // habitId is now optional here, will be passed if opened from HabitTracker
  isModal?: boolean; // To conditionally render parts of the UI
}

export default function TodoComponent({ userId, habitId, isModal }: TodoComponentProps) { // Destructure habitId and isModal
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [habits, setHabits] = useState<Habit[]>([]); // Added state for habits

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

  // Fetch todos and habits
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch only todos if habitId is provided (modal context), otherwise fetch all todos and habits
        const todosResponse = await fetch(habitId ? `/api/todos?habitId=${habitId}` : `/api/todos`);

        if (!todosResponse.ok) {
          throw new Error('Failed to fetch todos');
        }
        const todosData = await todosResponse.json();
        const fetchedTodos = Array.isArray(todosData.todos) ? todosData.todos : [];
        startTransition(() => {
          updateOptimisticTodos({ type: 'SET', todos: fetchedTodos });
          setTodos(fetchedTodos);
        });

        // Only fetch all habits if not in modal mode (or if needed for general view)
        if (!isModal) {
          const habitsResponse = await fetch(`/api/habits`);
          if (!habitsResponse.ok) {
            throw new Error('Failed to fetch habits');
          }
          const habitsData = await habitsResponse.json();
          setHabits(Array.isArray(habitsData) ? habitsData : []);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        // Optionally, set an error state here to display to the user
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId]);

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

  // Handle form submission (add/edit todo)
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { title, description } = values;
    // Use passed habitId if in modal, otherwise get from select (if select is still shown)
    const currentHabitId = habitId || (document.getElementById('habitId') as HTMLSelectElement)?.value || undefined;

    if (!currentHabitId) {
      // Handle error: habitId is required
      // This could be a form error message
      form.setError("root", { type: "manual", message: "A habit must be selected or provided." });
      console.error("Habit ID is required to create or update a task.");
      return; // Prevent submission
    }

    if (editingTodo) {
      // Edit existing todo
      const updatedTodo: Todo = { ...editingTodo, title, description };

      // Optimistically update the todo
      startTransition(() => {
        updateOptimisticTodos({ type: 'UPDATE', todo: updatedTodo });
      });

      setPendingActions(prev => new Set([...prev, editingTodo._id]));

      try {
        const response = await fetch(`/api/todos/${editingTodo._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, habitId: currentHabitId }), // Send habitId
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
    } else {
      // Add new todo
      const newTodoServer: Omit<Todo, '_id' | 'createdAt'> = {
        title,
        description,
        isCompleted: false,
        user: userId,
        habitId: currentHabitId, // Include habitId
      };

      // Optimistically add todo
      const optimisticTodo: Todo = {
        _id: 'temp-' + Date.now(),
        ...newTodoServer,
        createdAt: new Date().toISOString(),
      };

      // Optimistically add the new todo
      startTransition(() => {
        updateOptimisticTodos({ type: 'ADD', todo: optimisticTodo });
      });

      setPendingActions(prev => new Set([...prev, optimisticTodo._id]));

      try {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTodoServer),
        });

        if (!response.ok) {
          throw new Error('Failed to add todo');
        }

        const { todo: savedTodo } = await response.json();

        // Update both the real state and refresh optimistic state
        setTodos(prevTodos => [...prevTodos, savedTodo]);
        form.reset();
        setDialogOpen(false);
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
    }
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
    <Card className={`w-full ${isModal ? 'shadow-none border-none p-0' : 'max-w-4xl mx-auto shadow-lg'}`}>
      <CardContent className={`${isModal ? 'pt-0' : 'pt-6'}`}>
        {!isModal && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">My Tasks</h2>
            <Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Add Task
            </Button>
          </div>
        )}

        {/* Dialog for adding/editing todos */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{editingTodo ? 'Edit Task' : 'Add New Task'}</DialogTitle>
              <DialogDescription>
                {editingTodo ? 'Update the details of your task.' : 'Fill in the details to add a new task.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Finish project report" {...field} />
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
                        <Input placeholder="E.g., Include all sections and proofread" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Habit Selector - Conditionally render if not in modal or if needed */}
                {!habitId && !isModal && (
                  <FormItem>
                    <FormLabel>Link to Habit</FormLabel> {/* Changed label to be more direct as it is required */}
                    <FormControl>
                      <select
                        id="habitId"
                        defaultValue={editingTodo?.habitId || ""}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required // Make the select required if shown
                      >
                        <option value="" disabled>Select a Habit</option> {/* Added disabled default option */}
                        {habits.map((habit) => (
                          <option key={habit._id} value={habit._id}>
                            {habit.title}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                {form.formState.errors.root && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-lg text-muted-foreground">Loading tasks...</p>
          </div>
        ) : optimisticTodos.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-muted rounded-lg">
            <p className="text-lg text-muted-foreground">You have no tasks yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Add Task" to get started!</p>
          </div>
        ) : isModal ? (
          // Simple list view for modal mode (when opened from a specific habit)
          <ul className="space-y-3">
            {optimisticTodos.map((todo) => (
              <li
                key={todo._id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ease-in-out 
                            ${pendingActions.has(todo._id) ? 'opacity-50 cursor-not-allowed' : ''}
                            ${todo.isCompleted ? 'bg-muted/50 border-green-200 dark:border-green-700' : 'bg-card border-border'}`}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={`todo-${todo._id}`}
                    checked={todo.isCompleted}
                    onCheckedChange={() => toggleTodo(todo)}
                    className="mt-1 transform scale-110"
                    disabled={pendingActions.has(todo._id)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`todo-${todo._id}`}
                      className={`font-medium cursor-pointer ${todo.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                    >
                      {todo.title}
                    </label>
                    {todo.description && (
                      <p className={`text-sm mt-0.5 ${todo.isCompleted ? 'line-through text-muted-foreground/80' : 'text-muted-foreground'}`}>
                        {todo.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(todo)}
                    disabled={pendingActions.has(todo._id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTodo(todo._id)}
                    disabled={pendingActions.has(todo._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          // Grouped by habit view for the tasks page
          <div className="space-y-8">
            {habits.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No habits found. Create habits first to add tasks.</p>
              </div>
            ) : (
              habits.map(habit => {
                const habitTodos = optimisticTodos.filter(todo => todo.habitId === habit._id);
                const completedCount = habitTodos.filter(todo => todo.isCompleted).length;
                const totalCount = habitTodos.length;

                return (
                  <div key={habit._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{habit.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant={completedCount === totalCount && totalCount > 0 ? "default" : "outline"}>
                            {completedCount}/{totalCount} completed
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTodo(null);
                          form.reset({ title: '', description: '' });
                          // Set the habitId in the form before opening dialog
                          setTimeout(() => {
                            const selectElement = document.getElementById('habitId') as HTMLSelectElement;
                            if (selectElement) selectElement.value = habit._id;
                          }, 50);
                          setDialogOpen(true);
                        }}
                      >
                        Add Task
                      </Button>
                    </div>

                    {habitTodos.length > 0 ? (
                      <ul className="space-y-2">
                        {habitTodos.map((todo) => (
                          <li
                            key={todo._id}
                            className={`flex items-center justify-between p-3 rounded-lg bg-muted/30 transition-all duration-200 ease-in-out 
                                      ${pendingActions.has(todo._id) ? 'opacity-50 cursor-not-allowed' : ''}
                                      ${todo.isCompleted ? 'border-l-4 border-green-500' : 'border-l-4 border-transparent'}`}
                          >
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id={`todo-${todo._id}`}
                                checked={todo.isCompleted}
                                onCheckedChange={() => toggleTodo(todo)}
                                className="mt-1"
                                disabled={pendingActions.has(todo._id)}
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`todo-${todo._id}`}
                                  className={`font-medium cursor-pointer ${todo.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                                >
                                  {todo.title}
                                </label>
                                {todo.description && (
                                  <p className={`text-sm mt-0.5 ${todo.isCompleted ? 'line-through text-muted-foreground/80' : 'text-muted-foreground'}`}>
                                    {todo.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(todo)}
                                disabled={pendingActions.has(todo._id)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteTodo(todo._id)}
                                disabled={pendingActions.has(todo._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No tasks for this habit yet.</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
