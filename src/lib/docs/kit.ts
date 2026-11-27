/** Small helpers the Word document makers share. */
import type { Para, Run } from '../docx/model';
import type { Region } from '../workbooks/region';

export interface DocInput { values: Record<string, string>; lists: Record<string, Record<string, string>[]>; look: string; region: Region }

export const P = (runs: string | Run[], o: Partial<Para> = {}): Para => ({ type: 'p', runs, ...o });
export const clean = (s: string | undefined): string => (s ?? '').trim();
/** Non-empty lines of a box, trimmed. */
export const lines = (s: string | undefined): string[] => clean(s).split('\n').map((l) => l.trim()).filter(Boolean);
/** Paragraphs of a box: blocks separated by a blank line, with single line breaks kept inside. */
export const paragraphs = (s: string | undefined): string[] => clean(s).split(/\n\s*\n/).map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')).filter(Boolean);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parse = (iso: string): { y: number; m: number; d: number } | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim()); if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const check = new Date(Date.UTC(y, mo - 1, d)); return check.getUTCFullYear() === y && check.getUTCMonth() === mo - 1 && check.getUTCDate() === d ? { y, m: mo, d } : null;
};
/** 27 November 2026, or November 27, 2026 where the region writes the month first. Empty when the date is empty or not a date. */
export function longDate(iso: string | undefined, region: Region): string {
  const p = parse(iso ?? ''); if (!p) return '';
  const month = MONTHS[p.m - 1] ?? '';
  return region.date.startsWith('mm') ? `${month} ${p.d}, ${p.y}` : `${p.d} ${month} ${p.y}`;
}
/** Whole days from one date to another (negative when the second is earlier). Null when either is empty. */
export function daysBetween(from: string | undefined, to: string | undefined): number | null {
  const a = parse(from ?? ''), b = parse(to ?? ''); if (!a || !b) return null;
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}
/** Replaces {key} in a text with the value for that key. Unknown words in curly brackets stay as they are. */
export const fill = (text: string, map: Record<string, string>): string => text.replace(/\{(\w+)\}/g, (all, key: string) => (key in map ? map[key]! : all));
/** True when something is still written in [square brackets], such as [date]. */
export const hasBrackets = (texts: string[]): boolean => texts.some((t) => /\[[^\]\n]{1,60}\]/.test(t));
/** Today's date and days ahead, as yyyy-mm-dd, for the starters. */
export function isoFrom(now: Date, plusDays: number): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + plusDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** Turns the starter markers @today and @+30 into real dates. */
export const resolveDate = (v: string, now: Date): string => (v === '@today' ? isoFrom(now, 0) : /^@\+\d+$/.test(v) ? isoFrom(now, Number(v.slice(2))) : v);
