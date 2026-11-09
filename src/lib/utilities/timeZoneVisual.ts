/** Data for the time zone pictures: a half-hour strip per zone, the cursor position and the hands of an analog clock. */

export type HourKind = 'work' | 'awake' | 'night';

export interface SlotCell {
  /** Local hour (0 to 23) and minute at the start of the half hour. */
  hour: number;
  minute: number;
  kind: HourKind;
}

const SLOT_MS = 1800000;
export const SLOTS = 48;

/** Working hours are 9 am to 6 pm, "awake" is 7 to 9 am and 6 to 10 pm, the rest is night. */
export function kindOfHour(hour: number): HourKind {
  if (hour >= 9 && hour < 18) return 'work';
  if ((hour >= 7 && hour < 9) || (hour >= 18 && hour < 22)) return 'awake';
  return 'night';
}

/** Hour (0 to 23) and minute in a zone at an instant, or null when the zone is not known. */
export function localParts(instant: Date, zone: string): { hour: number; minute: number } | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(instant);
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? NaN);
    const hour = get('hour');
    const minute = get('minute');
    return Number.isFinite(hour) && Number.isFinite(minute) ? { hour: hour % 24, minute } : null;
  } catch {
    return null;
  }
}

/** 48 half-hour cells that start at `start` (the midnight of the chosen day in the chosen zone). */
export function slotStrip(start: Date, zone: string): SlotCell[] {
  return Array.from({ length: SLOTS }, (_, index) => {
    const parts = localParts(new Date(start.getTime() + index * SLOT_MS), zone) ?? { hour: 0, minute: 0 };
    return { ...parts, kind: kindOfHour(parts.hour) };
  });
}

/** Positions in the strips where every zone is in working hours. */
export function overlapSlots(strips: SlotCell[][]): number[] {
  if (strips.length < 2) return [];
  return strips[0].map((_, index) => index).filter((index) => strips.every((strip) => strip[index].kind === 'work'));
}

/** Local calendar date (yyyy-mm-dd) of an instant in a zone, or '' when the zone is not known. */
export function localDate(instant: Date, zone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
  } catch {
    return '';
  }
}

const dayNumber = (date: string): number => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000 : NaN;
};

/** How many days the zone's local date is after (+1) or before (-1) the reference date. */
export function dayOffset(instant: Date, zone: string, reference: string): number {
  const diff = dayNumber(localDate(instant, zone)) - dayNumber(reference);
  return Number.isFinite(diff) ? diff : 0;
}

/** yyyy-mm-dd moved by a number of days. Returns the input when it is not a valid date. */
export function shiftDate(date: string, days: number): string {
  const day = dayNumber(date);
  if (!Number.isFinite(day)) return date;
  return new Date((day + days) * 86400000).toISOString().slice(0, 10);
}

/** Minutes after midnight for "HH:MM", or 0 when invalid. */
export function minutesOf(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  return match ? Math.min(Number(match[1]) * 60 + Number(match[2]), 1439) : 0;
}

export const timeOf = (minutes: number): string => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Angles in degrees (0 = 12 o'clock, clockwise) of the hour and minute hands. */
export const handAngles = (hour: number, minute: number) => ({ hour: ((hour % 12) + minute / 60) * 30, minute: minute * 6 });
