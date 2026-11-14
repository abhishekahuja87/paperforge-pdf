import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const EXPLAINER_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  learnClock: lazy(() => import('./clock/LearnTheClock')),
  solarSystem: lazy(() => import('./SolarSystemExplorer')),
};
