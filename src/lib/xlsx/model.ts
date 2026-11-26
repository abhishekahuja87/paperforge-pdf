/** A small description of an Excel workbook: cells, formulas, styles, dropdowns, colour rules, locks and charts. The writer turns it into an .xlsx file. */

export type Value = string | number | boolean | null;

export interface Style {
  bold?: boolean; italic?: boolean; underline?: boolean; size?: number; color?: string; fill?: string;
  h?: 'left' | 'center' | 'right'; v?: 'top' | 'center' | 'bottom'; wrap?: boolean; indent?: number;
  /** all four sides, or one side */
  border?: 'all' | 'bottom' | 'top'; borderColor?: string;
  /** an Excel number format such as 0.00 or dd-mm-yyyy */
  numFmt?: string;
  /** cells people type in are unlocked. Everything else is locked when the sheet is protected. */
  input?: boolean;
}
export interface Cell { v?: Value; f?: string; s?: Style }
export interface ColorRule { range: string; formula: string; fill?: string; color?: string; bold?: boolean; stop?: boolean }
export interface Validation { range: string; kind: 'list' | 'decimal' | 'whole' | 'date'; list?: string[]; listRef?: string; soft?: boolean; min?: number; max?: number; title?: string; prompt?: string; error?: string }
export interface Chart { kind: 'col' | 'bar' | 'pie' | 'line'; title: string; cats: string; series: { name: string; vals: string; color?: string }[]; at: { col: number; row: number; cols: number; rows: number } }
export interface Link { ref: string; location: string }
export interface SheetDef {
  name: string; tab?: string; cells: Record<string, Cell>; widths: Record<number, number>; heights: Record<number, number>;
  freeze?: { row: number; col: number }; merges: string[]; rules: ColorRule[]; validations: Validation[]; charts: Chart[]; links: Link[];
  gridlines: boolean; protect: boolean; landscape: boolean; fitWidth: boolean; printTitles?: string; filter?: string; hiddenCols: number[]; zoom?: number;
}
export interface Book { sheets: SheetDef[]; paper: 'a4' | 'letter'; warnings: string[] }

export const colName = (n: number): string => { let name = '', v = n; do { name = String.fromCharCode(65 + (v % 26)) + name; v = Math.floor(v / 26) - 1; } while (v >= 0); return name; };
/** Zero-based column and row to a reference such as C5. */
export const ref = (col: number, row: number): string => `${colName(col)}${row + 1}`;
export const colIndex = (letters: string): number => letters.toUpperCase().split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
export const parseRef = (text: string): { col: number; row: number } => { const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(text); if (!m) throw new Error(`Bad reference ${text}`); return { col: colIndex(m[1]!), row: Number(m[2]) - 1 }; };

const EPOCH = Date.UTC(1899, 11, 30);
/** Excel stores a date as the number of days since 30 Dec 1899. */
export const serial = (year: number, month: number, day: number): number => Math.round((Date.UTC(year, month - 1, day) - EPOCH) / 86400000);
export const fromSerial = (n: number): Date => new Date(EPOCH + Math.floor(n) * 86400000);
export const todaySerial = (now = new Date()): number => serial(now.getFullYear(), now.getMonth() + 1, now.getDate());

/** Builds one sheet. Cells are written with put(). Text starting with = is a formula. */
export class SheetBuilder {
  def: SheetDef;
  constructor(name: string, tab?: string) {
    this.def = { name, tab, cells: {}, widths: {}, heights: {}, merges: [], rules: [], validations: [], charts: [], links: [], gridlines: false, protect: true, landscape: false, fitWidth: true, hiddenCols: [] };
  }
  put(at: string | [number, number], value: Value | undefined, style?: Style): this {
    const key = typeof at === 'string' ? at : ref(at[0], at[1]);
    const cell: Cell = {};
    if (typeof value === 'string' && value.startsWith('=') && value.length > 1) cell.f = value.slice(1);
    else if (value !== undefined && value !== null && value !== '') cell.v = value;
    if (style) cell.s = style;
    this.def.cells[key] = cell; return this;
  }
  style(at: string | [number, number], style: Style): this {
    const key = typeof at === 'string' ? at : ref(at[0], at[1]);
    this.def.cells[key] = { ...this.def.cells[key], s: { ...this.def.cells[key]?.s, ...style } }; return this;
  }
  /** Widths in characters, from the first column. */
  widths(list: number[], from = 0): this { list.forEach((w, i) => { this.def.widths[from + i] = w; }); return this; }
  height(row: number, points: number): this { this.def.heights[row] = points; return this; }
  merge(range: string): this { this.def.merges.push(range); return this; }
  rule(r: ColorRule): this { this.def.rules.push(r); return this; }
  validate(v: Validation): this { this.def.validations.push(v); return this; }
  chart(c: Chart): this { this.def.charts.push(c); return this; }
  link(refText: string, location: string): this { this.def.links.push({ ref: refText, location }); return this; }
  freeze(row: number, col = 0): this { this.def.freeze = { row, col }; return this; }
}
