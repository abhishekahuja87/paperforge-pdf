/** Looks and helpers shared by all the workbooks. Orange for actions, green and red only for status. */
import { SheetBuilder, type Style } from '../xlsx/model';
import L from '../../locales/packs/workbooks.sheet.en.json';
import type { Region } from './region';

export const C = {
  ink: '0F172A', muted: '64748B', head: '1E293B', headText: 'FFFFFF', input: 'FFFBEB', calc: 'F1F5F9', line: 'CBD5E1', soft: 'FFEDD5', orange: 'F97316', orangeSoft: 'FDBA74',
  green: 'DCFCE7', greenText: '166534', greenBar: '16A34A', red: 'FEE2E2', redText: '991B1B', redBar: 'F87171', amber: 'FEF3C7', amberText: '92400E', weekend: 'E2E8F0',
};
export const S = {
  title: { bold: true, size: 18, color: C.ink } as Style,
  subtitle: { size: 10, color: C.muted, wrap: true, v: 'top' } as Style,
  head: { bold: true, color: C.headText, fill: C.head, h: 'center', v: 'center', wrap: true, border: 'all', borderColor: C.head } as Style,
  label: { bold: true, color: C.ink } as Style,
  note: { size: 9, color: C.muted, wrap: true, v: 'top' } as Style,
  input: (numFmt?: string, h?: Style['h']): Style => ({ fill: C.input, border: 'all', input: true, numFmt, h }),
  calc: (numFmt?: string, h?: Style['h']): Style => ({ fill: C.calc, border: 'all', numFmt, h }),
  cell: (numFmt?: string, h?: Style['h']): Style => ({ border: 'all', numFmt, h }),
  section: { bold: true, size: 12, color: C.ink, border: 'bottom', borderColor: C.orange } as Style,
};
export type WorkbookText = typeof L;
export const labels = L;

export interface GuideInput { title: string; intro: string; steps: string[]; hinglish: boolean; legend: { input: string; calc: string; sheets: string; credit: string }; sheets: { name: string; about: string }[]; credit?: string; region: Region }

/** The first sheet: what the workbook is for, how to use it, what the colours mean and links to every sheet. */
export function startHere(input: GuideInput, tab = C.orange): SheetBuilder {
  const b = new SheetBuilder(L.common.startName, tab);
  b.def.protect = true; b.widths([3, 26, 70]);
  b.put('B1', input.title, S.title).height(0, 30);
  b.put('B2', input.intro, S.subtitle).merge('B2:C2').height(1, 44);
  let r = 3;
  b.put([1, r], input.hinglish ? L.common.howHi : L.common.how, S.section).put([2, r], undefined, S.section); r += 1;
  input.steps.forEach((step, i) => { b.put([1, r], `${i + 1}`, { bold: true, color: C.orange, h: 'right', v: 'top', size: 12 }).put([2, r], step, { wrap: true, v: 'top' }); b.height(r, Math.max(18, 16 * Math.ceil(step.length / 78))); r += 1; });
  r += 1;
  b.put([1, r], input.legend.sheets, S.section).put([2, r], undefined, S.section); r += 1;
  input.sheets.forEach((s) => { b.put([1, r], s.name, { bold: true, underline: true, color: C.ink }).put([2, r], s.about, { wrap: true, v: 'top' }); b.link(`B${r + 1}`, `'${s.name.replace(/'/g, "''")}'!A1`); b.height(r, Math.max(18, 16 * Math.ceil(s.about.length / 78))); r += 1; });
  r += 1;
  b.put([1, r], input.legend.input, S.input()).put([2, r], L.common.legendInput); r += 1;
  b.put([1, r], input.legend.calc, S.calc()).put([2, r], L.common.legendCalc); r += 2;
  b.put([1, r], input.credit ?? L.common.credit, S.note).merge(`B${r + 1}:C${r + 1}`);
  return b;
}

/** A name that Excel accepts for a sheet: at most 31 characters and none of : \ / ? * [ ]. */
export const safeSheetName = (raw: string) => raw.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31) || 'Sheet';

/** A whole table style for a header row. */
export function headerRow(b: SheetBuilder, row: number, firstCol: number, names: string[], height = 30): void {
  names.forEach((n, i) => b.put([firstCol + i, row], n, S.head)); b.height(row, height);
}

/** Cell text with a sample or typed value, so a missing value never shows as undefined. */
export const textOf = (v: string | number | undefined | null): string => (v === undefined || v === null ? '' : String(v));

/** A sheet name as it is written inside a formula. */
export const q = (name: string) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `'${name.replace(/'/g, "''")}'`);
export const fmtDate = (r: Region) => r.date;
