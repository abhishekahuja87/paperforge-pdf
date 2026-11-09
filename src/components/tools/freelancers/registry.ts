import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const FREELANCERS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  freelanceRate: lazy(() => import('./FreelanceRateCalculator').then((m) => ({ default: m.FreelanceRateCalculator }))),
  quotation: lazy(() => import('./QuotationGenerator').then((m) => ({ default: m.QuotationGenerator }))),
  margin: lazy(() => import('./MarginCalculator').then((m) => ({ default: m.MarginCalculator }))),
};
