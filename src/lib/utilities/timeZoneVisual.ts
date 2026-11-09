/** Data for the time zone pictures: a 24-hour strip per zone and the hands of an analog clock. */

export type HourKind = 'work' | 'awake' | 'night';

export interface HourCell {
  /** Hour of the day in that zone (0 to 23) at the middle of the cell. */
  hour: number;
  kind: HourKind;
}

const HOUR_MS = 3600000;
export const STRIP_HOURS = 24;

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

/** 24 one-hour cells that start 12 hours before the instant, so the chosen moment is in the middle of the strip. */
export function hourStrip(instant: Date, zone: string): HourCell[] {
  const start = instant.getTime() - (STRIP_HOURS / 2) * HOUR_MS;
  return Array.from({ length: STRIP_HOURS }, (_, index) => {
    const middle = new Date(start + index * HOUR_MS + HOUR_MS / 2);
    const hour = localParts(middle, zone)?.hour ?? 0;
    return { hour, kind: kindOfHour(hour) };
  });
}

/** Positions in the strip where every zone is in working hours. */
export function overlapCells(strips: HourCell[][]): number[] {
  if (strips.length < 2) return [];
  return strips[0].map((_, index) => index).filter((index) => strips.every((strip) => strip[index].kind === 'work'));
}

/** Angles in degrees (0 = 12 o'clock, clockwise) of the hour and minute hands. */
export const handAngles = (hour: number, minute: number) => ({ hour: ((hour % 12) + minute / 60) * 30, minute: minute * 6 });
