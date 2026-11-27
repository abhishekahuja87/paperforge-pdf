import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const DECKS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  pptTextToPpt: lazy(() => import('./DeckPages').then((m) => ({ default: m.TextToPptPage }))),
  pptPitchDeck: lazy(() => import('./DeckPages').then((m) => ({ default: m.PitchDeckPage }))),
  pptProposal: lazy(() => import('./DeckPages').then((m) => ({ default: m.ProposalPage }))),
  pptLesson: lazy(() => import('./DeckPages').then((m) => ({ default: m.LessonPage }))),
  pptStatus: lazy(() => import('./DeckPages').then((m) => ({ default: m.StatusPage }))),
  pptSchoolProject: lazy(() => import('./DeckPages').then((m) => ({ default: m.SchoolProjectPage }))),
  pptQuiz: lazy(() => import('./DeckPages').then((m) => ({ default: m.QuizPage }))),
  pptEventProgramme: lazy(() => import('./DeckPages').then((m) => ({ default: m.EventProgrammePage }))),
};
