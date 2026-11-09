import type { LayoutKind } from '../../config/posterThemes';

export type FormatId = 'post' | 'portrait' | 'story' | 'a4';

export interface Rect { x: number; y: number; w: number; h: number }

export interface PosterFormat {
  id: FormatId;
  label: string;
  w: number;
  h: number;
  /** Space Instagram covers with its own buttons (stories), kept free of text. */
  safeTop: number;
  safeBottom: number;
  pad: number;
  headerH: number;
  footerH: number;
}

export const POSTER_FORMATS: Record<FormatId, PosterFormat> = {
  post: { id: 'post', label: 'Instagram post (square)', w: 1080, h: 1080, safeTop: 0, safeBottom: 0, pad: 40, headerH: 250, footerH: 108 },
  portrait: { id: 'portrait', label: 'Instagram post (portrait)', w: 1080, h: 1350, safeTop: 0, safeBottom: 0, pad: 40, headerH: 300, footerH: 118 },
  story: { id: 'story', label: 'Instagram or WhatsApp story', w: 1080, h: 1920, safeTop: 150, safeBottom: 190, pad: 44, headerH: 360, footerH: 150 },
  a4: { id: 'a4', label: 'A4 pamphlet (print)', w: 1240, h: 1754, safeTop: 0, safeBottom: 0, pad: 56, headerH: 380, footerH: 150 },
};

export interface PosterLayout {
  /** Header block including the story safe area above its content. */
  header: Rect;
  /** Where the header text sits (below the safe area). */
  headerContent: Rect;
  footer: Rect;
  footerContent: Rect;
  cells: Rect[];
  gap: number;
}

/** Splits an area into the best-looking grid of n cells; an unfinished last row is centred. */
export function gridCells(area: Rect, n: number, gap: number): Rect[] {
  if (n <= 0) return [];
  let best = { cols: 1, score: Infinity };
  for (let cols = 1; cols <= Math.min(n, 5); cols += 1) {
    const rows = Math.ceil(n / cols);
    const cw = (area.w - (cols - 1) * gap) / cols;
    const ch = (area.h - (rows - 1) * gap) / rows;
    if (cw <= 0 || ch <= 0) continue;
    // Cards look best a little taller than wide, and a half-empty last row looks unfinished.
    const empty = rows * cols - n;
    const score = Math.abs(Math.log(cw / ch / 0.85)) + empty * 0.12;
    if (score < best.score) best = { cols, score };
  }
  const { cols } = best;
  const rows = Math.ceil(n / cols);
  const cw = (area.w - (cols - 1) * gap) / cols;
  const ch = (area.h - (rows - 1) * gap) / rows;
  const cells: Rect[] = [];
  for (let i = 0; i < n; i += 1) {
    const row = Math.floor(i / cols);
    const inRow = row === rows - 1 ? n - row * cols : cols;
    const startX = area.x + ((cols - inRow) * (cw + gap)) / 2;
    cells.push({ x: startX + (i - row * cols) * (cw + gap), y: area.y + row * (ch + gap), w: cw, h: ch });
  }
  return cells;
}

/** One large cell on the left or top, and the rest as a grid. */
function featureCells(area: Rect, n: number, gap: number): Rect[] {
  if (n < 3) return gridCells(area, n, gap);
  const wide = area.w >= area.h * 0.95;
  const big = wide
    ? { x: area.x, y: area.y, w: (area.w - gap) * 0.5, h: area.h }
    : { x: area.x, y: area.y, w: area.w, h: (area.h - gap) * 0.5 };
  const rest = wide
    ? { x: area.x + big.w + gap, y: area.y, w: area.w - big.w - gap, h: area.h }
    : { x: area.x, y: area.y + big.h + gap, w: area.w, h: area.h - big.h - gap };
  return [big, ...gridCells(rest, n - 1, gap)];
}

/** Rows of image-left, text-right cards; two columns when there are many. */
function listCells(area: Rect, n: number, gap: number): Rect[] {
  const cols = n > 6 ? 2 : 1;
  const rows = Math.ceil(n / cols);
  const cw = (area.w - (cols - 1) * gap) / cols;
  const ch = (area.h - (rows - 1) * gap) / rows;
  return Array.from({ length: n }, (_, i) => ({ x: area.x + (i % cols) * (cw + gap), y: area.y + Math.floor(i / cols) * (ch + gap), w: cw, h: ch }));
}

/** Footer height when it also carries QR codes. */
export const qrFooterHeight = (format: PosterFormat) => Math.round(format.w * 0.19);

export function computeLayout(format: PosterFormat, n: number, kind: LayoutKind, qr = false): PosterLayout {
  const { w, h, pad, safeTop, safeBottom } = format;
  const footerH = qr ? Math.max(format.footerH, qrFooterHeight(format)) : format.footerH;
  const headerBottom = safeTop + format.headerH;
  const header = { x: 0, y: 0, w, h: headerBottom };
  const headerContent = { x: pad, y: safeTop + 14, w: w - pad * 2, h: format.headerH - 28 };
  const footer = { x: 0, y: h - safeBottom - footerH, w, h: footerH + safeBottom };
  const footerContent = { x: pad, y: footer.y, w: w - pad * 2, h: footerH };
  const gap = Math.round(pad * 0.45);
  const area = { x: pad, y: headerBottom + pad * 0.6, w: w - pad * 2, h: footer.y - headerBottom - pad * 1.2 };
  // Feature and list designs suit a handful of products; with more, a plain grid keeps every photo large enough to see.
  const cells = kind === 'feature' && n >= 3 && n <= 9 ? featureCells(area, n, gap) : kind === 'list' && n >= 3 && n <= 6 && area.h / n >= 150 ? listCells(area, n, gap) : gridCells(area, n, gap);
  return { header, headerContent, footer, footerContent, cells, gap };
}
