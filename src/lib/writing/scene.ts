/**
 * The handwriting scene: lines of text written one after another by a pen, on a chosen background.
 * buildScene traces the text (slow, once per text and font). makeRenderer lays it out for a picture size and paints any moment of it.
 */
import { drawLineText, fontSpec, lineBox, TRACE_FONT_PX, traceLine, type LineTrace } from './trace';

export type FontId = 'script' | 'brush' | 'marker' | 'clean';
export type BackgroundId = 'whiteboard' | 'chalkboard' | 'paper' | 'green' | 'black';
export type SpeedId = 'slow' | 'normal' | 'fast';
export type UnderlineId = 'none' | 'line' | 'wave';

export interface WriteOptions {
  lines: string[];
  fontId: FontId;
  ink: string;
  background: BackgroundId;
  speed: SpeedId;
  pen: boolean;
  bigFirst: boolean;
  underline: UnderlineId;
}

/** Hindi and other scripts the fonts lack are drawn by the device's own font. */
const FALLBACK = `'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', 'Noto Sans', system-ui, sans-serif`;
export const FONTS: Record<FontId, { family: string; weight: number }> = {
  script: { family: `'Dancing Script', ${FALLBACK}`, weight: 700 },
  brush: { family: `'Pacifico', ${FALLBACK}`, weight: 400 },
  marker: { family: `'Fredoka', ${FALLBACK}`, weight: 700 },
  clean: { family: `'Poppins', ${FALLBACK}`, weight: 500 },
};
export const BACKGROUNDS: Record<BackgroundId, { fill: string; ink: string }> = {
  whiteboard: { fill: '#ffffff', ink: '#1e3a8a' },
  chalkboard: { fill: '#1f3d2b', ink: '#f5f5ef' },
  paper: { fill: '#fbf1d9', ink: '#3b2f2f' },
  green: { fill: '#00b140', ink: '#ffffff' },
  black: { fill: '#000000', ink: '#ffffff' },
};
export const INK_COLOURS = ['#111827', '#1e3a8a', '#b91c1c', '#15803d', '#c2410c', '#7e22ce', '#f5f5ef', '#facc15'];
export const MAX_LINES = 6;
export const MAX_LINE_LENGTH = 40;

/** Pen speed in letter heights (ems of font size) per second. */
const SPEED: Record<SpeedId, number> = { slow: 4, normal: 6.5, fast: 10 };
const LEAD = 0.4, GAP = 0.35, UNDERLINE_SECONDS = 0.55, HOLD = 1.6;

export interface SceneData { traces: LineTrace[]; lines: string[] }

const cache = new Map<string, LineTrace>();

/** Traces every line. Reports progress after each line so a slow device can show it. */
export async function buildScene(options: WriteOptions, onProgress?: (done: number, total: number) => void): Promise<SceneData> {
  const font = FONTS[options.fontId];
  const lines = options.lines.map((line) => line.trim().slice(0, MAX_LINE_LENGTH)).filter(Boolean).slice(0, MAX_LINES);
  await Promise.all([document.fonts.load(fontSpec(font.weight, 40, font.family), lines.join(' ') || 'A')]).catch(() => undefined);
  const traces: LineTrace[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const key = `${options.fontId}|${lines[i]}`;
    let trace = cache.get(key);
    if (!trace) { trace = traceLine(lines[i]!, font.weight, font.family); cache.set(key, trace); if (cache.size > 40) cache.delete(cache.keys().next().value as string); }
    traces.push(trace);
    onProgress?.(i + 1, lines.length);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return { traces, lines };
}

interface Placed {
  trace: LineTrace;
  scale: number;
  x: number; y: number; width: number; height: number;
  glyph: HTMLCanvasElement;
  maskCanvas: HTMLCanvasElement; maskK: number;
  work: HTMLCanvasElement;
  startAt: number; writeSeconds: number;
  fontPx: number;
}

export interface Renderer { duration: number; paint: (ctx: CanvasRenderingContext2D, seconds: number) => void }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function findK(cost: Float32Array, distance: number): number {
  let lo = 0, hi = cost.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (cost[mid]! < distance) lo = mid + 1; else hi = mid; }
  return lo;
}

