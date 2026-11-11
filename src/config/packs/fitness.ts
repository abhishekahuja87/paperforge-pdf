import fitness from '../../locales/packs/fitness.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Fitness and exercise. Each tool runs in the browser and nothing is uploaded. */
export const FITNESS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'exercise-library', kind: 'exerciseLibrary', guideKey: 'fitnessExerciseLibrary', category: 'everyday', icon: 'dumbbell', tier: 'popular',
    keywords: ['exercise library', 'gym exercises', 'workout exercises with pictures', 'exercises with gif', 'chest exercises', 'back exercises', 'leg exercises', 'shoulder exercises', 'arm exercises', 'abs exercises', 'home workout no equipment', 'bodyweight exercises', 'dumbbell exercises', 'stretching exercises', 'cardio exercises'],
  }, fitness.toolCatalog),
];
