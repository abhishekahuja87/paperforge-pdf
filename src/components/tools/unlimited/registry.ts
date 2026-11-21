import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const UNLIMITED_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  makeFillable: lazy(() => import('./MakePdfFillable')),
  smartSplit: lazy(() => import('./SmartSplitPdf')),
  bulkImages: lazy(() => import('./BulkImageTools')),
  batesNumber: lazy(() => import('./BatesNumberPdf')),
  socialSizes: lazy(() => import('./SocialImageSizes')),
  gifMaker: lazy(() => import('./GifMaker')),
};
