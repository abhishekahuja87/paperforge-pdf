import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const CAPTIONS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  tapCaptions: lazy(() => import('./TapCaptions')),
};
