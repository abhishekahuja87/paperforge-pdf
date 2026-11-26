import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const BULKLETTERS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  bulkLetters: lazy(() => import('./BulkLetterMaker')),
};
