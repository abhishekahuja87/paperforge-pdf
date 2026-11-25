import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const VIDEOCOMPRESS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  videoCompress: lazy(() => import('./VideoCompressor')),
  videoBlur: lazy(() => import('./VideoBlur')),
  subtitleBurn: lazy(() => import('./SubtitleBurner')),
};
