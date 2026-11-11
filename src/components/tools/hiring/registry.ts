import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const HIRING_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  jobDescriptionBuilder: lazy(() => import('./JobDescriptionBuilder')),
};
