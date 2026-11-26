import reportcards from '../../locales/packs/reportcards.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Report Card and Rank List Maker (components/tools/reportcards, logic in src/lib/reportcards). Runs in the browser. */
export const REPORTCARDS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'report-card-and-rank-list-maker', kind: 'reportCards', guideKey: 'reportCardsGuide', category: 'everyday', icon: 'file-text', tier: 'popular',
    keywords: ['report card maker', 'report card generator from marks', 'class rank list generator', 'student marksheet maker pdf', 'progress report card for school', 'rank list from marks excel', 'report card pdf for each student', 'marks to report card online', 'school report card template free', 'grade and rank calculator for class', 'half yearly report card maker', 'rank list maker for teachers'],
  }, reportcards.toolCatalog),
];
