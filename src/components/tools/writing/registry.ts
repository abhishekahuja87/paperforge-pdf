import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const WRITING_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  writingVideo: lazy(() => import('./HandwritingVideoMaker')),
};
