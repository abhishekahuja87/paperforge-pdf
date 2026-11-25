import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const SCREENREC_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  screenRec: lazy(() => import('./ScreenRecorder')),
};
