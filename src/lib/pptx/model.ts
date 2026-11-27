/** A small description of a slide deck. The same description is drawn as a preview on the page and saved as a .pptx (write.ts). */
export type SlideKind = 'title' | 'section' | 'bullets' | 'two' | 'table' | 'big' | 'closing';
export interface Slide {
  kind: SlideKind;
  title: string;
  /** Second line on a title, section, big or closing slide. A line break starts a new line. */
  sub?: string;
  bullets?: string[];
  /** The two columns of a two-column slide. */
  columns?: { head: string; bullets: string[] }[];
  /** Rows of a table slide. The first row is the heading. */
  table?: string[][];
}
export type HeadStyle = 'bar' | 'band' | 'line' | 'dot';
export type HeroStyle = 'solid' | 'split' | 'light' | 'frame';
export type DecoStyle = 'none' | 'corner' | 'stripes' | 'circles';
export interface Theme {
  bg: string; text: string; muted: string; accent: string; accentText: string;
  /** A second colour for small touches: lines, circles and stripes. */
  accent2: string;
  /** Light panel colour, used for table stripes. */
  panel: string; line: string; font: string;
  head: HeadStyle; hero: HeroStyle; deco: DecoStyle;
}
export interface DeckModel { title: string; slides: Slide[]; theme: Theme }

/** Slide size in EMU (English Metric Units): 13.333 by 7.5 inches, the widescreen shape. */
export const SLIDE_W = 12192000;
export const SLIDE_H = 6858000;
export const EMU_PT = 12700;

type Design = Omit<Theme, 'font'> & { font: string };
const D = (accent: string, accent2: string, o: Partial<Design> & Pick<Design, 'head' | 'hero' | 'deco' | 'font'>): Design => ({ bg: 'FFFFFF', text: '1F2933', muted: '5B6770', accent, accentText: 'FFFFFF', accent2, panel: 'F1F4F8', line: 'C9D1DA', ...o });
/** Twelve ready-made designs: colours, a font to start with, and the look of the title slide, the headings and the decoration. */
export const LOOKS: Record<string, Design> = {
  blue: D('1F4E79', '5B9BD5', { head: 'bar', hero: 'solid', deco: 'none', font: 'Calibri', panel: 'EEF3F8', line: 'C5D0DB' }),
  navygold: D('14213D', 'E0A100', { head: 'line', hero: 'frame', deco: 'stripes', font: 'Georgia', panel: 'F4F1E8', line: 'D9D2BC' }),
  teal: D('0F766E', 'F59E0B', { head: 'band', hero: 'split', deco: 'none', font: 'Calibri', panel: 'E8F5F3', line: 'BFDCD8' }),
  green: D('2E6B3A', '9CCB6B', { head: 'line', hero: 'split', deco: 'corner', font: 'Verdana', panel: 'EEF5EF', line: 'C5D6C8' }),
  orange: D('C2410C', 'F59E0B', { head: 'band', hero: 'solid', deco: 'circles', font: 'Trebuchet MS', text: '2B2118', muted: '6B5B4D', panel: 'FBF1EA', line: 'E6CDBD' }),
  purple: D('5B21B6', 'C4B5FD', { head: 'band', hero: 'frame', deco: 'corner', font: 'Calibri', panel: 'F3EFFC', line: 'D6CAEF' }),
  rose: D('BE185D', 'F9A8D4', { head: 'dot', hero: 'light', deco: 'circles', font: 'Georgia', panel: 'FDF0F5', line: 'F0CFDD' }),
  sky: D('0369A1', '38BDF8', { head: 'line', hero: 'light', deco: 'stripes', font: 'Arial', bg: 'F6FBFE', panel: 'E4F2FA', line: 'BCD9EA' }),
  pastel: D('E07A5F', '81B29A', { head: 'dot', hero: 'light', deco: 'corner', font: 'Trebuchet MS', bg: 'FFF8F0', text: '3D2C2E', muted: '7A6A66', panel: 'FBEBDD', line: 'EBD3BF' }),
  dark: D('1D6FA5', '38BDF8', { head: 'bar', hero: 'solid', deco: 'none', font: 'Calibri', bg: '16202B', text: 'F1F5F9', muted: 'A9B6C3', panel: '1F2D3B', line: '3A4B5C' }),
  bold: D('FACC15', 'FFFFFF', { head: 'bar', hero: 'solid', deco: 'stripes', font: 'Arial', accentText: '111111', bg: '111111', text: 'F5F5F5', muted: 'B8B8B8', panel: '1E1E1E', line: '3A3A3A' }),
  mono: D('222222', '999999', { head: 'line', hero: 'light', deco: 'none', font: 'Times New Roman', text: '111111', muted: '555555', panel: 'F2F2F2', line: 'CCCCCC' }),
};
export const themeOf = (look: string, font: string): Theme => { const d = LOOKS[look] ?? LOOKS.blue!; return { ...d, font: font || d.font }; };
