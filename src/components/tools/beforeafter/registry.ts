import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const BEFOREAFTER_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  beforeAfter: lazy(() => import('./BeforeAfterMaker')),
};
