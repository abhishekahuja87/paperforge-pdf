import fitness from '../../locales/packs/fitness.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Fitness and exercise. Each tool runs in the browser and nothing is uploaded. */
export const FITNESS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'exercise-library', kind: 'exerciseLibrary', guideKey: 'fitnessExerciseLibrary', category: 'everyday', icon: 'dumbbell', tier: 'popular',
    keywords: ['exercise library', 'gym exercises', 'workout exercises with pictures', 'exercises with gif', 'chest exercises', 'back exercises', 'leg exercises', 'shoulder exercises', 'arm exercises', 'abs exercises', 'home workout no equipment', 'bodyweight exercises', 'dumbbell exercises', 'stretching exercises', 'cardio exercises', 'yoga poses', 'yoga poses with pictures', 'beginner yoga poses'],
  }, fitness.toolCatalog),
  definePackTool({
    id: 'workout-planner', kind: 'workoutPlanner', guideKey: 'fitnessWorkoutPlanner', category: 'everyday', icon: 'dumbbell', tier: 'popular',
    keywords: ['workout planner', 'daily workout plan', 'gym workout display', 'gym slideshow', 'workout slideshow for gym tv', 'workout timer with exercises', 'push pull legs plan', 'mix day workout', 'home workout plan no equipment', 'workout schedule maker', 'exercise timer with pictures', 'gym class display screen', '5 minute workout', '10 minute workout no equipment', '15 minute home workout', '20 minute workout', 'build a workout', 'yoga routine timer'],
  }, fitness.toolCatalog),
  definePackTool({
    id: 'weekly-workout-plans', kind: 'weeklyWorkoutPlans', guideKey: 'fitnessWeeklyPlans', category: 'everyday', icon: 'dumbbell', tier: 'popular',
    keywords: ['3 day workout plan', '4 day workout split', '5 day workout plan', 'weekly workout plan', 'full body workout plan', 'upper lower split', 'home workout plan', 'gym workout plan for beginners', 'weekly yoga plan', '3 day yoga routine', 'workout routine every muscle', 'fixed workout plan'],
  }, fitness.toolCatalog),
];
