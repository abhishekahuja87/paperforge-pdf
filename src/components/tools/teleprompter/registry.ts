import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const TELEPROMPTER_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  teleprompter: lazy(() => import('./Teleprompter')),
};
