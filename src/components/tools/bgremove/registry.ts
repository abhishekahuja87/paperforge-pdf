import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const BGREMOVE_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  bgRemove: lazy(() => import('./BackgroundRemover')),
};
