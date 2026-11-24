import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const GLOBE_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  globeVideo: lazy(() => import('./GlobeVideoMaker')),
};
