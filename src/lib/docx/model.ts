/** A small description of a Word document: paragraphs, bullets and tables. The same description is saved as a .docx (write.ts) and drawn as a preview on the page. */
export interface Run { text: string; bold?: boolean; italic?: boolean; size?: number; color?: string }
export type Align = 'left' | 'center' | 'right' | 'both';
export interface Para {
  type: 'p';
  /** A plain string, or runs when parts need their own look. */
  runs: string | Run[];
  align?: Align;
  /** Font size in points. */
  size?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  /** Space before and after, in points. */
  before?: number;
  after?: number;
  bullet?: boolean;
  /** Left indent in points. */
  indent?: number;
  /** A thin line under the paragraph, in this colour. */
  rule?: string;
  /** Keep with the next paragraph, so a heading is never left alone at the bottom of a page. */
  keepNext?: boolean;
}
export interface Cell { runs: string | Run[]; bold?: boolean; fill?: string; color?: string; align?: Align; size?: number }
export interface TableBlock {
  type: 'table';
  rows: Cell[][];
  /** Column widths as shares of the page width. */
  widths: number[];
  /** Colour of the grid lines. No lines when empty. */
  lines?: string;
  /** Repeat the first row on each page. */
  header?: boolean;
}
export interface BreakBlock { type: 'break' }
export type Block = Para | TableBlock | BreakBlock;
export interface DocModel {
  title: string;
  blocks: Block[];
  paper: 'a4' | 'letter';
  font?: string;
  /** Base size in points. */
  size?: number;
  /** Page margin in millimetres. */
  margin?: number;
}

export const runsOf = (r: string | Run[]): Run[] => (typeof r === 'string' ? [{ text: r }] : r);
export const plain = (b: Block): string => (b.type === 'p' ? runsOf(b.runs).map((r) => r.text).join('') : b.type === 'table' ? b.rows.map((row) => row.map((c) => runsOf(c.runs).map((r) => r.text).join('')).join(' ')).join(' ') : '');

/** Page size in millimetres. */
export const PAPER = { a4: { w: 210, h: 297 }, letter: { w: 215.9, h: 279.4 } } as const;
