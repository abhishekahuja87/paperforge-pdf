import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const PHOTOSTORY_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  photoStory: lazy(() => import('./PhotoStoryMaker')),
};
