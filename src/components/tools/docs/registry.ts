import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const DOCS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  sigMaker: lazy(() => import('./SignatureMaker')),
  signPdf: lazy(() => import('./SignPdf')),
  docScanner: lazy(() => import('./DocumentScanner')),
  passportPhoto: lazy(() => import('./PassportPhotoMaker')),
  gridSplitter: lazy(() => import('./PhotoGridSplitter')),
  collage: lazy(() => import('./PhotoCollageMaker')),
  santa: lazy(() => import('./SecretSantaDraw')),
  stampMaker: lazy(() => import('./StampMaker')),
};
