import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const PLANNER_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  plannerMaker: lazy(() => import('./variants').then((m) => ({ default: m.PlannerPage }))),
  plannerCalendar: lazy(() => import('./variants').then((m) => ({ default: m.CalendarPage }))),
  plannerDaily: lazy(() => import('./variants').then((m) => ({ default: m.DailyPlannerPage }))),
  mealPlanner: lazy(() => import('./mealVariants').then((m) => ({ default: m.WeeklyMenuPage }))),
  mealDaily: lazy(() => import('./mealVariants').then((m) => ({ default: m.DailyMenuPage }))),
  mealMonthly: lazy(() => import('./mealVariants').then((m) => ({ default: m.MonthlyMenuPage }))),
};
