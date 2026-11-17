import planners from '../../locales/packs/planners.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Printable calendars and planners: one maker for calendars, weekly and daily planners and the year page (the separate calendar and daily pages were the same tool, so they redirect in `App.tsx`). */
export const PLANNER_TOOLS: PackTool[] = [
  definePackTool({
    id: 'printable-planner-maker', kind: 'plannerMaker', guideKey: 'plannerMakerGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['printable planner', 'printable calendar', 'monthly calendar template', 'calendar maker', 'blank calendar', 'weekly planner printable', 'daily planner printable', 'hourly schedule template', 'time blocking template', 'planner maker', 'year at a glance', 'custom planner pdf', 'student planner printable'],
  }, planners.toolCatalog),
];
