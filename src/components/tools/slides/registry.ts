import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const SLIDES_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  slidesVideo: lazy(() => import('./ExplainerVideoMaker')),
};
