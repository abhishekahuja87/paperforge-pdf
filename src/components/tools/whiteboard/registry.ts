import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const WHITEBOARD_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  whiteboardRec: lazy(() => import('./WhiteboardRecorder')),
};
