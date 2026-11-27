/** Small building blocks the newer workbooks share: a Settings sheet, a list sheet people type into, WhatsApp links and the usual status colours. */
import { SheetBuilder, type Style, type Value } from '../xlsx/model';
import { C, S, headerRow, q } from './common';

/** One row of a Settings sheet: a label, the value, and an optional Excel number format. */
export type SettingRow = [label: string, value: Value | undefined, numFmt?: string];

/** A Settings sheet. `at(i)` is the full reference of the value in row i (0 is the first row), for use in formulas on other sheets. */
export function settingsSheet(name: string, title: string, rows: SettingRow[], hint?: string): { sheet: SheetBuilder; at: (i: number) => string } {
  const s = new SheetBuilder(name, C.orange); s.widths([34, 46]);
  s.put('A1', title, { ...S.title, size: 16 }).height(0, 28);
  rows.forEach(([label, value, fmt], i) => { s.put([0, 2 + i], label, S.label).put([1, 2 + i], value, { ...S.input(fmt), wrap: true, v: 'top' }); });
  if (hint) s.put([0, 3 + rows.length], hint, S.note).merge(`A${4 + rows.length}:B${4 + rows.length}`).height(3 + rows.length, 44);
  return { sheet: s, at: (i) => `${q(name)}!$B$${3 + i}` };
}

export interface ListColumn { head: string; width: number; fmt?: string; align?: Style['h'] }
/** A list sheet: title, one line of help, a header row (row 3) and `cap` rows people type into from row 4. Each cell of `data` fills one box. */
export function listSheet(name: string, title: string, sub: string, columns: ListColumn[], data: (Value | undefined)[][], cap: number): SheetBuilder {
  const b = new SheetBuilder(name, C.orange); b.widths(columns.map((c) => c.width)); b.def.freeze = { row: 3, col: 1 };
  b.put('A1', title, { ...S.title, size: 16 }).height(0, 28).put('A2', sub, S.subtitle).merge(`A2:${String.fromCharCode(64 + Math.max(2, columns.length))}2`).height(1, 30);
  headerRow(b, 2, 0, columns.map((c) => c.head), 36);
  for (let i = 0; i < cap; i += 1) columns.forEach((c, k) => b.put([k, 3 + i], data[i]?.[k], S.input(c.fmt, c.align)));
  return b;
}

/** Digits only, from a phone number in a cell. A leading 0 is dropped and the country code from Settings is put in front of short numbers. */
export function whatsappNumber(phoneRef: string, codeRef: string): string {
  const clean = `SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(${phoneRef}&""," ",""),"-",""),"+",""),"(",""),")","")`;
  const local = `IF(LEFT(${clean},1)="0",MID(${clean},2,20),${clean})`;
  return `IF(${phoneRef}="","",IF(LEN(${local})<=10,${codeRef}&${local},${local}))`;
}
/** Percent-encodes a message so it can sit in a link. */
export const linkText = (text: string): string => `SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(${text},"%","%25")," ","%20"),"&","%26"),"#","%23")`;
/** Fills {name}, {amount}, {business} and so on in a message template. Pairs are [placeholder, formula]. */
export function fillTemplate(template: string, pairs: [string, string][]): string {
  return pairs.reduce((inner, [key, value]) => `SUBSTITUTE(${inner},"${key}",${value})`, template);
}

/** Colour rules for a status column whose words are `good`, `warn` and `bad`. */
export function statusRules(b: SheetBuilder, range: string, firstCell: string, words: { good?: string; warn?: string; bad?: string }): void {
  if (words.bad) b.rule({ range, formula: `${firstCell}="${words.bad}"`, fill: C.red, color: C.redText, bold: true });
  if (words.warn) b.rule({ range, formula: `${firstCell}="${words.warn}"`, fill: C.amber, color: C.amberText, bold: true });
  if (words.good) b.rule({ range, formula: `${firstCell}="${words.good}"`, fill: C.green, color: C.greenText, bold: true });
}
