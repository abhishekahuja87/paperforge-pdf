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

/**
 * Embeds every page so it can be drawn on another page. A page with no drawing instructions at all (a truly empty page,
 * which some scanners and editors make) cannot be embedded by pdf-lib, and one such page used to fail the whole file;
 * those come back as null and are left blank.
 */
export async function embedAll(out: PDFDocument, pages: PDFPage[]): Promise<(PDFEmbeddedPage | null)[]> {
  const hasContents = pages.map((page) => Boolean(page.node.Contents()));
  const embedded = await out.embedPages(pages.filter((_, index) => hasContents[index]));
  let at = 0;
  return hasContents.map((has) => (has ? embedded[at++]! : null));
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

export interface ResizeOptions {
  size: PageSizeId | 'custom';
  orientation: Orientation;
  fit: FitMode;
  margin: number;
  /** Portrait width and height in points, used when size is 'custom'. */
  custom?: { w: number; h: number };
  /** Copy pages that already have the chosen size unchanged (links and form fields kept) instead of redrawing them. */
  keepMatching?: boolean;
}

/** Portrait width and height of the chosen paper, in points. */
export function paperOf(options: Pick<ResizeOptions, 'size' | 'custom'>): { w: number; h: number } {
  if (options.size === 'custom') {
    const w = Math.max(36, options.custom?.w ?? PAGE_SIZES.a4.w); const h = Math.max(36, options.custom?.h ?? PAGE_SIZES.a4.h);
    return { w: Math.min(w, h), h: Math.max(w, h) };
  }
  return PAGE_SIZES[options.size];
}

/** The output page for one source page: its width and height in points. */
export function targetFor(shown: { w: number; h: number }, options: Pick<ResizeOptions, 'size' | 'custom' | 'orientation'>): { w: number; h: number } {
  const paper = paperOf(options);
  const landscape = options.orientation === 'auto' ? shown.w > shown.h : options.orientation === 'landscape';
  return landscape ? { w: paper.h, h: paper.w } : { w: paper.w, h: paper.h };
}

/** True when a page already has the target size (within about 1.5 mm). */
export const sameSize = (a: { w: number; h: number }, b: { w: number; h: number }): boolean => Math.abs(a.w - b.w) < 4 && Math.abs(a.h - b.h) < 4;

/**
 * How much the content of each page is scaled when it is fitted on the new paper, as a share of its original size.
 * Under 1 means text gets smaller; the smallest value tells people whether small print may become hard to read.
 */
export function fitScales(sizes: { w: number; h: number }[], options: ResizeOptions): number[] {
  return sizes.map((shown) => {
    const target = targetFor(shown, options);
    if (options.keepMatching && sameSize(shown, target)) return 1;
    const margin = Math.max(0, Math.min(options.margin, Math.min(target.w, target.h) / 4));
    const box = { x: margin, y: margin, w: target.w - margin * 2, h: target.h - margin * 2 };
    const spot = fitInto(shown.w, shown.h, box, options.fit);
    return Math.min(spot.sx, spot.sy);
  });
}

/** "10 × Letter, 2 × A3 landscape": what the pages of a file are now, most common first. */
export function sizeSummary(sizes: { w: number; h: number }[]): string {
  const counts = new Map<string, number>();
  for (const size of sizes) {
    const name = `${nearestPaper(size.w, size.h)}${size.w > size.h ? ' landscape' : ''}`;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => `${count} × ${name}`).join(', ');
}

/** Shown sizes of every page in a PDF, for the summary and the fit check. */
export async function readPageSizes(bytes: ArrayBuffer): Promise<{ w: number; h: number }[]> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
  return doc.getPages().map((page) => { const { w, h } = shownSize(page); return { w, h }; });
}

/** Every page redrawn onto a page of the chosen paper size. Text and images stay sharp, since nothing is turned into a picture. */
export async function resizePdf(bytes: ArrayBuffer, options: ResizeOptions): Promise<Uint8Array> {
  const source = await PDFDocument.load(bytes, { updateMetadata: false });
  const out = await PDFDocument.create();
  const pages = source.getPages();
  const embedded = await embedAll(out, pages);
  const keep = options.keepMatching ? pages.map((page) => sameSize(shownSize(page), targetFor(shownSize(page), options))) : pages.map(() => false);
  const copied = keep.some(Boolean) ? await out.copyPages(source, keep.flatMap((same, index) => (same ? [index] : []))) : [];
  let copiedAt = 0;
  pages.forEach((page, index) => {
    if (keep[index]) { out.addPage(copied[copiedAt++]!); return; }
    const shown = shownSize(page);
    const { w: width, h: height } = targetFor(shown, options);
    const target = out.addPage([width, height]);
    const margin = Math.max(0, Math.min(options.margin, Math.min(width, height) / 4));
    const content = embedded[index];
    if (content) drawUpright(target, content, shown.rotation, { x: margin, y: margin, w: width - margin * 2, h: height - margin * 2 }, options.fit);
  });
  return out.save();
}

/** Closest named paper size to a page, for showing "now A4" next to the file. */
export function nearestPaper(w: number, h: number): string {
  const [short, long] = w < h ? [w, h] : [h, w];
  for (const paper of Object.values(PAGE_SIZES)) if (Math.abs(paper.w - short) < 4 && Math.abs(paper.h - long) < 4) return paper.label;
  return `${Math.round((short / 72) * 25.4)} × ${Math.round((long / 72) * 25.4)} mm`;
}
