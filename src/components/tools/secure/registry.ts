import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const SECURE_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  secureDocument: lazy(() => import('./variants').then((m) => ({ default: m.SecureDocumentPage }))),
  secureFile: lazy(() => import('./variants').then((m) => ({ default: m.SecureFilePage }))),
};
