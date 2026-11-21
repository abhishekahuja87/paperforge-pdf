import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const SCREENS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  screenInterval: lazy(() => import('./IntervalTimer')),
  screenYoga: lazy(() => import('./YogaDisplay')),
  screenExamHall: lazy(() => import('./ExamHall')),
  screenMenu: lazy(() => import('./MenuBoard')),
  screenToken: lazy(() => import('./QueueToken')),
  screenTimings: lazy(() => import('./TimingsBoard')),
  screenBee: lazy(() => import('./SpellingBee')),
  screenNotices: lazy(() => import('./NoticeBoard')),
};
