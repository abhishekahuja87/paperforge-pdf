import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const PLANNER_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  plannerMaker: lazy(() => import('./variants').then((m) => ({ default: m.PlannerPage }))),
  plannerCalendar: lazy(() => import('./variants').then((m) => ({ default: m.CalendarPage }))),
  plannerDaily: lazy(() => import('./variants').then((m) => ({ default: m.DailyPlannerPage }))),
};
