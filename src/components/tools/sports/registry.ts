import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const SPORTS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  courtGuide: lazy(() => import('./CourtGuide')),
};
