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
export interface Theme {
  bg: string; text: string; muted: string; accent: string; accentText: string;
  /** Light panel colour, used for table stripes. */
  panel: string; line: string; font: string;
}
export interface DeckModel { title: string; slides: Slide[]; theme: Theme }

/** Slide size in EMU (English Metric Units): 13.333 by 7.5 inches, the widescreen shape. */
export const SLIDE_W = 12192000;
export const SLIDE_H = 6858000;
export const EMU_PT = 12700;

export const LOOKS: Record<string, Omit<Theme, 'font'>> = {
  blue: { bg: 'FFFFFF', text: '1F2933', muted: '5B6770', accent: '1F4E79', accentText: 'FFFFFF', panel: 'EEF3F8', line: 'C5D0DB' },
  green: { bg: 'FFFFFF', text: '1F2933', muted: '5B6770', accent: '2E6B3A', accentText: 'FFFFFF', panel: 'EEF5EF', line: 'C5D6C8' },
  orange: { bg: 'FFFFFF', text: '2B2118', muted: '6B5B4D', accent: 'C2410C', accentText: 'FFFFFF', panel: 'FBF1EA', line: 'E6CDBD' },
  dark: { bg: '16202B', text: 'F1F5F9', muted: 'A9B6C3', accent: '1D6FA5', accentText: 'FFFFFF', panel: '1F2D3B', line: '3A4B5C' },
  mono: { bg: 'FFFFFF', text: '111111', muted: '555555', accent: '222222', accentText: 'FFFFFF', panel: 'F2F2F2', line: 'CCCCCC' },
};
export const themeOf = (look: string, font: string): Theme => ({ ...(LOOKS[look] ?? LOOKS.blue!), font: font || 'Calibri' });
