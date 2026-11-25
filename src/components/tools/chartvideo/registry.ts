import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const CHARTVIDEO_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  chartVideo: lazy(() => import('./ChartVideoMaker')),
};
