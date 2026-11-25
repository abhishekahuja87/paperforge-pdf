import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const SEQUENCE_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  sequenceVideo: lazy(() => import('./SequenceVideoMaker')),
};
