import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const FITNESS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  exerciseLibrary: lazy(() => import('./ExerciseLibrary')),
};
