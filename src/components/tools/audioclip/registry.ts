import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const AUDIOCLIP_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  audioClip: lazy(() => import('./AudioClipMaker')),
};
