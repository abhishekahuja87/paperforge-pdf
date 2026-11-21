import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const CLASSROOM_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  classroomQuiz: lazy(() => import('./QuizMaker')),
};
