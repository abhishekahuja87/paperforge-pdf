import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const REVIEWSIGN_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  reviewSign: lazy(() => import('./ReviewSignMaker')),
};
