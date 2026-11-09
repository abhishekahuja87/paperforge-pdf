import { PAGE_SIZES, type PageSizeId } from '../paper/types';

export type DuplexMode = 'long' | 'short' | 'fold';
export type GuideStyle = 'lines' | 'ticks' | 'none';
export type FontFamily = 'sans' | 'serif' | 'mono';

export interface Card { front: string; back: string }

export interface FlashSettings {
  page: PageSizeId;
  landscape: boolean;
  cols: number;
  rows: number;
  /** Space between the page edge and the cards, in mm. */
  margin: number;
  /** Space between neighbouring cards, in mm. */
  gap: number;
  /** Two-sided printing flipped on the long or short edge, or one-sided cards folded in the middle. */
  mode: DuplexMode;
  guides: GuideStyle;
  font: FontFamily;
  /** Largest text size in points. Text shrinks to fit the card. */
  maxFont: number;
  frontColor: string;
  backColor: string;
  textColor: string;
  numbers: boolean;
  label: string;
}

export const MAX_CARDS = 500;
export const MIN_FONT = 6;
export const DPI = 300;

export const FONT_STACKS: Record<FontFamily, { label: string; css: string }> = {
  sans: { label: 'Sans-serif', css: 'system-ui, "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif' },
  serif: { label: 'Serif', css: 'Georgia, "Noto Serif", "Times New Roman", serif' },
  mono: { label: 'Monospace', css: 'ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace' },
};

export const SWATCHES: { label: string; value: string }[] = [
  { label: 'White', value: '#ffffff' }, { label: 'Cream', value: '#fff8e7' }, { label: 'Sky', value: '#e6f2fb' }, { label: 'Mint', value: '#e8f6ec' }, { label: 'Rose', value: '#fde8ec' }, { label: 'Lemon', value: '#fffbd6' },
];

export const LAYOUTS: { label: string; cols: number; rows: number }[] = [
  { label: '6 per page (2×3)', cols: 2, rows: 3 },
  { label: '8 per page (2×4)', cols: 2, rows: 4 },
  { label: '10 per page (2×5)', cols: 2, rows: 5 },
  { label: '12 per page (3×4)', cols: 3, rows: 4 },
  { label: '9 per page (3×3)', cols: 3, rows: 3 },
  { label: '4 per page (2×2)', cols: 2, rows: 2 },
];

export const DEFAULT_FLASH: FlashSettings = {
  page: 'a4', landscape: false, cols: 2, rows: 4, margin: 8, gap: 0, mode: 'long', guides: 'lines', font: 'sans', maxFont: 28,
  frontColor: '#ffffff', backColor: '#fff8e7', textColor: '#1f2937', numbers: false, label: '',
};

export const SAMPLE_DECK = `Bonjour | Hello
Merci | Thank you
S'il vous plaît | Please
Au revoir | Goodbye
Oui | Yes
Non | No
Excusez-moi | Excuse me
Comment ça va ? | How are you?`;

export const pageDims = (s: Pick<FlashSettings, 'page' | 'landscape'>): { w: number; h: number } => {
  const { width, height } = PAGE_SIZES[s.page];
  return s.landscape ? { w: height, h: width } : { w: width, h: height };
};
