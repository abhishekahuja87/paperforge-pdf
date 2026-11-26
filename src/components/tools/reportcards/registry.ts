import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const REPORTCARDS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  reportCards: lazy(() => import('./ReportCardMaker')),
};
