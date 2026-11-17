import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const PLANNER_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  plannerMaker: lazy(() => import('./PlannerMaker')),
  mealPlanner: lazy(() => import('./MealPlanner')),
};
