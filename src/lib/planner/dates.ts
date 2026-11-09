/** Small date helpers in UTC, so the result never depends on the visitor's time zone. */

export const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Weekday of the 1st of the month, 0 = Sunday. */
export const firstWeekday = (year: number, month: number): number => new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

export const parseIso = (iso: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * 86_400_000);

/** The first day of the week (as set by the week start) on or before the date. */
export const startOfWeek = (date: Date, weekStart: number): Date => addDays(date, -((date.getUTCDay() - weekStart + 7) % 7));

const formatter = (locale: string, options: Intl.DateTimeFormatOptions) => {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
  } catch {
    return new Intl.DateTimeFormat('en', { ...options, timeZone: 'UTC' });
  }
};

const cap = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

export const monthName = (year: number, month: number, locale: string): string => cap(formatter(locale, { month: 'long' }).format(new Date(Date.UTC(year, month - 1, 1))));
export const weekdayName = (weekday: number, locale: string, style: 'long' | 'short' | 'narrow'): string =>
  cap(formatter(locale, { weekday: style }).format(new Date(Date.UTC(2023, 0, 1 + weekday)))).replace(/\.$/, '');
export const shortDate = (date: Date, locale: string): string => formatter(locale, { day: 'numeric', month: 'short' }).format(date);
export const longDate = (date: Date, locale: string): string => cap(formatter(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date));
