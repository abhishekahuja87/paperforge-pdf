import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const FITNESS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  exerciseLibrary: lazy(() => import('./ExerciseLibrary')),
  workoutPlanner: lazy(() => import('./WorkoutPlanner')),
  weeklyWorkoutPlans: lazy(() => import('./WeeklyWorkoutPlans')),
  oneRepMax: lazy(() => import('./OneRepMax')),
  runningPace: lazy(() => import('./RunningPace')),
  workoutLog: lazy(() => import('./WorkoutLog')),
};
