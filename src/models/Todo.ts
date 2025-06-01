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
  // Allowing tasks without an activityId
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    // Note: not marking as required so that standalone tasks can be created
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  archivedAt: {
    type: Date,
  },
  isRepetitive: { // New field for repetitive tasks
    type: Boolean,
    default: false,
  },
  lastShown: { // New field to track when the task was last displayed
    type: Date,
    default: Date.now,
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
