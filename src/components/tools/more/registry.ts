import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const MORE_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  resizePdf: lazy(() => import('./ResizePdfPageSize')),
  bookletMaker: lazy(() => import('./BookletMaker')),
  grayscalePdf: lazy(() => import('./GrayscalePdf')),
  extractPdfImages: lazy(() => import('./ExtractPdfImages')),
  audioCutter: lazy(() => import('./AudioCutter')),
};
