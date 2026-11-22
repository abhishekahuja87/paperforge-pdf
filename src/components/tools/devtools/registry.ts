import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const DEVTOOLS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  devJsonToCsv: lazy(() => import('./JsonToCsv')),
  devJsonViewer: lazy(() => import('./JsonViewer')),
};
