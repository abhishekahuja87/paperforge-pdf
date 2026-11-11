import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const EXPLAINER_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  solarSystem: lazy(() => import('./SolarSystemExplorer')),
};
