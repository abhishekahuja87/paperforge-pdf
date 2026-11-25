import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const APPDEMO_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  appDemo: lazy(() => import('./AppDemoMaker')),
};
