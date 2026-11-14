import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const EXPLAINER_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  kidsMaths: lazy(() => import('./maths/KidsMathsPractice')),
  learnClock: lazy(() => import('./clock/LearnTheClock')),
  solarSystem: lazy(() => import('./SolarSystemExplorer')),
};
