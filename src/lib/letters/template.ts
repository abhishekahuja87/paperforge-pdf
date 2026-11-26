/** Placeholders in a letter, such as {name} or {amount|inr}, and filling them from one row of a list. */
import { keyOf } from '../table/shape';

const PLACEHOLDER = /\{\s*([^{}|\n]+?)\s*(?:\|\s*([a-z]+)\s*)?\}/gi;
export const FILTERS = ['inr', 'upper', 'lower', 'title'] as const;

/** The field names used in the text, once each, in the order they first appear. */
export function findFields(text: string): string[] {
  const seen = new Map<string, string>();
  for (const m of text.matchAll(PLACEHOLDER)) { const key = keyOf(m[1]!); if (key && !seen.has(key)) seen.set(key, m[1]!.trim()); }
  return [...seen.values()];
}

const title = (s: string) => s.toLowerCase().replace(/(^|[\s.'-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
function applyFilter(value: string, filter: string | undefined): string {
  const f = (filter ?? '').toLowerCase();
  if (f === 'upper') return value.toUpperCase();
  if (f === 'lower') return value.toLowerCase();
  if (f === 'title') return title(value);
  if (f === 'inr') { const n = Number(value.replace(/[₹,\s]|rs\.?|inr/gi, '')); return value !== '' && Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : value; }
  return value;
}

/** The text with every placeholder replaced. `valueOf` gets the field name as written and returns its value. */
export function fillTemplate(text: string, valueOf: (field: string) => string): string {
  return text.replace(PLACEHOLDER, (_, field: string, filter: string | undefined) => applyFilter(valueOf(field.trim()), filter));
}

/** Parts of the letter the person still has to fill in, written as [like this]. */
export const bracketPrompts = (text: string): string[] => [...text.matchAll(/\[[^\[\]\n]{1,60}\]/g)].map((m) => m[0]);
