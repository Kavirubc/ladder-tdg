import mongoose, { Document, Schema, Types } from 'mongoose';
import { IActivity, ActivityModel } from '../models/Activity';
import { IActivityCompletion, ActivityCompletionModel } from '../models/ActivityCompletion';
import { ITodo, TodoModel } from '../models/Todo';
import { ActivityIntensity, ActivityCategory, ActivityFrequency } from '../types/activity';

// --- Configuration ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017'; // Replace with your MongoDB URI
const DATABASE_NAME = process.env.DATABASE_NAME || 'your_database_name'; // Replace with your database name
const FULL_MONGO_URI = `${MONGO_URI}/${DATABASE_NAME}`;

// --- Interfaces for old data structures (based on inferred structure) ---
interface OldGoal {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    title: string;
    description?: string;
    category?: string;
    intensity?: string;
    deadline?: Date;
    points?: number;
    createdAt: Date;
    updatedAt: Date;
    // Add any other fields that were present in your Goal model
}

interface OldHabit {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    title: string;
    description?: string;
    category?: string;
    intensity?: string;
    frequency?: string; // e.g., 'Daily', 'Weekly'
    pointsPerCompletion?: number;
    createdAt: Date;
    updatedAt: Date;
    // Add any other fields that were present in your Habit model
}

interface OldGoalCompletion {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    goalId: Types.ObjectId;
    date: Date;
    notes?: string;
    pointsEarned?: number;
    createdAt: Date;
    updatedAt: Date;
}

interface OldHabitCompletion {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    habitId: Types.ObjectId;
    date: Date;
    notes?: string;
    pointsEarned?: number;
    createdAt: Date;
    updatedAt: Date;
}

// Helper to get enum key from value, or return a default/handle error
function getEnumFromString<T extends object>(enumObj: T, value?: string, defaultValue?: T[keyof T]): T[keyof T] | undefined {
    if (!value) return defaultValue;
    const enumKey = Object.keys(enumObj).find(key => (enumObj as any)[key] === value);
    return enumKey ? (enumObj as any)[enumKey] : defaultValue;
}


