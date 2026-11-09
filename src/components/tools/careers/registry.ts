import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const CAREERS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  resume: lazy(() => import('./ResumeBuilder').then((m) => ({ default: m.ResumeBuilder }))),
  noticePeriod: lazy(() => import('./NoticePeriodCalculator').then((m) => ({ default: m.NoticePeriodCalculator }))),
  fileChecker: lazy(() => import('./UploadFileChecker').then((m) => ({ default: m.UploadFileChecker }))),
};
