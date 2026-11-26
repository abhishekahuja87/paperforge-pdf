import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const LETTERS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  bulkLetters: lazy(() => import('./BulkLetterMaker')),
};
