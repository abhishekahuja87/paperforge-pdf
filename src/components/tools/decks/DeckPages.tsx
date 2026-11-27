import React from 'react';
import T from '../../../locales/packs/ppt.text.en.json';
import { DeckMaker } from './DeckMaker';
import type { DeckSpec } from './deckSpec';

const TOOLS = T.tools as unknown as Record<string, Omit<DeckSpec, 'id'> & { file: string }>;
const spec = (id: string, quiz = false): DeckSpec => { const t = TOOLS[id]!; return { id: t.file, starters: t.starters, agenda: t.agenda, answers: t.answers, quiz }; };

/** text-to-powerpoint-maker page. */
export const TextToPptPage: React.FC = () => <DeckMaker spec={spec('text-to-powerpoint-maker')} />;

/** pitch-deck-powerpoint-maker page. */
export const PitchDeckPage: React.FC = () => <DeckMaker spec={spec('pitch-deck-powerpoint-maker')} />;

/** business-proposal-powerpoint-maker page. */
export const ProposalPage: React.FC = () => <DeckMaker spec={spec('business-proposal-powerpoint-maker')} />;

/** lesson-powerpoint-maker page. */
export const LessonPage: React.FC = () => <DeckMaker spec={spec('lesson-powerpoint-maker')} />;

/** project-status-powerpoint-maker page. */
export const StatusPage: React.FC = () => <DeckMaker spec={spec('project-status-powerpoint-maker')} />;

/** school-project-powerpoint-maker page. */
export const SchoolProjectPage: React.FC = () => <DeckMaker spec={spec('school-project-powerpoint-maker')} />;

/** quiz-powerpoint-maker page. */
export const QuizPage: React.FC = () => <DeckMaker spec={spec('quiz-powerpoint-maker', true)} />;

/** event-programme-powerpoint-maker page. */
export const EventProgrammePage: React.FC = () => <DeckMaker spec={spec('event-programme-powerpoint-maker')} />;
