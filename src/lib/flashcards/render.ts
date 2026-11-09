import { gridFor, type PageSpec, type Rect } from './layout';
import { DPI, FONT_STACKS, MIN_FONT, pageDims, type FlashSettings } from './types';

const PT_MM = 25.4 / 72;

/** Breaks text into lines no wider than maxW. Splits at spaces, and inside a word only when the word alone is too wide (for example Chinese or Japanese text). */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (paragraph === '') { lines.push(''); continue; }
    let current = '';
    const push = (piece: string) => {
      const joined = current ? `${current} ${piece}` : piece;
      if (ctx.measureText(joined).width <= maxW) { current = joined; return; }
      if (current) { lines.push(current); current = ''; }
      if (ctx.measureText(piece).width <= maxW) { current = piece; return; }
      for (const ch of Array.from(piece)) {
        if (ctx.measureText(current + ch).width > maxW && current) { lines.push(current); current = ch; } else current += ch;
      }
    };
    paragraph.split(' ').filter(Boolean).forEach(push);
    if (current) lines.push(current);
  }
  return lines;
}

/** Finds the largest font size (in points, up to maxFont) at which the wrapped text fits the box. */
function fitText(ctx: CanvasRenderingContext2D, text: string, box: Rect, s: FlashSettings, mmToPx: number): { lines: string[]; sizePx: number } {
  const family = FONT_STACKS[s.font].css;
  for (let pt = s.maxFont; pt >= MIN_FONT; pt -= 0.5) {
    const sizePx = pt * PT_MM * mmToPx;
    ctx.font = `${sizePx}px ${family}`;
    const lines = wrapLines(ctx, text, box.w * mmToPx);
    if (lines.length * sizePx * 1.25 <= box.h * mmToPx) return { lines, sizePx };
  }
  const sizePx = MIN_FONT * PT_MM * mmToPx;
  ctx.font = `${sizePx}px ${family}`;
  return { lines: wrapLines(ctx, text, box.w * mmToPx), sizePx };
}

function drawText(ctx: CanvasRenderingContext2D, text: string, box: Rect, s: FlashSettings, mmToPx: number): void {
  if (!text) return;
  const { lines, sizePx } = fitText(ctx, text, box, s, mmToPx);
  const lineH = sizePx * 1.25;
  const top = (box.y + box.h / 2) * mmToPx - (lines.length * lineH) / 2;
  ctx.fillStyle = s.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => ctx.fillText(line, (box.x + box.w / 2) * mmToPx, top + i * lineH + lineH / 2, box.w * mmToPx));
}

const inset = (r: Rect, pad: number): Rect => ({ x: r.x + pad, y: r.y + pad, w: Math.max(1, r.w - 2 * pad), h: Math.max(1, r.h - 2 * pad) });

function drawGuides(ctx: CanvasRenderingContext2D, rects: Rect[], s: FlashSettings, mmToPx: number): void {
  if (s.guides === 'none') return;
  ctx.strokeStyle = '#9aa0a6';
  ctx.lineWidth = Math.max(1, 0.2 * mmToPx);
  if (s.guides === 'lines') {
    ctx.setLineDash([2 * mmToPx, 1.5 * mmToPx]);
    rects.forEach((r) => ctx.strokeRect(r.x * mmToPx, r.y * mmToPx, r.w * mmToPx, r.h * mmToPx));
    ctx.setLineDash([]);
    return;
  }
  const xs = new Set<number>();
  const ys = new Set<number>();
  rects.forEach((r) => { xs.add(r.x); xs.add(r.x + r.w); ys.add(r.y); ys.add(r.y + r.h); });
  const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const len = Math.min(3, s.margin * 0.6);
  const line = (x1: number, y1: number, x2: number, y2: number) => { ctx.beginPath(); ctx.moveTo(x1 * mmToPx, y1 * mmToPx); ctx.lineTo(x2 * mmToPx, y2 * mmToPx); ctx.stroke(); };
  xs.forEach((x) => { line(x, minY - 0.8, x, minY - 0.8 - len); line(x, maxY + 0.8, x, maxY + 0.8 + len); });
  ys.forEach((y) => { line(minX - 0.8, y, minX - 0.8 - len, y); line(maxX + 0.8, y, maxX + 0.8 + len, y); });
}

/** Draws one page onto a canvas context. `mmToPx` is pixels per millimetre (about 11.8 for 300 dpi). */
export function drawPage(ctx: CanvasRenderingContext2D, page: PageSpec, s: FlashSettings, mmToPx: number): void {
  const { w, h } = pageDims(s);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w * mmToPx, h * mmToPx);
  const grid = gridFor(s);
  const small = 6.5 * PT_MM * mmToPx;
  grid.rects.forEach((rect, i) => {
    const card = page.slots[i];
    if (!card) return;
    const fold = page.kind === 'fold';
    const halves: { box: Rect; text: string; color: string }[] = fold
      ? [{ box: { ...rect, w: rect.w / 2 }, text: card.front, color: s.frontColor }, { box: { x: rect.x + rect.w / 2, y: rect.y, w: rect.w / 2, h: rect.h }, text: card.back, color: s.backColor }]
      : [{ box: rect, text: page.kind === 'back' ? card.back : card.front, color: page.kind === 'back' ? s.backColor : s.frontColor }];
    halves.forEach(({ box, text, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(box.x * mmToPx, box.y * mmToPx, box.w * mmToPx, box.h * mmToPx);
      drawText(ctx, text, inset(box, Math.min(5, box.w * 0.08)), s, mmToPx);
    });
    ctx.fillStyle = '#6b7280';
    ctx.font = `${small}px ${FONT_STACKS.sans.css}`;
    ctx.textBaseline = 'alphabetic';
    if (s.numbers && page.numbers[i]) { ctx.textAlign = 'right'; ctx.fillText(String(page.numbers[i]), (rect.x + rect.w - 2) * mmToPx, (rect.y + rect.h - 2) * mmToPx); }
    if (s.label.trim()) { ctx.textAlign = 'left'; ctx.fillText(s.label.trim().slice(0, 30), (rect.x + 2) * mmToPx, (rect.y + 4) * mmToPx); }
  });
  if (page.kind === 'fold') {
    ctx.save();
    ctx.strokeStyle = '#b6bcc4';
    ctx.lineWidth = Math.max(1, 0.2 * mmToPx);
    ctx.setLineDash([1 * mmToPx, 1.5 * mmToPx]);
    grid.rects.forEach((r) => { ctx.beginPath(); ctx.moveTo((r.x + r.w / 2) * mmToPx, r.y * mmToPx); ctx.lineTo((r.x + r.w / 2) * mmToPx, (r.y + r.h) * mmToPx); ctx.stroke(); });
    ctx.restore();
  }
  drawGuides(ctx, grid.rects, s, mmToPx);
}

export const PX_PER_MM = DPI / 25.4;
