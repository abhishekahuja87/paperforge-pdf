import { makeCanvas } from './canvas';

export type ScanFilter = 'original' | 'clean' | 'gray' | 'bw';
export interface ScanCrop { top: number; right: number; bottom: number; left: number }
export interface ScanPage { id: string; bitmap: ImageBitmap; rotate: 0 | 90 | 180 | 270; crop: ScanCrop; filter: ScanFilter }

export const FILTERS: { value: ScanFilter; label: string; hint: string }[] = [
  { value: 'original', label: 'Original', hint: 'As photographed' },
  { value: 'clean', label: 'Clean colour', hint: 'Lifts shadows, whiter paper' },
  { value: 'gray', label: 'Clean gray', hint: 'Shadow-free, no colour' },
  { value: 'bw', label: 'Black and white', hint: 'Sharp text, smallest file' },
];

/** Divides each pixel by a blurry copy of the page, which removes shadows and uneven light and leaves text dark on white paper. */
function normalise(canvas: HTMLCanvasElement, mode: ScanFilter): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || mode === 'original') return;
  const { width, height } = canvas;
  const small = makeCanvas(Math.max(8, width / 16), Math.max(8, height / 16));
  const sctx = small.getContext('2d');
  const back = makeCanvas(width, height);
  const bctx = back.getContext('2d');
  if (!sctx || !bctx) return;
  sctx.imageSmoothingEnabled = true; sctx.drawImage(canvas, 0, 0, small.width, small.height);
  bctx.imageSmoothingEnabled = true; bctx.drawImage(small, 0, 0, width, height);
  const image = ctx.getImageData(0, 0, width, height);
  const bg = bctx.getImageData(0, 0, width, height).data;
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = Math.min(255, (d[i]! / Math.max(40, bg[i]!)) * 255);
    const g = Math.min(255, (d[i + 1]! / Math.max(40, bg[i + 1]!)) * 255);
    const b = Math.min(255, (d[i + 2]! / Math.max(40, bg[i + 2]!)) * 255);
    if (mode === 'clean') {
      // A gentle curve: paper to white, text darker.
      const lift = (v: number) => Math.max(0, Math.min(255, (v - 40) * 1.22));
      d[i] = lift(r); d[i + 1] = lift(g); d[i + 2] = lift(b);
    } else {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const v = mode === 'bw' ? (lum > 175 ? 255 : lum < 110 ? 0 : ((lum - 110) / 65) * 255) : Math.max(0, Math.min(255, (lum - 40) * 1.22));
      d[i] = v; d[i + 1] = v; d[i + 2] = v;
    }
  }
  ctx.putImageData(image, 0, 0);
}

/** Draws one scanned page: turned, cropped and filtered, with its longest side at most `maxSide` pixels. */
export function renderScan(page: ScanPage, maxSide: number): HTMLCanvasElement {
  const swap = page.rotate === 90 || page.rotate === 270;
  const sw = swap ? page.bitmap.height : page.bitmap.width;
  const sh = swap ? page.bitmap.width : page.bitmap.height;
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const full = makeCanvas(sw * scale, sh * scale);
  const fctx = full.getContext('2d');
  if (!fctx) return full;
  fctx.translate(full.width / 2, full.height / 2);
  fctx.rotate((page.rotate * Math.PI) / 180);
  const dw = (swap ? full.height : full.width);
  const dh = (swap ? full.width : full.height);
  fctx.drawImage(page.bitmap, -dw / 2, -dh / 2, dw, dh);
  const x = (page.crop.left / 100) * full.width; const y = (page.crop.top / 100) * full.height;
  const w = full.width - x - (page.crop.right / 100) * full.width; const h = full.height - y - (page.crop.bottom / 100) * full.height;
  const out = makeCanvas(Math.max(8, w), Math.max(8, h));
  out.getContext('2d')?.drawImage(full, x, y, out.width, out.height, 0, 0, out.width, out.height);
  normalise(out, page.filter);
  return out;
}
