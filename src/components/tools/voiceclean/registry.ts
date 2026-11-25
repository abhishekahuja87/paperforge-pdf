import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const VOICECLEAN_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  voiceClean: lazy(() => import('./VoiceCleaner')),
};
