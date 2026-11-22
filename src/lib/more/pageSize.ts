import { PDFDocument, degrees, type PDFEmbeddedPage, type PDFPage } from 'pdf-lib';
import { displaySize, normRotation, type Rotation } from '../unlimited/geometry';

/** Paper sizes in points (1 point = 1/72 inch), portrait. */
export const PAGE_SIZES = {
  a3: { label: 'A3', w: 841.89, h: 1190.55 },
  a4: { label: 'A4', w: 595.28, h: 841.89 },
  a5: { label: 'A5', w: 419.53, h: 595.28 },
  a6: { label: 'A6', w: 297.64, h: 419.53 },
  letter: { label: 'Letter', w: 612, h: 792 },
  legal: { label: 'Legal', w: 612, h: 1008 },
  tabloid: { label: 'Tabloid', w: 792, h: 1224 },
} as const;
export type PageSizeId = keyof typeof PAGE_SIZES;
export type FitMode = 'fit' | 'fill' | 'stretch';
export type Orientation = 'auto' | 'portrait' | 'landscape';

export interface Box { x: number; y: number; w: number; h: number }

/** Where the page lands inside the box: its scale on each axis and the size it takes up. */
export function fitInto(srcW: number, srcH: number, box: Box, mode: FitMode): { sx: number; sy: number; w: number; h: number; x: number; y: number } {
  const sx0 = box.w / srcW; const sy0 = box.h / srcH;
  const sx = mode === 'stretch' ? sx0 : mode === 'fit' ? Math.min(sx0, sy0) : Math.max(sx0, sy0);
  const sy = mode === 'stretch' ? sy0 : sx;
  const w = srcW * sx; const h = srcH * sy;
  return { sx, sy, w, h, x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2 };
}

/** Size of the page as a person sees it (its own Rotate setting applied). */
export function shownSize(page: PDFPage): { w: number; h: number; rotation: Rotation } {
  const { width, height } = page.getSize();
  const rotation = normRotation(page.getRotation().angle);
  return { ...displaySize(rotation, width, height), rotation };
}

/**
 * Draws an embedded page upright inside a box on the output page, even when the source page carries a Rotate setting.
 * Content is scaled first, then rotated clockwise by the page's Rotate value, then placed so it fills `at`.
 */
export function drawUpright(out: PDFPage, embedded: PDFEmbeddedPage, rotation: Rotation, box: Box, mode: FitMode): void {
  const nativeW = embedded.width; const nativeH = embedded.height;
  const shown = displaySize(rotation, nativeW, nativeH);
  const spot = fitInto(shown.w, shown.h, box, mode);
  // Scale along the page's own axes: for 90 and 270 the shown width is the native height.
  const swap = rotation === 90 || rotation === 270;
  const scaleX = swap ? spot.sy : spot.sx;
  const scaleY = swap ? spot.sx : spot.sy;
  const drawnW = nativeW * scaleX; const drawnH = nativeH * scaleY;
  let x = spot.x; let y = spot.y;
  if (rotation === 90) y += drawnW;
  else if (rotation === 180) { x += drawnW; y += drawnH; }
  else if (rotation === 270) x += drawnH;
  out.drawPage(embedded, { x, y, xScale: scaleX, yScale: scaleY, rotate: degrees(-rotation) });
}

export interface ResizeOptions { size: PageSizeId; orientation: Orientation; fit: FitMode; margin: number }

/** Every page redrawn onto a page of the chosen paper size. Text and images stay sharp, since nothing is turned into a picture. */
export async function resizePdf(bytes: ArrayBuffer, options: ResizeOptions): Promise<Uint8Array> {
  const source = await PDFDocument.load(bytes, { updateMetadata: false });
  const out = await PDFDocument.create();
  const paper = PAGE_SIZES[options.size];
  const pages = source.getPages();
  const embedded = await out.embedPages(pages);
  pages.forEach((page, index) => {
    const shown = shownSize(page);
    const landscape = options.orientation === 'auto' ? shown.w > shown.h : options.orientation === 'landscape';
    const width = landscape ? paper.h : paper.w; const height = landscape ? paper.w : paper.h;
    const target = out.addPage([width, height]);
    const margin = Math.max(0, Math.min(options.margin, Math.min(width, height) / 4));
    drawUpright(target, embedded[index]!, shown.rotation, { x: margin, y: margin, w: width - margin * 2, h: height - margin * 2 }, options.fit);
  });
  return out.save();
}

/** Closest named paper size to a page, for showing "now A4" next to the file. */
export function nearestPaper(w: number, h: number): string {
  const [short, long] = w < h ? [w, h] : [h, w];
  for (const paper of Object.values(PAGE_SIZES)) if (Math.abs(paper.w - short) < 4 && Math.abs(paper.h - long) < 4) return paper.label;
  return `${Math.round((short / 72) * 25.4)} × ${Math.round((long / 72) * 25.4)} mm`;
}