/** Lays the scene out for a picture of the given size and returns a painter for any moment of it. */
export function makeRenderer(data: SceneData, options: WriteOptions, width: number, height: number): Renderer {
  const font = FONTS[options.fontId];
  const unit = Math.min(width, height);
  const probe = document.createElement('canvas').getContext('2d')!;
  const n = data.traces.length;
  const bigScale = options.bigFirst && n > 1 ? 1.3 : 1;
  const weightOf = (i: number) => (i === 0 ? bigScale : 1);
  // One font size for the lines, as large as fits the width and the height.
  let size = unit * 0.15;
  const fits = (px: number) => {
    let total = 0;
    for (let i = 0; i < n; i += 1) {
      const box = lineBox(probe, data.lines[i]!, font.weight, font.family, px * weightOf(i));
      if (box.width - px * weightOf(i) * 0.6 > width * 0.9) return false;
      total += px * weightOf(i) * 1.45;
    }
    return total <= height * 0.78;
  };
  for (let guard = 0; guard < 40 && !fits(size); guard += 1) size *= 0.93;
  const total = data.traces.reduce((sum, _t, i) => sum + size * weightOf(i) * 1.45, 0);
  let cursor = height / 2 - total / 2;

  const placed: Placed[] = [];
  let clock = LEAD;
  const emsPerSecond = SPEED[options.speed];
  data.traces.forEach((trace, i) => {
    const px = size * weightOf(i);
    const scale = px / TRACE_FONT_PX;
    const w = Math.ceil(trace.width * scale), h = Math.ceil(trace.height * scale);
    const glyph = document.createElement('canvas'); glyph.width = w; glyph.height = h;
    const g = glyph.getContext('2d')!; g.fillStyle = options.ink; drawLineText(g, trace.text, trace.weight, trace.family, px, w, h);
    const maskCanvas = document.createElement('canvas'); maskCanvas.width = w; maskCanvas.height = h;
    const work = document.createElement('canvas'); work.width = w; work.height = h;
    const lineHeight = px * 1.45;
    const y = cursor + lineHeight / 2 - h / 2; cursor += lineHeight;
    const length = trace.cost[trace.cost.length - 1]! / TRACE_FONT_PX; // in ems
    const writeSeconds = Math.max(0.35, length / emsPerSecond);
    placed.push({ trace, scale, x: width / 2 - w / 2, y, width: w, height: h, glyph, maskCanvas, maskK: -1, work, startAt: clock, writeSeconds, fontPx: px });
    clock += writeSeconds + (i === 0 && options.underline !== 'none' ? UNDERLINE_SECONDS : 0) + GAP;
  });
  const writingEnd = clock - GAP;
  const duration = Math.max(2, writingEnd + HOLD);
  const bg = BACKGROUNDS[options.background].fill;

  const underlinePath = (line: Placed): [number, number][] => {
    const half = Math.min(line.trace.textWidth * line.scale, width * 0.92) / 2;
    const y = line.y + line.height / 2 + line.fontPx * 0.62;
    const points: [number, number][] = [];
    const steps = 60;
    for (let s = 0; s <= steps; s += 1) {
      const u = s / steps;
      const wobble = options.underline === 'wave' ? Math.sin(u * Math.PI * 7) * line.fontPx * 0.045 : Math.sin(u * Math.PI) * -line.fontPx * 0.02;
      points.push([width / 2 - half + u * half * 2, y + wobble]);
    }
    return points;
  };

  const revealed = (line: Placed, k: number) => {
    const { trace } = line;
    const mctx = line.maskCanvas.getContext('2d')!;
    if (k < line.maskK) { mctx.clearRect(0, 0, line.width, line.height); line.maskK = -1; }
    mctx.fillStyle = '#000';
    const from = trace.start[line.maskK + 1]!, to = trace.start[Math.min(k, trace.cost.length - 1) + 1]!;
    const s = line.scale, cell = Math.ceil(s) + 1;
    for (let p = from; p < to; p += 1) {
      const idx = trace.pix[p]!;
      mctx.fillRect((idx % trace.width) * s - 0.5, Math.floor(idx / trace.width) * s - 0.5, cell, cell);
    }
    line.maskK = Math.max(line.maskK, k);
    const wctx = line.work.getContext('2d')!;
    wctx.globalCompositeOperation = 'source-over'; wctx.clearRect(0, 0, line.width, line.height);
    wctx.drawImage(line.glyph, 0, 0);
    wctx.globalCompositeOperation = 'destination-in'; wctx.drawImage(line.maskCanvas, 0, 0);
    wctx.globalCompositeOperation = 'source-over';
    return line.work;
  };

  const drawPen = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const length = unit * 0.2, thick = unit * 0.032;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI * 0.17);
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = unit * 0.01; ctx.shadowOffsetY = unit * 0.006;
    ctx.fillStyle = options.ink; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(thick * 0.45, -thick * 1.4); ctx.lineTo(-thick * 0.45, -thick * 1.4); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#e5e7eb'; ctx.beginPath(); ctx.roundRect(-thick / 2, -thick * 1.4 - length, thick, length, thick * 0.3); ctx.fill();
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.roundRect(-thick / 2, -thick * 1.4 - length, thick, length * 0.28, thick * 0.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-thick * 0.28, -thick * 1.4 - length * 0.9, thick * 0.12, length * 0.7);
    ctx.restore();
  };

  const paint = (ctx: CanvasRenderingContext2D, seconds: number) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    let penAt: [number, number] | null = null;
    placed.forEach((line, i) => {
      const local = seconds - line.startAt;
      if (local < 0) return;
      const progress = clamp01(local / line.writeSeconds);
      if (progress >= 1) {
        ctx.drawImage(line.glyph, line.x, line.y);
        if (i === 0 && options.underline !== 'none') {
          const q = clamp01((local - line.writeSeconds) / UNDERLINE_SECONDS);
          if (q > 0) {
            const pts = underlinePath(line); const upto = Math.max(1, Math.round(pts.length * q));
            ctx.save(); ctx.strokeStyle = options.ink; ctx.lineWidth = Math.max(2, line.fontPx * 0.055); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath(); pts.slice(0, upto).forEach(([px, py], j) => (j ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); ctx.restore();
            if (q < 1) penAt = pts[upto - 1]!;
          }
        }
        if (seconds < writingEnd + 0.2 && !penAt) { const t = line.trace; const k = t.cost.length - 1; penAt = [line.x + t.pathX[k]! * line.scale, line.y + t.pathY[k]! * line.scale]; }
        return;
      }
      const distance = progress * line.trace.cost[line.trace.cost.length - 1]!;
      const k = findK(line.trace.cost, distance);
      ctx.drawImage(revealed(line, k), line.x, line.y);
      penAt = [line.x + line.trace.pathX[k]! * line.scale, line.y + line.trace.pathY[k]! * line.scale];
    });
    if (options.pen && penAt && seconds < writingEnd + 0.25) drawPen(ctx, penAt[0], penAt[1]);
  };
  return { duration, paint };
}