async function migrateData() {
    console.log('Starting data migration script...');
    console.log('IMPORTANT: Ensure you have backed up your database before proceeding.');

    try {
        await mongoose.connect(FULL_MONGO_URI);
        console.log('Successfully connected to MongoDB.');

        const db = mongoose.connection.db;

        const oldGoalIdToNewActivityId = new Map<string, Types.ObjectId>();
        const oldHabitIdToNewActivityId = new Map<string, Types.ObjectId>();

        // 1. Migrate Goals to Activities
        console.log('\n--- Migrating Goals to Activities ---');
        const goalsCollection = db.collection<OldGoal>('goals');
        const oldGoals = await goalsCollection.find().toArray();
        let goalsMigratedCount = 0;

        for (const goal of oldGoals) {
            try {
                const newActivityData: Partial<IActivity> = {
                    userId: goal.userId,
                    title: goal.title,
                    description: goal.description || '',
                    category: getEnumFromString(ActivityCategory, goal.category, ActivityCategory.Other) as ActivityCategory,
                    intensity: getEnumFromString(ActivityIntensity, goal.intensity, ActivityIntensity.Medium) as ActivityIntensity,
                    isRecurring: false,
                    deadline: goal.deadline,
                    points: goal.points || 0,
                    legacyGoalId: goal._id.toString(),
                    createdAt: goal.createdAt,
                    updatedAt: goal.updatedAt,
                };
                const newActivity = new ActivityModel(newActivityData);
                await newActivity.save();
                oldGoalIdToNewActivityId.set(goal._id.toString(), newActivity._id);
                goalsMigratedCount++;
            } catch (err) {
                console.error(`Error migrating goal ${goal._id.toString()}:`, err);
            }
        }
        console.log(`Migrated ${goalsMigratedCount}/${oldGoals.length} goals to activities.`);

        // 2. Migrate Habits to Activities
        console.log('\n--- Migrating Habits to Activities ---');
        const habitsCollection = db.collection<OldHabit>('habits');
        const oldHabits = await habitsCollection.find().toArray();
        let habitsMigratedCount = 0;

        for (const habit of oldHabits) {
            try {
                const newActivityData: Partial<IActivity> = {
                    userId: habit.userId,
                    title: habit.title,
                    description: habit.description || '',
                    category: getEnumFromString(ActivityCategory, habit.category, ActivityCategory.Other) as ActivityCategory,
                    intensity: getEnumFromString(ActivityIntensity, habit.intensity, ActivityIntensity.Medium) as ActivityIntensity,
                    isRecurring: true,
                    targetFrequency: getEnumFromString(ActivityFrequency, habit.frequency, ActivityFrequency.Daily) as ActivityFrequency,
                    points: habit.pointsPerCompletion || 0,
                    legacyHabitId: habit._id.toString(),
                    createdAt: habit.createdAt,
                    updatedAt: habit.updatedAt,
                };
                const newActivity = new ActivityModel(newActivityData);
                await newActivity.save();
                oldHabitIdToNewActivityId.set(habit._id.toString(), newActivity._id);
                habitsMigratedCount++;
            } catch (err) {
                console.error(`Error migrating habit ${habit._id.toString()}:`, err);
            }
        }
        console.log(`Migrated ${habitsMigratedCount}/${oldHabits.length} habits to activities.`);

        // 3. Migrate GoalCompletions to ActivityCompletions
        console.log('\n--- Migrating Goal Completions to Activity Completions ---');
        const goalCompletionsCollection = db.collection<OldGoalCompletion>('goalcompletions');
        const oldGoalCompletions = await goalCompletionsCollection.find().toArray();
        let goalCompletionsMigratedCount = 0;

        for (const gc of oldGoalCompletions) {
            try {
                const newActivityId = oldGoalIdToNewActivityId.get(gc.goalId.toString());
                if (newActivityId) {
                    const newActivityCompletionData: Partial<IActivityCompletion> = {
                        userId: gc.userId,
                        activityId: newActivityId,
                        date: gc.date,
                        notes: gc.notes || '',
                        pointsEarned: gc.pointsEarned || 0,
                        createdAt: gc.createdAt,
                        updatedAt: gc.updatedAt,
                    };
                    const newCompletion = new ActivityCompletionModel(newActivityCompletionData);
                    await newCompletion.save();
                    goalCompletionsMigratedCount++;
                } else {
                    console.warn(`Could not find new activity ID for old goal completion ${gc._id.toString()} (goalId: ${gc.goalId.toString()}). Skipping.`);
                }
            } catch (err) {
                console.error(`Error migrating goal completion ${gc._id.toString()}:`, err);
            }
        }
        console.log(`Migrated ${goalCompletionsMigratedCount}/${oldGoalCompletions.length} goal completions.`);


        // 4. Migrate HabitCompletions to ActivityCompletions
        console.log('\n--- Migrating Habit Completions to Activity Completions ---');
        const habitCompletionsCollection = db.collection<OldHabitCompletion>('habitcompletions');
        const oldHabitCompletions = await habitCompletionsCollection.find().toArray();
        let habitCompletionsMigratedCount = 0;

        for (const hc of oldHabitCompletions) {
            try {
                const newActivityId = oldHabitIdToNewActivityId.get(hc.habitId.toString());
                if (newActivityId) {
                    const newActivityCompletionData: Partial<IActivityCompletion> = {
                        userId: hc.userId,
                        activityId: newActivityId,
                        date: hc.date,
                        notes: hc.notes || '',
                        pointsEarned: hc.pointsEarned || 0,
                        createdAt: hc.createdAt,
                        updatedAt: hc.updatedAt,
                    };
                    const newCompletion = new ActivityCompletionModel(newActivityCompletionData);
                    await newCompletion.save();
                    habitCompletionsMigratedCount++;
                } else {
                    console.warn(`Could not find new activity ID for old habit completion ${hc._id.toString()} (habitId: ${hc.habitId.toString()}). Skipping.`);
                }
            } catch (err) {
                console.error(`Error migrating habit completion ${hc._id.toString()}:`, err);
            }
        }
        console.log(`Migrated ${habitCompletionsMigratedCount}/${oldHabitCompletions.length} habit completions.`);

        // 5. Update Todos to use activityId
        console.log('\n--- Updating Todos ---');
        // Fetch todos that have a goalId (assuming goalId was a string or ObjectId)
        // We need to cast goalId to string for map lookup if it's an ObjectId
        const todosToUpdate = await TodoModel.find({ goalId: { $exists: true, $ne: null } }).lean();
        let todosUpdatedCount = 0;
        let todosSkippedCount = 0;

        for (const todo of todosToUpdate) {
            if (!todo.goalId) continue; // Should be caught by query, but good practice

            const oldGoalIdStr = todo.goalId.toString();
            const newActivityId = oldGoalIdToNewActivityId.get(oldGoalIdStr);

            if (newActivityId) {
                try {
                    await TodoModel.updateOne(
                        { _id: todo._id },
                        { $set: { activityId: newActivityId }, $unset: { goalId: 1 } }
                    );
                    todosUpdatedCount++;
                } catch (err) {
                    console.error(`Error updating todo ${todo._id.toString()}:`, err);
                }
            } else {
                console.warn(`Could not find new activity ID for todo ${todo._id.toString()} (goalId: ${oldGoalIdStr}). Skipping update for this todo.`);
                todosSkippedCount++;
            }
        }
        console.log(`Updated ${todosUpdatedCount} todos. Skipped ${todosSkippedCount} todos due to missing activity mapping.`);


        console.log('\nMigration script finished successfully!');

    } catch (error) {
        console.error('\nAn error occurred during the migration process:', error);
        console.error('Please check the logs and your database state. If necessary, restore from backup and re-run the script after addressing any issues.');
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

// To run the script:
// 1. Ensure MongoDB is running.
// 2. Set MONGO_URI and DATABASE_NAME environment variables or update the constants in the script.
// 3. Compile and run:
//    tsc src/scripts/migrateData.ts --outDir dist/scripts
//    node dist/scripts/migrateData.js
//    OR using ts-node:
//    ts-node src/scripts/migrateData.ts
//
// Make sure your tsconfig.json allows for this, e.g.:
// {
//   "compilerOptions": {
//     "module": "commonjs",
//     "esModuleInterop": true,
//     "target": "es6",
//     "moduleResolution": "node",
//     "sourceMap": true,
//     "outDir": "dist",
//     "strict": true, // Recommended
//     "skipLibCheck": true // If you have issues with node_modules types
//   },
//   "include": ["src/**/*"],
//   "exclude": ["node_modules"]
// }

migrateData().catch(err => {
    console.error("Unhandled error executing migration script:", err);
    process.exit(1);
});
