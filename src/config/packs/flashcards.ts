import flashcards from '../../locales/packs/flashcards.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Printable flashcards, with front and back lined up for two-sided printing. One tool covers one-sided, two-sided and fold-over printing. */
export const FLASHCARD_TOOLS: PackTool[] = [
  definePackTool({
    id: 'printable-flashcard-maker', kind: 'flashcards', guideKey: 'flashcardGuide', category: 'everyday', icon: 'layers', tier: 'popular',
    keywords: ['flashcard maker', 'printable flashcards', 'flashcard generator', 'make flashcards pdf', 'vocabulary flashcards printable', 'flash cards template', 'study cards printable', 'double sided flashcards', 'print flashcards front and back', 'duplex flashcards', 'flashcards aligned front back', 'two sided flash cards printing', 'foldable flashcards'],
  }, flashcards.toolCatalog),
];
