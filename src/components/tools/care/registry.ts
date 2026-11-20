import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const CARE_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  careMedicine: lazy(() => import('./variants').then((m) => ({ default: m.MedicinePage }))),
  careLog: lazy(() => import('./variants').then((m) => ({ default: m.HealthLogPage }))),
  careEmergency: lazy(() => import('./variants').then((m) => ({ default: m.EmergencyPage }))),
  careVisit: lazy(() => import('./variants').then((m) => ({ default: m.VisitPage }))),
  careCaregiver: lazy(() => import('./variants').then((m) => ({ default: m.CaregiverPage }))),
};
