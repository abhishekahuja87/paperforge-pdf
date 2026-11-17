import planners from '../../locales/packs/planners.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Printable calendars and planners: one maker for calendars, weekly and daily planners and the year page (the calendar and daily planner pages open the same maker on one kind, and every kind button is a link to its page). */
export const PLANNER_TOOLS: PackTool[] = [
  definePackTool({
    id: 'printable-planner-maker', kind: 'plannerMaker', guideKey: 'plannerMakerGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['printable planner', 'printable calendar', 'monthly calendar template', 'calendar maker', 'blank calendar', 'weekly planner printable', 'daily planner printable', 'hourly schedule template', 'time blocking template', 'planner maker', 'year at a glance', 'custom planner pdf', 'student planner printable'],
  }, planners.toolCatalog),
  definePackTool({
    id: 'printable-meal-planner', kind: 'mealPlanner', guideKey: 'mealPlannerGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['meal planner', 'printable meal planner', 'weekly meal planner printable', 'weekly menu planner', 'daily menu planner', 'monthly menu planner', 'meal plan template', 'weekly meal plan with grocery list', 'menu planner for family', 'school lunch menu planner', 'tiffin planner', 'dinner planner printable', 'food planner', 'what to cook this week'],
  }, planners.toolCatalog),
  definePackTool({
    id: 'printable-calendar-maker', kind: 'plannerCalendar', guideKey: 'calendarMakerGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['printable calendar', 'monthly calendar template', 'calendar maker', 'calendar pdf', 'print calendar any month', 'blank calendar', 'yearly calendar printable', '12 month calendar printable'],
  }, planners.toolCatalog),
  definePackTool({
    id: 'daily-planner-printable', kind: 'plannerDaily', guideKey: 'dailyPlannerGuide', category: 'everyday', icon: 'file-text', tier: 'more',
    keywords: ['daily planner printable', 'day planner template', 'hourly schedule template', 'to do list printable', 'daily schedule pdf', 'time blocking template'],
  }, planners.toolCatalog),
  definePackTool({
    id: 'daily-menu-planner-printable', kind: 'mealDaily', guideKey: 'dailyMenuGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['daily menu planner', 'daily meal planner printable', 'day menu template', 'dinner planner printable', 'lunch box planner', 'party menu planner', 'festival menu planner'],
  }, planners.toolCatalog),
  definePackTool({
    id: 'monthly-menu-planner-printable', kind: 'mealMonthly', guideKey: 'monthlyMenuGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['monthly menu planner', 'monthly meal planner printable', 'month meal plan template', 'school menu calendar', 'hostel mess menu template', 'canteen menu calendar', 'meal plan calendar'],
  }, planners.toolCatalog),
];
