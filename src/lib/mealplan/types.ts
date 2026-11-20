import type { FontId } from '../paper/geometry';
import type { ThemeId } from '../records/theme';
import type { PageSizeId, ToneId, Weight } from '../paper/types';

export type MealKind = 'week' | 'day' | 'month';

export interface MealSettings {
  kind: MealKind;
  page: PageSizeId;
  landscape: boolean;
  margin: number;
  tone: ToneId;
  /** Optional colour theme and typeface; without them the ink tone and sans are used. */
  theme?: ThemeId;
  font?: FontId;
  weight: Weight;
  /** 0 = Sunday, 1 = Monday, 6 = Saturday. */
  weekStart: 0 | 1 | 6;
  year: number;
  /** 1 to 12. */
  month: number;
  /** First day for weekly and daily plans, YYYY-MM-DD. */
  startDate: string;
  /** How many weeks, days or months to make. */
  count: number;
  /** A line to print at the top of each page, such as "Our family menu". */
  title: string;
  /** The meals to print, in order. */
  meals: string[];
  shopping: boolean;
  notes: boolean;
  /** Dishes typed in, by weekday (0 = Sunday) and then by meal name. The same menu repeats every week. */
  dishes: Record<string, Record<string, string>>;
}

export const MEAL_CHOICES = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Dessert'] as const;

export const KINDS: { id: MealKind; label: string; hint: string }[] = [
  { id: 'week', label: 'Weekly menu', hint: 'Seven days, meals across' },
  { id: 'day', label: 'Daily menu', hint: 'One day, a block per meal' },
  { id: 'month', label: 'Monthly menu', hint: 'A calendar with room for each day' },
];

export const MAX_COUNT: Record<MealKind, number> = { week: 53, day: 62, month: 12 };
export const MAX_DISH = 40;

export const defaultMeal = (now: Date = new Date()): MealSettings => ({
  kind: 'week',
  page: 'a4',
  landscape: true,
  margin: 10,
  tone: 'gray',
  weight: 'normal',
  weekStart: 1,
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  count: 1,
  title: '',
  meals: ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
  shopping: true,
  notes: false,
  dishes: {},
});
