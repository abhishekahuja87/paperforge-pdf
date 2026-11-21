import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const SAFESHARE_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  redactPdf: lazy(() => import('./RedactPdf')),
  comparePdf: lazy(() => import('./ComparePdf')),
  photoPrivacy: lazy(() => import('./PhotoPrivacy')),
};
