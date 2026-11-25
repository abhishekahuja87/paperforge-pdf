/** Boxes that hide a part of a video (a face, a number plate), and how they are drawn on each picture. */

export type StyleId = 'blur' | 'pixel' | 'black';
export type ShapeId = 'rect' | 'oval';
export type StrengthId = 'light' | 'medium' | 'strong';
export interface Look { style: StyleId; shape: ShapeId; strength: StrengthId }

/** Positions are fractions of the picture (0 to 1), so they hold for any video size. */
export interface Rect { x: number; y: number; w: number; h: number }
export interface Box extends Rect {
  id: number;
  /** True when the thing being hidden moves: the box slides from this place to the `end` place between `from` and `to`. */
  moves: boolean;
  end: Rect;
  /** Seconds. `to` of 0 means until the end of the video. */
  from: number;
  to: number;
}

/** How many blocks fit across the shorter side of a box. Fewer blocks hide more. */
const CELLS: Record<StrengthId, number> = { light: 10, medium: 6, strong: 4 };

const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));

/** Where a box is at this moment, or null when it is not shown then. */
export function boxAt(box: Box, seconds: number, videoLength: number): Rect | null {
  const to = box.to > 0 ? box.to : videoLength;
  if (seconds < box.from - 0.0001 || seconds > to + 0.0001) return null;
  if (!box.moves) return { x: box.x, y: box.y, w: box.w, h: box.h };
  const t = to > box.from ? clamp((seconds - box.from) / (to - box.from), 0, 1) : 0, mix = (a: number, b: number) => a + (b - a) * t;
  return { x: mix(box.x, box.end.x), y: mix(box.y, box.end.y), w: mix(box.w, box.end.w), h: mix(box.h, box.end.h) };
}

let scratch: HTMLCanvasElement | null = null;

/** Hides the boxes that are on at this moment. Blocks are made by shrinking the area and stretching it back, so nothing depends on a filter the browser might lack. */
export function applyBlur(ctx: CanvasRenderingContext2D, boxes: Box[], seconds: number, width: number, height: number, look: Look, videoLength: number): void {
  for (const box of boxes) {
    const at = boxAt(box, seconds, videoLength); if (!at) continue;
    const x = Math.round(clamp(at.x, 0, 1) * width), y = Math.round(clamp(at.y, 0, 1) * height), w = Math.round(clamp(at.w, 0, 1 - clamp(at.x, 0, 1)) * width), h = Math.round(clamp(at.h, 0, 1 - clamp(at.y, 0, 1)) * height);
    if (w < 2 || h < 2) continue;
    ctx.save(); ctx.beginPath();
    if (look.shape === 'oval') ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); else ctx.rect(x, y, w, h);
    ctx.clip();
    if (look.style === 'black') { ctx.fillStyle = '#000000'; ctx.fillRect(x, y, w, h); }
    else {
      const cell = Math.max(2, Math.min(w, h) / CELLS[look.strength]), sw = Math.max(1, Math.round(w / cell)), sh = Math.max(1, Math.round(h / cell));
      scratch ??= document.createElement('canvas'); scratch.width = sw; scratch.height = sh;
      const small = scratch.getContext('2d')!; small.imageSmoothingEnabled = true; small.drawImage(ctx.canvas, x, y, w, h, 0, 0, sw, sh);
      ctx.imageSmoothingEnabled = look.style === 'blur'; ctx.drawImage(scratch, 0, 0, sw, sh, x, y, w, h); ctx.imageSmoothingEnabled = true;
    }
    ctx.restore();
  }
}
