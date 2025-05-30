import mongoose from 'mongoose';

// Todo schema definition
const TodoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  habitId: { // New field to link Todo to a Habit
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true, // Changed: A todo must be related to a specific habit
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Only create model if it doesn't exist (for Next.js hot reloading)
const Todo = mongoose.models.Todo || mongoose.model('Todo', TodoSchema);

export default Todo;
