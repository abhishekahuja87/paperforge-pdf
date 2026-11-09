import { MAX_CARDS, pageDims, type Card, type FlashSettings } from './types';

export interface Rect { x: number; y: number; w: number; h: number }

export interface Grid { cols: number; rows: number; rects: Rect[]; cardW: number; cardH: number; perPage: number }

/** Card rectangles in reading order (left to right, top to bottom), filling the page inside the margins. */
export function gridFor(s: FlashSettings): Grid {
  const { w, h } = pageDims(s);
  const cardW = (w - 2 * s.margin - s.gap * (s.cols - 1)) / s.cols;
  const cardH = (h - 2 * s.margin - s.gap * (s.rows - 1)) / s.rows;
  const rects: Rect[] = [];
  for (let r = 0; r < s.rows; r += 1) {
    for (let c = 0; c < s.cols; c += 1) rects.push({ x: s.margin + c * (cardW + s.gap), y: s.margin + r * (cardH + s.gap), w: cardW, h: cardH });
  }
  return { cols: s.cols, rows: s.rows, rects, cardW, cardH, perPage: s.cols * s.rows };
}

/**
 * Which way the back page is mirrored. When a sheet is flipped on its long edge, a portrait page turns like a book
 * (left and right swap); a landscape page turns top to bottom. Flipping on the short edge is the other way round.
 */
export function mirrorAxis(s: Pick<FlashSettings, 'mode' | 'landscape'>): 'x' | 'y' {
  const longEdge = s.mode === 'long';
  return longEdge !== s.landscape ? 'x' : 'y';
}

/** The slot on the back page that sits behind slot `i` on the front page. */
export function backSlot(i: number, cols: number, rows: number, axis: 'x' | 'y'): number {
  const r = Math.floor(i / cols);
  const c = i % cols;
  return axis === 'x' ? r * cols + (cols - 1 - c) : (rows - 1 - r) * cols + c;
}

export interface PageSpec {
  kind: 'front' | 'back' | 'fold';
  /** One entry per slot in reading order. null is an empty slot. */
  slots: (Card | null)[];
  /** Number of the card in each slot (1-based), or 0. */
  numbers: number[];
}

export function buildPages(cards: Card[], s: FlashSettings): PageSpec[] {
  const grid = gridFor(s);
  const axis = mirrorAxis(s);
  const pages: PageSpec[] = [];
  const list = cards.slice(0, MAX_CARDS);
  for (let start = 0; start < list.length; start += grid.perPage) {
    const chunk = list.slice(start, start + grid.perPage);
    const front: (Card | null)[] = Array.from({ length: grid.perPage }, (_, i) => chunk[i] ?? null);
    const frontNumbers = front.map((card, i) => (card ? start + i + 1 : 0));
    if (s.mode === 'fold') { pages.push({ kind: 'fold', slots: front, numbers: frontNumbers }); continue; }
    pages.push({ kind: 'front', slots: front, numbers: frontNumbers });
    const back: (Card | null)[] = Array.from({ length: grid.perPage }, () => null);
    const backNumbers = Array.from({ length: grid.perPage }, () => 0);
    front.forEach((card, i) => { const j = backSlot(i, grid.cols, grid.rows, axis); back[j] = card; backNumbers[j] = frontNumbers[i]; });
    pages.push({ kind: 'back', slots: back, numbers: backNumbers });
  }
  return pages;
}

/** A full sheet of "Front n" and "Back n" cards for checking how a printer lines up the two sides. */
export function alignmentDeck(perPage: number): Card[] {
  return Array.from({ length: perPage }, (_, i) => ({ front: `FRONT ${i + 1}`, back: `BACK ${i + 1}` }));
}
