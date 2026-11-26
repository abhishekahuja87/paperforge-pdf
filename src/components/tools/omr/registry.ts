import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const OMR_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  omrGrader: lazy(() => import('./OmrGrader')),
};
