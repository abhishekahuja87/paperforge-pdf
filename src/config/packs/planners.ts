import planners from '../../locales/packs/planners.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Printable calendars and planners: one maker plus pages that open it on a single kind. */
export const PLANNER_TOOLS: PackTool[] = [
  definePackTool({
    id: 'printable-planner-maker', kind: 'plannerMaker', guideKey: 'plannerMakerGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['printable planner', 'weekly planner printable', 'planner maker', 'daily planner template', 'year at a glance', 'custom planner pdf', 'student planner printable'],
  }, planners.toolCatalog),
  definePackTool({
    id: 'printable-calendar-maker', kind: 'plannerCalendar', guideKey: 'calendarMakerGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['printable calendar', 'monthly calendar template', 'calendar maker', 'calendar pdf', 'print calendar any month', 'blank calendar', 'yearly calendar printable'],
  }, planners.toolCatalog),
  definePackTool({
    id: 'daily-planner-printable', kind: 'plannerDaily', guideKey: 'dailyPlannerGuide', category: 'everyday', icon: 'file-text', tier: 'more',
    keywords: ['daily planner printable', 'day planner template', 'hourly schedule template', 'to do list printable', 'daily schedule pdf', 'time blocking template'],
  }, planners.toolCatalog),
];
