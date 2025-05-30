'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip } from '@/components/ui/tooltip';
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
}

export default function TodoComponent({ userId }: { userId: string }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const router = useRouter();

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
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to add todo');
      }

      fetchTodos();
      setDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  // Update todo
  const updateTodo = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!editingTodo) return;

      const response = await fetch(`/api/todos/${editingTodo._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      fetchTodos();
      setDialogOpen(false);
      setEditingTodo(null);
      form.reset();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  // Delete todo
  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }

      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Toggle todo completion
  const toggleTodoCompletion = async (id: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      fetchTodos();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  // Open edit dialog
  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    form.setValue('title', todo.title);
    form.setValue('description', todo.description || '');
    setDialogOpen(true);
  };

  // Open add dialog
  const openAddDialog = () => {
    setEditingTodo(null);
    form.reset();
    setDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingTodo) {
      updateTodo(values);
    } else {
      addTodo(values);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">My Tasks</h2>
        <Button onClick={openAddDialog}>Add New Task</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading tasks...</div>
      ) : todos.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No tasks yet. Click "Add New Task" to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {todos.map((todo) => (
            <Card key={todo._id} className={todo.isCompleted ? 'opacity-70' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={todo.isCompleted}
                      onCheckedChange={() => toggleTodoCompletion(todo._id, todo.isCompleted)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h3 className={`font-medium ${todo.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {todo.title}
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
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(todo)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
    </div>
  );
}
