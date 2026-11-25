import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const REGIONMAP_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  regionMapVideo: lazy(() => import('./RegionMapVideoMaker')),
};
