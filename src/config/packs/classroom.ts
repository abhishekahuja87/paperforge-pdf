import classroom from '../../locales/packs/classroom.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Tools for showing lessons on a classroom screen. Each runs in the browser and nothing is uploaded. */
export const CLASSROOM_TOOLS: PackTool[] = [
  definePackTool({
    id: 'classroom-quiz-display', kind: 'classroomQuiz', guideKey: 'classroomQuizDisplay', category: 'everyday', icon: 'presentation', tier: 'popular',
    keywords: ['classroom quiz display', 'quiz maker for teachers', 'mcq quiz slideshow', 'exam timer for classroom', 'mock exam timer', 'quiz with answers and explanation', 'multiple choice quiz maker', 'quiz on projector', 'classroom quiz timer', 'mcq test display screen', 'practice test slideshow', 'quiz for smart board'],
  }, classroom.toolCatalog),
];
