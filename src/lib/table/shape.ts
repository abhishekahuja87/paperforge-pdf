/** Turning raw rows into a tidy table: headings, column kinds, duplicates and matching columns to what a tool needs. */
import type { RawTable } from './read';

export type ColumnKind = 'text' | 'number' | 'date' | 'phone' | 'empty';
export interface Shaped { headers: string[]; rows: string[][]; kinds: ColumnKind[]; filled: number[]; duplicates: number; headerGuessed: boolean }
export interface Field { key: string; label: string; aliases: string[]; required?: boolean }

const DATE = /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}(\s+\d{1,2}:\d{2})?$|^\d{4}-\d{2}-\d{2}$/;
const NUMBER = /^[-+]?\d+([.,]\d+)*$/;
const PHONE = /^\+?\d[\d\s-]{8,14}\d$/;
export const keyOf = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

/** True when the first row looks like headings: all filled, none a number or date, and different from each other. */
export function guessHeader(rows: string[][]): boolean {
  const first = rows[0]; if (!first || first.length === 0) return false;
  if (first.some((c) => c === '' || NUMBER.test(c) || DATE.test(c))) return false;
  return new Set(first.map(keyOf)).size === first.length;
}

function kindOf(values: string[]): ColumnKind {
  const filled = values.filter((v) => v !== ''); if (filled.length === 0) return 'empty';
  const share = (test: (v: string) => boolean) => filled.filter(test).length / filled.length;
  if (share((v) => DATE.test(v)) >= 0.9) return 'date';
  if (share((v) => PHONE.test(v) && !/[.,]/.test(v)) >= 0.9) return 'phone';
  if (share((v) => NUMBER.test(v)) >= 0.9) return 'number';
  return 'text';
}

export function shape(raw: RawTable, useHeaders: boolean): Shaped {
  const width = Math.max(1, ...raw.rows.map((r) => r.length));
  const padded = raw.rows.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''));
  // Drop columns that are empty all the way down.
  const used = Array.from({ length: width }, (_, i) => i).filter((i) => padded.some((r) => r[i] !== ''));
  const grid = padded.map((r) => used.map((i) => r[i]!));
  const head = useHeaders ? grid[0]! : [], body = useHeaders ? grid.slice(1) : grid;
  const seen = new Map<string, number>();
  const headers = used.map((_, i) => {
    const base = (head[i] ?? '') || `Column ${i + 1}`, key = keyOf(base), count = (seen.get(key) ?? 0) + 1; seen.set(key, count);
    return count > 1 ? `${base} ${count}` : base;
  });
  const columns = headers.map((_, i) => body.map((r) => r[i]!));
  const lines = new Set<string>(); let duplicates = 0;
  for (const row of body) { const k = row.join('\u0001').toLowerCase(); if (lines.has(k)) duplicates += 1; else lines.add(k); }
  return { headers, rows: body, kinds: columns.map(kindOf), filled: columns.map((c) => c.filter((v) => v !== '').length), duplicates, headerGuessed: guessHeader(grid) };
}

/** The column that best matches each wanted field, by heading. -1 when none does. */
export function suggestMapping(fields: Field[], headers: string[]): Record<string, number> {
  const keys = headers.map(keyOf), taken = new Set<number>(), out: Record<string, number> = {};
  for (const f of fields) {
    const wanted = [f.label, ...f.aliases].map(keyOf).filter(Boolean);
    let hit = keys.findIndex((k, i) => !taken.has(i) && wanted.includes(k));
    if (hit < 0) hit = keys.findIndex((k, i) => !taken.has(i) && wanted.some((w) => w.length >= 3 && (k.includes(w) || w.includes(k)) && k.length >= 3));
    out[f.key] = hit; if (hit >= 0) taken.add(hit);
  }
  return out;
}
