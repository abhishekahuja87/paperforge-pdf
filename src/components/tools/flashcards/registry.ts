import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const FLASHCARD_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  flashcards: lazy(() => import('./variants').then((m) => ({ default: m.FlashcardPage }))),
  flashcardsDuplex: lazy(() => import('./variants').then((m) => ({ default: m.DoubleSidedFlashcardPage }))),
};
