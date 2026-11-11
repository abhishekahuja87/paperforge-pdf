import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const BIZCARD_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  visitingCardMaker: lazy(() => import('./VisitingCardMaker')),
};
