const DAY_MS = 86_400_000;

/** Parses a yyyy-mm-dd value from a date input as a UTC date (no time zone surprises). */
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) || date.getUTCMonth() !== Number(match[2]) - 1 ? null : date;
}

export function todayInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export interface YearsMonthsDays { years: number; months: number; days: number }

/** Adds whole months, clamping to the last day of a shorter month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return target;
}

/** Whole years, months and days from `from` up to `to` (from must not be after to). */
export function diffYmd(from: Date, to: Date): YearsMonthsDays {
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + to.getUTCMonth() - from.getUTCMonth();
  if (addMonths(from, months).getTime() > to.getTime()) months -= 1;
  const days = Math.round((to.getTime() - addMonths(from, months).getTime()) / DAY_MS);
  return { years: Math.floor(months / 12), months: months % 12, days };
}

export function totalDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/** Next birthday on or after `asOf`. A 29 February birthday falls on 1 March in non-leap years. */
export function nextBirthday(birth: Date, asOf: Date): Date {
  const build = (year: number) => {
    const month = birth.getUTCMonth();
    const day = birth.getUTCDate();
    const candidate = new Date(Date.UTC(year, month, day));
    return candidate.getUTCMonth() === month ? candidate : new Date(Date.UTC(year, 2, 1));
  };
  const thisYear = build(asOf.getUTCFullYear());
  return thisYear.getTime() >= asOf.getTime() ? thisYear : build(asOf.getUTCFullYear() + 1);
}

/** Monday-to-Friday days between two dates, counting `from` and excluding `to`. */
export function weekdaysBetween(from: Date, to: Date): number {
  let count = 0;
  for (let time = from.getTime(); time < to.getTime(); time += DAY_MS) {
    const day = new Date(time).getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Western zodiac sign for a date of birth. */
export function zodiacSign(date: Date): string {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const edges: [number, number, string][] = [
    [1, 20, 'Capricorn'], [2, 19, 'Aquarius'], [3, 21, 'Pisces'], [4, 20, 'Aries'], [5, 21, 'Taurus'], [6, 21, 'Gemini'],
    [7, 23, 'Cancer'], [8, 23, 'Leo'], [9, 23, 'Virgo'], [10, 23, 'Libra'], [11, 22, 'Scorpio'], [12, 22, 'Sagittarius'],
  ];
  const [, cutoff, sign] = edges[month - 1];
  return day < cutoff ? sign : edges[month % 12][2];
}
