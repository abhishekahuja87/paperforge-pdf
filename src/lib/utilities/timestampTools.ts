export type EpochUnit = 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds';

export interface ParsedEpoch { date: Date; unit: EpochUnit }

/** Reads a Unix timestamp and guesses whether it is in seconds, milliseconds, microseconds or nanoseconds from its size. */
export function parseEpoch(input: string): ParsedEpoch | null {
  const text = input.trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  const negative = text.startsWith('-');
  const digits = text.replace('-', '').split('.')[0]!.replace(/^0+(?=\d)/, '');
  let unit: EpochUnit; let ms: number;
  const magnitude = digits.length;
  if (magnitude <= 11) { unit = 'seconds'; ms = Number(text) * 1000; }
  else if (magnitude <= 14) { unit = 'milliseconds'; ms = Number(text); }
  else if (magnitude <= 17) { unit = 'microseconds'; ms = Number(text) / 1000; }
  else {
    unit = 'nanoseconds';
    // Whole nanoseconds can be bigger than a normal number can hold exactly, so divide as big integers first.
    ms = /^-?\d+$/.test(text) ? Number(BigInt(text) / 1_000_000n) : Number(text) / 1e6;
  }
  if (negative && ms > 0) ms = -ms;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : { date, unit };
}

const pad = (value: number, size = 2) => String(value).padStart(size, '0');

function parts(date: Date, zone: string) {
  const map: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'long' }).formatToParts(date)) map[part.type] = part.value;
  return map;
}

/** "+05:30" style offset of a zone at an instant. */
export function zoneOffsetLabel(date: Date, zone: string): string {
  const p = parts(date, zone);
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  const minutes = Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** "2026-11-08 12:00:00 +05:30" in any zone. */
export function formatWithOffset(date: Date, zone: string): string {
  const p = parts(date, zone);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second} ${zoneOffsetLabel(date, zone)}`;
}

/** The same instant written as an RFC 2822 date, as used in email headers. */
export function toRfc2822(date: Date, zone: string): string {
  const p = parts(date, zone);
  const day = date.toLocaleDateString('en-US', { timeZone: zone, weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { timeZone: zone, month: 'short' });
  return `${day}, ${Number(p.day)} ${month} ${p.year} ${p.hour}:${p.minute}:${p.second} ${zoneOffsetLabel(date, zone).replace(':', '')}`;
}

export interface DateFacts { weekday: string; dayOfYear: number; isoWeek: string; quarter: number; leapYear: boolean; daysInMonth: number }

/** Handy facts about the calendar day an instant falls on in a zone. */
export function dateFacts(date: Date, zone: string): DateFacts {
  const p = parts(date, zone);
  const y = Number(p.year); const m = Number(p.month); const d = Number(p.day);
  const day = Date.UTC(y, m - 1, d);
  const dayOfYear = Math.round((day - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
  // ISO week: the week with the year's first Thursday is week 1.
  const weekday = (new Date(day).getUTCDay() + 6) % 7; // Monday = 0
  const thursday = new Date(day + (3 - weekday) * 86_400_000);
  const isoYear = thursday.getUTCFullYear();
  const week = Math.floor((thursday.getTime() - Date.UTC(isoYear, 0, 1)) / 86_400_000 / 7) + 1;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return { weekday: p.weekday ?? '', dayOfYear, isoWeek: `${isoYear}-W${pad(week)}`, quarter: Math.floor((m - 1) / 3) + 1, leapYear: leap, daysInMonth: new Date(Date.UTC(y, m, 0)).getUTCDate() };
}

export type ShiftUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

/** Adds (or, with a negative amount, subtracts) time. Months and years follow the calendar in UTC and stop at the end of a short month. */
export function shiftDate(date: Date, amount: number, unit: ShiftUnit): Date | null {
  if (!Number.isFinite(amount)) return null;
  const factor: Partial<Record<ShiftUnit, number>> = { seconds: 1000, minutes: 60_000, hours: 3_600_000, days: 86_400_000, weeks: 604_800_000 };
  let result: Date;
  if (factor[unit]) result = new Date(date.getTime() + amount * factor[unit]!);
  else {
    const months = unit === 'years' ? Math.trunc(amount) * 12 : Math.trunc(amount);
    result = new Date(date.getTime());
    const day = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months);
    const last = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(day, last));
  }
  return Number.isNaN(result.getTime()) ? null : result;
}

/** The gap between two instants in whole days, hours, minutes and seconds, for example "3 days 4 hours 5 minutes 6 seconds". */
export function describeGap(milliseconds: number): string {
  let rest = Math.floor(Math.abs(milliseconds) / 1000);
  const days = Math.floor(rest / 86400); rest -= days * 86400;
  const hours = Math.floor(rest / 3600); rest -= hours * 3600;
  const minutes = Math.floor(rest / 60); const seconds = rest - minutes * 60;
  const bits = [[days, 'day'], [hours, 'hour'], [minutes, 'minute'], [seconds, 'second']].filter(([n]) => (n as number) > 0).map(([n, w]) => `${n} ${w}${n === 1 ? '' : 's'}`);
  return bits.length ? bits.join(' ') : '0 seconds';
}

export interface BatchRow { input: string; unit: string; iso: string; local: string }

/** Converts many timestamps at once: one per line, or separated by commas or spaces. Lines that are not numbers come back marked. */
export function convertBatch(text: string, zone: string): BatchRow[] {
  return text.split(/[\n,;]+/).map((line) => line.trim()).filter(Boolean).slice(0, 5000).map((input) => {
    const parsed = parseEpoch(input);
    if (!parsed) return { input, unit: '', iso: 'Not a timestamp', local: '' };
    return { input, unit: parsed.unit, iso: parsed.date.toISOString(), local: formatWithOffset(parsed.date, zone) };
  });
}

export const batchToCsv = (rows: BatchRow[]): string => ['timestamp,unit,utc_iso,in_zone', ...rows.map((row) => [row.input, row.unit, row.iso, row.local].map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');

/** Every zone this browser knows, or a short list where it cannot say. */
export function allTimeZones(common: string[]): string[] {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone');
    if (list && list.length) return Array.from(new Set([...common, ...list]));
  } catch { /* fall through to the short list */ }
  return common;
}
