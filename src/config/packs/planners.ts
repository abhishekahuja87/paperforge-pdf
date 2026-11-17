import planners from '../../locales/packs/planners.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Printable calendars and planners: one maker for calendars, weekly and daily planners and the year page (the separate calendar and daily pages were the same tool and were removed). */
export const PLANNER_TOOLS: PackTool[] = [
  definePackTool({
    id: 'printable-planner-maker', kind: 'plannerMaker', guideKey: 'plannerMakerGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['printable planner', 'printable calendar', 'monthly calendar template', 'calendar maker', 'blank calendar', 'weekly planner printable', 'daily planner printable', 'hourly schedule template', 'time blocking template', 'planner maker', 'year at a glance', 'custom planner pdf', 'student planner printable'],
  }, planners.toolCatalog),
  definePackTool({
    id: 'printable-meal-planner', kind: 'mealPlanner', guideKey: 'mealPlannerGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['meal planner', 'printable meal planner', 'weekly meal planner printable', 'weekly menu planner', 'daily menu planner', 'monthly menu planner', 'meal plan template', 'weekly meal plan with grocery list', 'menu planner for family', 'school lunch menu planner', 'tiffin planner', 'dinner planner printable', 'food planner', 'what to cook this week'],
  }, planners.toolCatalog),
];
