/** Reading dates and numbers people type or paste into a list. */
import { serial } from '../xlsx/model';

/** Day, month, year from text such as 05-12-2026, 2026-12-05 or 5/12/26. When both could be the month, the region's order decides. */
export function parseDate(text: string, order: 'dmy' | 'mdy' = 'dmy'): number | null {
  const t = text.trim(); if (!t) return null;
  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(t);
  if (iso) return valid(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:\s.*)?$/.exec(t); if (!m) return null;
  let a = Number(m[1]), b = Number(m[2]); let y = Number(m[3]); if (y < 100) y += 2000;
  if (a > 12 && b <= 12) return valid(y, b, a);
  if (b > 12 && a <= 12) return valid(y, a, b);
  return order === 'dmy' ? valid(y, b, a) : valid(y, a, b);
}
function valid(y: number, m: number, d: number): number | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1950 || y > 2200) return null;
  const check = new Date(Date.UTC(y, m - 1, d)); return check.getUTCMonth() === m - 1 ? serial(y, m, d) : null;
}

/** 50, 50% and 0.5 all mean half. Words such as done mean all of it. */
export function parseShare(text: string): number {
  const t = text.trim().toLowerCase(); if (!t) return 0;
  if (/^(done|complete|completed|finished|yes)$/.test(t)) return 1;
  const n = Number(t.replace('%', '').replace(',', '.')); if (!Number.isFinite(n)) return 0;
  const share = t.includes('%') || n > 1 ? n / 100 : n; return Math.min(1, Math.max(0, share));
}
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[^\d.,-]/g, ''); if (!cleaned) return null;
  const n = Number(cleaned.includes(',') && cleaned.includes('.') ? cleaned.replace(/,/g, '') : cleaned.replace(',', cleaned.split(',').length === 2 && /,\d{1,2}$/.test(cleaned) ? '.' : ''));
  return Number.isFinite(n) ? n : null;
}
export const monthStart = (year: number, month: number) => serial(year, month, 1);
export const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
