import type { PageSizeId, ToneId, Weight } from '../paper/types';

export type PlannerKind = 'month' | 'week' | 'day' | 'year';

export interface PlannerSettings {
  kind: PlannerKind;
  page: PageSizeId;
  landscape: boolean;
  margin: number;
  tone: ToneId;
  weight: Weight;
  /** BCP 47 language for month and weekday names. Only Latin-script languages, which the PDF font can show. */
  locale: string;
  /** 0 = Sunday, 1 = Monday, 6 = Saturday. */
  weekStart: 0 | 1 | 6;
  year: number;
  /** 1 to 12. */
  month: number;
  /** First day for weekly and daily planners, YYYY-MM-DD. */
  startDate: string;
  /** How many months, weeks or days to make. */
  count: number;
  /** A line to print at the top of each page, such as a name or a project. */
  title: string;
  notes: boolean;
  hours: { from: number; to: number; step: 30 | 60 };
}

export const LOCALES: { id: string; label: string }[] = [
  { id: 'en', label: 'English' }, { id: 'es', label: 'Español' }, { id: 'fr', label: 'Français' }, { id: 'de', label: 'Deutsch' },
  { id: 'pt', label: 'Português' }, { id: 'it', label: 'Italiano' }, { id: 'nl', label: 'Nederlands' },
];

export const KINDS: { id: PlannerKind; label: string; hint: string }[] = [
  { id: 'month', label: 'Monthly calendar', hint: 'One month per page' },
  { id: 'week', label: 'Weekly planner', hint: 'A week per page' },
  { id: 'day', label: 'Daily planner', hint: 'Schedule, priorities, to-dos' },
  { id: 'year', label: 'Year at a glance', hint: 'All 12 months on one page' },
];

export const MAX_COUNT: Record<PlannerKind, number> = { month: 24, week: 53, day: 62, year: 1 };

export const defaultPlanner = (now: Date = new Date()): PlannerSettings => ({
  kind: 'month',
  page: 'a4',
  landscape: true,
  margin: 10,
  tone: 'gray',
  weight: 'normal',
  locale: 'en',
  weekStart: 1,
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  count: 1,
  title: '',
  notes: true,
  hours: { from: 7, to: 21, step: 60 },
});
