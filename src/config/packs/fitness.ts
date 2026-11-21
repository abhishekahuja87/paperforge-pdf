import fitness from '../../locales/packs/fitness.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Fitness and exercise. Each tool runs in the browser and nothing is uploaded. */
export const FITNESS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'exercise-library', kind: 'exerciseLibrary', guideKey: 'fitnessExerciseLibrary', category: 'everyday', icon: 'dumbbell', tier: 'popular',
    keywords: ['exercise library', 'gym exercises', 'workout exercises with pictures', 'exercises with gif', 'chest exercises', 'back exercises', 'leg exercises', 'shoulder exercises', 'arm exercises', 'abs exercises', 'home workout no equipment', 'bodyweight exercises', 'dumbbell exercises', 'stretching exercises', 'cardio exercises'],
  }, fitness.toolCatalog),
  definePackTool({
    id: 'workout-planner', kind: 'workoutPlanner', guideKey: 'fitnessWorkoutPlanner', category: 'everyday', icon: 'dumbbell', tier: 'popular',
    keywords: ['workout planner', 'daily workout plan', 'gym workout display', 'gym slideshow', 'workout slideshow for gym tv', 'workout timer with exercises', 'push pull legs plan', 'mix day workout', 'home workout plan no equipment', 'workout schedule maker', 'exercise timer with pictures', 'gym class display screen'],
  }, fitness.toolCatalog),
];
