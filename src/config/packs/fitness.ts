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
  definePackTool({
    id: 'one-rep-max-and-plate-calculator', kind: 'oneRepMax', guideKey: 'fitnessOneRepMax', category: 'everyday', icon: 'calculator', tier: 'popular',
    keywords: ['one rep max calculator', '1rm calculator', 'estimate one rep max', 'epley formula calculator', 'brzycki formula', 'bench press max calculator', 'squat max calculator', 'plate calculator', 'barbell plate calculator', 'how many plates per side', 'weight percentage calculator for lifting', 'strength training percentages'],
  }, fitness.toolCatalog),
  definePackTool({
    id: 'running-pace-calculator', kind: 'runningPace', guideKey: 'fitnessRunningPace', category: 'everyday', icon: 'clock', tier: 'popular',
    keywords: ['running pace calculator', 'pace calculator', '5k pace chart', '10k pace calculator', 'half marathon pace calculator', 'marathon pace calculator', 'min per km to km h', 'min per mile calculator', 'race time predictor', 'running split times', 'treadmill pace converter', 'how fast is my run'],
  }, fitness.toolCatalog),
  definePackTool({
    id: 'workout-log', kind: 'workoutLog', guideKey: 'fitnessWorkoutLog', category: 'everyday', icon: 'file-text', tier: 'popular',
    keywords: ['workout log', 'gym log book', 'workout tracker', 'strength training log', 'exercise log online', 'progressive overload tracker', 'track sets and reps', 'free workout tracker no app', 'gym progress tracker', 'lifting log', 'personal record tracker', 'workout diary'],
  }, fitness.toolCatalog),
];
