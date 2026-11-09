/** Screenshot redaction: boxes drawn over an image, flattened into the pixels so nothing hidden stays underneath. */

export type RedactStyle = 'solid' | 'pixelate';

export interface Region {
  id: number;
  /** Position and size in image pixels. */
  x: number;
  y: number;
  w: number;
  h: number;
  style: RedactStyle;
  /** Fill colour for solid boxes, #rrggbb. */
  color: string;
}

export const MIN_REGION = 6;
/** Images above this many pixels are refused, because a canvas that large can crash a phone tab. */
export const MAX_PIXELS = 80_000_000;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Rectangle between two drag points, in any direction, kept inside the image. Returns null when too small. */
export function rectFromPoints(ax: number, ay: number, bx: number, by: number, width: number, height: number) {
  const x1 = clamp(Math.min(ax, bx), 0, width);
  const y1 = clamp(Math.min(ay, by), 0, height);
  const x2 = clamp(Math.max(ax, bx), 0, width);
  const y2 = clamp(Math.max(ay, by), 0, height);
  const w = Math.round(x2 - x1);
  const h = Math.round(y2 - y1);
  if (w < MIN_REGION || h < MIN_REGION) return null;
  return { x: Math.round(x1), y: Math.round(y1), w, h };
}

/**
 * Size of one pixelated block. At most three blocks fit across the short side, so a line of text inside the box
 * is turned into a few flat tiles that cannot be read or sharpened back.
 */
export function blockSize(region: Pick<Region, 'w' | 'h'>): number {
  return Math.max(8, Math.ceil(Math.min(region.w, region.h) / 3));
}

/** Draws the image and then every region on top, replacing the pixels inside each region. */
export function paintRegions(ctx: CanvasRenderingContext2D, source: CanvasImageSource, width: number, height: number, regions: Region[]) {
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(source, 0, 0, width, height);
  for (const region of regions) {
    if (region.style === 'solid') {
      ctx.fillStyle = region.color;
      ctx.fillRect(region.x, region.y, region.w, region.h);
      continue;
    }
    const block = blockSize(region);
    const cols = Math.ceil(region.w / block);
    const rows = Math.ceil(region.h / block);
    const tile = document.createElement('canvas');
    tile.width = cols;
    tile.height = rows;
    const tctx = tile.getContext('2d');
    if (!tctx) continue;
    tctx.imageSmoothingEnabled = true;
    // Average the area into one pixel per block, then enlarge without smoothing so the blocks stay sharp.
    tctx.drawImage(source, region.x, region.y, region.w, region.h, 0, 0, cols, rows);
    ctx.save();
    ctx.beginPath();
    ctx.rect(region.x, region.y, region.w, region.h);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tile, 0, 0, cols, rows, region.x, region.y, cols * block, rows * block);
    ctx.restore();
  }
}

/** Output size for an export limit on the longer side (0 = keep original). Never enlarges. */
export function exportSize(width: number, height: number, longSide: number): { w: number; h: number } {
  if (longSide <= 0 || Math.max(width, height) <= longSide) return { w: width, h: height };
  const scale = longSide / Math.max(width, height);
  return { w: Math.max(1, Math.round(width * scale)), h: Math.max(1, Math.round(height * scale)) };
}

export const redactedName = (original: string, type: 'png' | 'jpg') => `${original.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-').slice(0, 60) || 'screenshot'}-redacted.${type}`;
