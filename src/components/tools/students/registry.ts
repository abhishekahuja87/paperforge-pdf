import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const STUDENTS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  gpa: lazy(() => import('./GpaCalculator').then((m) => ({ default: m.GpaCalculator }))),
  finalGrade: lazy(() => import('./FinalGradeCalculator').then((m) => ({ default: m.FinalGradeCalculator }))),
  citation: lazy(() => import('./CitationGenerator').then((m) => ({ default: m.CitationGenerator }))),
  studyPlanner: lazy(() => import('./StudyPlanner').then((m) => ({ default: m.StudyPlanner }))),
};
