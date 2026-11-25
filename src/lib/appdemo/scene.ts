/**
 * Draws an app or website demo: your screenshots inside a phone or laptop frame, with a tap circle, an arrow or a box on the part you point at,
 * a zoom, smooth scrolling of tall screenshots, a cover over private details and a line of words for each screen.
 * The picture at any moment depends only on the time, so the preview, the slider and the saved video match.
 */
import { FONT_FAMILIES, type FontId, type SpeedId } from '../sequence/scene';

export type DemoLookId = 'clean' | 'night' | 'paper' | 'bold' | 'black';
export type DeviceId = 'phone' | 'laptop' | 'none';
export type MarkStyleId = 'none' | 'tap' | 'arrow' | 'box';
export type TransitionId = 'slide' | 'fade' | 'zoom';
export type LabelId = 'card' | 'big' | 'none';
export type HideSizeId = 'small' | 'wide' | 'block';
export interface Pic { source: CanvasImageSource; width: number; height: number }

export interface Screen {
  pic: Pic; label: string; /** 0 for automatic. */ seconds: number;
  mark: { style: MarkStyleId; x: number; y: number; zoom: boolean };
  hide: { on: boolean; x: number; y: number; size: HideSizeId };
}

export interface DemoLook { bg: [string, string]; ink: string; accent: string; card: string; cardInk: string; font: FontId }
export const DEMO_LOOKS: Record<DemoLookId, DemoLook> = {
  clean: { bg: ['#fff7ed', '#fed7aa'], ink: '#1f2937', accent: '#ea580c', card: '#ffffff', cardInk: '#1f2937', font: 'clean' },
  night: { bg: ['#0b1020', '#1e1b4b'], ink: '#f8fafc', accent: '#22d3ee', card: '#0f172a', cardInk: '#f8fafc', font: 'clean' },
  paper: { bg: ['#fbf3e0', '#e9d5a8'], ink: '#3b2a14', accent: '#b45309', card: '#fffaf0', cardInk: '#3b2a14', font: 'friendly' },
  bold: { bg: ['#fde047', '#fb923c'], ink: '#111111', accent: '#e11d48', card: '#ffffff', cardInk: '#111111', font: 'clean' },
  black: { bg: ['#000000', '#111827'], ink: '#ffffff', accent: '#facc15', card: '#1f2937', cardInk: '#ffffff', font: 'clean' },
};

export interface DemoOptions { look: DemoLookId; font: FontId; speed: SpeedId; device: DeviceId; transition: TransitionId; label: LabelId; scroll: boolean }
export interface Timeline { starts: number[]; ends: number[]; duration: number }
export interface Renderer { duration: number; paint: (ctx: CanvasRenderingContext2D, seconds: number) => void }

const BASE: Record<SpeedId, number> = { slow: 5, normal: 3.8, fast: 2.6 };
const TAIL = 0.6;
const HIDE: Record<HideSizeId, [number, number]> = { small: [0.22, 0.05], wide: [0.8, 0.07], block: [0.42, 0.18] };

/** A screen whose picture is much taller than a phone screen is scrolled, so it gets more time. */
export const isTall = (pic: Pic) => pic.height / pic.width > 2.1;

const wanted = (screens: Screen[], speed: SpeedId, scroll: boolean) => screens.map((screen) => screen.seconds > 0 ? screen.seconds : BASE[speed] + (scroll && isTall(screen.pic) ? 2.5 : 0) + Math.min(2, screen.label.length * 0.03) + (screen.mark.style !== 'none' ? 0.6 : 0));

export function buildTimeline(screens: Screen[], options: DemoOptions, extras: { stepTimes?: number[] | null; minDuration?: number; fitTo?: number } = {}): Timeline {
  const want = wanted(screens, options.speed, options.scroll);
  const given = extras.stepTimes && extras.stepTimes.length === want.length ? extras.stepTimes : null;
  const starts: number[] = []; let end = 0;
  if (given) { given.forEach((value, k) => starts.push(k === 0 ? Math.max(0, value) : Math.max(value, starts[k - 1]! + 0.6))); end = (starts[starts.length - 1] ?? 0) + (want[want.length - 1] ?? 1); }
  else {
    const total = want.reduce((sum, value) => sum + value, 0);
    const stretch = extras.fitTo && total > 0 ? Math.max(0.4, Math.min(6, (extras.fitTo - TAIL) / total)) : 1;
    let cursor = 0; for (const value of want) { starts.push(cursor); cursor += value * stretch; } end = cursor;
  }
  const ends = starts.map((_, k) => (k + 1 < starts.length ? starts[k + 1]! : end));
  return { starts, ends, duration: Math.max(extras.minDuration ?? 0, end + TAIL, 1.5) };
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
const easeInOut = (value: number) => { const v = clamp01(value); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
const easeBack = (value: number) => { const v = clamp01(value) - 1; return 1 + 1.9 * v * v * v + 0.9 * v * v; };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + k, y); ctx.arcTo(x + w, y, x + w, y + h, k); ctx.arcTo(x + w, y + h, x, y + h, k); ctx.arcTo(x, y + h, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath();
}

interface Frame { /** The visible screen area. */ sx: number; sy: number; sw: number; sh: number; /** Where the words go. */ lx: number; ly: number; lw: number; wide: boolean }

export function makeRenderer(screens: Screen[], options: DemoOptions, W: number, H: number, timeline: Timeline): Renderer {
  const look = DEMO_LOOKS[options.look]; const FAM = FONT_FAMILIES[options.font]; const U = Math.min(W, H * 0.75); const px = U / 1080;
  const wideOut = W > H * 1.1;
  const pixelated = new Map<Screen, HTMLCanvasElement>();

  // Where the screen sits, for each kind of frame and each output shape.
  const layout = (): Frame => {
    if (options.device === 'phone') {
      if (wideOut) { const dh = H * 0.84; const dw = dh * 0.49; const cx = W * 0.3; return { sx: cx - dw / 2 + dw * 0.04, sy: H * 0.5 - dh / 2 + dh * 0.022, sw: dw * 0.92, sh: dh * 0.956, lx: W * 0.68, ly: H * 0.5, lw: W * 0.4, wide: true }; }
      const dh = Math.min(H * 0.72, W * 0.8 / 0.49); const dw = dh * 0.49; const cy = H * 0.41; return { sx: W / 2 - dw / 2 + dw * 0.04, sy: cy - dh / 2 + dh * 0.022, sw: dw * 0.92, sh: dh * 0.956, lx: W / 2, ly: H * 0.88, lw: W - U * 0.14, wide: false };
    }
    if (options.device === 'laptop') {
      const barH = 0.06;
      if (wideOut) { const dh = H * 0.74; const dw = Math.min(W * 0.84, dh / 0.64); const cy = H * 0.44; return { sx: W / 2 - dw * 0.46, sy: cy - dh / 2 + dh * barH, sw: dw * 0.92, sh: Math.min(dh * (0.9 - barH), dw * 0.92 * 0.6), lx: W / 2, ly: H * 0.91, lw: W * 0.8, wide: false }; }
      const dw = W * 0.92; const dh = dw * 0.64; const cy = H * 0.38; return { sx: W / 2 - dw * 0.46, sy: cy - dh / 2 + dh * barH, sw: dw * 0.92, sh: dh * (0.9 - barH), lx: W / 2, ly: H * 0.8, lw: W - U * 0.14, wide: false };
    }
    if (wideOut) { const h = H * 0.74, w = Math.min(W * 0.84, h * 16 / 9); return { sx: W / 2 - w / 2, sy: H * 0.44 - h / 2, sw: w, sh: h, lx: W / 2, ly: H * 0.92, lw: W * 0.8, wide: false }; }
    const w = W * 0.82; const h = Math.min(w * 16 / 9, H * 0.7); return { sx: W / 2 - w / 2, sy: H * 0.4 - h / 2, sw: w, sh: h, lx: W / 2, ly: H * 0.88, lw: W - U * 0.14, wide: false };
  };
  const frame = layout();

  const bezel = (ctx: CanvasRenderingContext2D) => {
    const { sx, sy, sw, sh } = frame;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 40 * px; ctx.shadowOffsetY = 18 * px;
    if (options.device === 'phone') { const b = sw * 0.045; ctx.fillStyle = '#111827'; roundRect(ctx, sx - b, sy - b, sw + b * 2, sh + b * 2, sw * 0.13); ctx.fill(); }
    else if (options.device === 'laptop') {
      const bar = sh * 0.075; const b = sw * 0.012; ctx.fillStyle = '#e5e7eb'; roundRect(ctx, sx - b, sy - bar - b, sw + b * 2, sh + bar + b * 2, sw * 0.02); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.fillStyle = '#d1d5db'; roundRect(ctx, sx - sw * 0.06, sy + sh + b * 1.5, sw * 1.12, sh * 0.035, sh * 0.02); ctx.fill();
      ctx.fillStyle = '#e5e7eb'; ctx.fillRect(sx - b, sy - bar - b, sw + b * 2, bar + b);
      ['#f87171', '#fbbf24', '#4ade80'].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(sx + bar * (0.6 + k * 0.5), sy - bar / 2, bar * 0.14, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = '#ffffff'; roundRect(ctx, sx + bar * 2.4, sy - bar * 0.75, sw - bar * 3.2, bar * 0.5, bar * 0.25); ctx.fill();
    } else { ctx.fillStyle = '#ffffff'; roundRect(ctx, sx - 6 * px, sy - 6 * px, sw + 12 * px, sh + 12 * px, 26 * px); ctx.fill(); }
    ctx.restore();
    if (options.device === 'phone') { ctx.fillStyle = '#111827'; roundRect(ctx, frame.sx + sw * 0.5 - sw * 0.14, sy - sw * 0.025, sw * 0.28, sw * 0.05, sw * 0.025); ctx.fill(); }
  };

  const hideBlock = (screen: Screen) => {
    let c = pixelated.get(screen); if (c) return c;
    const { x, y, size } = screen.hide; const [fw, fh] = HIDE[size]; const w = Math.round(fw * screen.pic.width), h = Math.round(fh * screen.pic.height);
    const rx = Math.max(0, Math.min(screen.pic.width - w, Math.round(x * screen.pic.width - w / 2))), ry = Math.max(0, Math.min(screen.pic.height - h, Math.round(y * screen.pic.height - h / 2)));
    const tiny = document.createElement('canvas'); tiny.width = Math.max(1, Math.round(w / 16)); tiny.height = Math.max(1, Math.round(h / 16));
    tiny.getContext('2d')!.drawImage(screen.pic.source, rx, ry, w, h, 0, 0, tiny.width, tiny.height);
    (tiny as HTMLCanvasElement & { rect?: number[] }).rect = [rx, ry, w, h]; pixelated.set(screen, tiny); return tiny;
  };

  const drawMark = (ctx: CanvasRenderingContext2D, screen: Screen, p: { x: number; y: number }, local: number, scale: number) => {
    const t = local - 0.8; if (t < 0 || screen.mark.style === 'none') return;
    const appear = easeOut(t / 0.3); const r = frame.sw * 0.07 * scale; ctx.save(); ctx.globalAlpha = appear; ctx.translate(p.x, p.y);
    if (screen.mark.style === 'tap') {
      for (let k = 0; k < 3; k += 1) { const ph = ((t * 0.9 + k / 3) % 1); ctx.globalAlpha = appear * (1 - ph) * 0.8; ctx.strokeStyle = look.accent; ctx.lineWidth = 5 * px * scale; ctx.beginPath(); ctx.arc(0, 0, r * (0.5 + ph * 1.5), 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = appear; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.strokeStyle = look.accent; ctx.lineWidth = 6 * px * scale; ctx.beginPath(); ctx.arc(0, 0, r * 0.5 * (1 - 0.12 * Math.sin(t * 6)), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (screen.mark.style === 'box') {
      const pulse = 1 + 0.04 * Math.sin(t * 5); const w = frame.sw * 0.3 * pulse * scale, h = frame.sw * 0.13 * pulse * scale; ctx.strokeStyle = look.accent; ctx.lineWidth = 6 * px * scale; roundRect(ctx, -w / 2, -h / 2, w, h, h * 0.25); ctx.stroke();
    } else {
      const fromRight = screen.mark.x < 0.5; const dir = fromRight ? 1 : -1; const bounce = Math.sin(t * 7) * r * 0.25; const len = r * 2.2; ctx.fillStyle = look.accent; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4 * px * scale;
      ctx.translate(dir * (r * 0.5 + bounce), 0); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dir * r * 0.9, -r * 0.7); ctx.lineTo(dir * r * 0.9, -r * 0.3); ctx.lineTo(dir * len, -r * 0.3); ctx.lineTo(dir * len, r * 0.3); ctx.lineTo(dir * r * 0.9, r * 0.3); ctx.lineTo(dir * r * 0.9, r * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };

  /** One screen: the frame, the picture with its scroll, zoom, cover and mark, and the words. */
  const drawScreen = (ctx: CanvasRenderingContext2D, k: number, local: number, span: number) => {
    const screen = screens[k]!; const pic = screen.pic; const { sx, sy, sw, sh } = frame;
    bezel(ctx);
    const sc = sw / pic.width; const imgH = pic.height * sc; const tall = imgH > sh * 1.02;
    let oy = 0;
    if (tall && options.scroll) { const dur = Math.max(1, span - 1.4); oy = (imgH - sh) * easeInOut((local - 0.7) / dur); }
    const px0 = sx, py0 = sy - oy; const fitsShort = imgH < sh;
    ctx.save(); roundRect(ctx, sx, sy, sw, sh, options.device === 'phone' ? sw * 0.09 : options.device === 'laptop' ? 0 : 20 * px); ctx.clip();
    if (fitsShort) { ctx.fillStyle = '#ffffff'; ctx.fillRect(sx, sy, sw, sh); }
    const markPoint = { x: px0 + screen.mark.x * pic.width * sc, y: py0 + screen.mark.y * imgH };
    const zoom = screen.mark.zoom && screen.mark.style !== 'none' ? 1 + 0.55 * easeInOut((local - 0.9) / 0.7) * (1 - easeInOut((local - (span - 0.5)) / 0.45)) : 1;
    ctx.translate(markPoint.x, markPoint.y); ctx.scale(zoom, zoom); ctx.translate(-markPoint.x, -markPoint.y);
    ctx.save(); ctx.translate(px0, py0); ctx.scale(sc, sc); ctx.drawImage(pic.source, 0, 0, pic.width, pic.height);
    if (screen.hide.on) {
      const tiny = hideBlock(screen) as HTMLCanvasElement & { rect: number[] }; const [rx, ry, rw, rh] = tiny.rect as [number, number, number, number];
      ctx.imageSmoothingEnabled = false; ctx.drawImage(tiny, rx, ry, rw, rh); ctx.imageSmoothingEnabled = true; ctx.fillStyle = 'rgba(100,116,139,0.35)'; ctx.fillRect(rx, ry, rw, rh);
    }
    ctx.restore();
    drawMark(ctx, screen, markPoint, local, 1 / Math.sqrt(zoom));
    ctx.restore();
    // Words.
    const text = screen.label.trim(); if (!text || options.label === 'none') return;
    const a = Math.min(easeOut((local - 0.3) / 0.4), clamp01((span - local) / 0.3 + 0.2)); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const maxW = frame.lw; const size = options.label === 'big' ? U * 0.075 : U * 0.05; let s = size; const words = text.split(/\s+/); let lines: string[] = [];
    for (; s >= U * 0.03; s -= 2) { ctx.font = `700 ${s}px ${FAM}`; lines = []; let line = ''; for (const w of words) { const trial = line ? `${line} ${w}` : w; if (ctx.measureText(trial).width <= maxW - U * 0.08 || !line) line = trial; else { lines.push(line); line = w; } } if (line) lines.push(line); if (lines.length <= 3) break; }
    const lh = s * 1.2; const cx = frame.lx; const total = lines.length * lh;
    if (options.label === 'card') { const wMax = Math.max(...lines.map((l) => ctx.measureText(l).width)) + U * 0.1; ctx.fillStyle = look.card; ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 18 * px; ctx.shadowOffsetY = 5 * px; roundRect(ctx, cx - wMax / 2, frame.ly - total / 2 - U * 0.025, wMax, total + U * 0.05, U * 0.03); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.fillStyle = look.cardInk; }
    else ctx.fillStyle = look.ink;
    lines.forEach((l, i) => ctx.fillText(l, cx, frame.ly - total / 2 + lh / 2 + i * lh));
    ctx.restore();
  };

  const background = (ctx: CanvasRenderingContext2D) => { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, look.bg[0]); g.addColorStop(1, look.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
  const tr = 0.7;

  const paint = (ctx: CanvasRenderingContext2D, seconds: number) => {
    const t = Math.max(0, seconds);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; background(ctx);
    if (screens.length === 0) return;
    let k = 0; screens.forEach((_, i) => { if (timeline.starts[i]! <= t) k = i; });
    const local = t - timeline.starts[k]!; const span = timeline.ends[k]! - timeline.starts[k]!;
    const p = k > 0 ? clamp01(local / tr) : 1;
    if (k > 0 && p < 1) {
      const e = easeInOut(p); const prevLocal = t - timeline.starts[k - 1]!; const prevSpan = timeline.ends[k - 1]! - timeline.starts[k - 1]!;
      if (options.transition === 'fade') { drawScreen(ctx, k - 1, prevLocal, prevSpan); ctx.globalAlpha = e; drawScreen(ctx, k, local, span); ctx.globalAlpha = 1; }
      else if (options.transition === 'slide') { ctx.save(); ctx.translate(-e * W, 0); drawScreen(ctx, k - 1, prevLocal, prevSpan); ctx.restore(); ctx.save(); ctx.translate((1 - e) * W, 0); drawScreen(ctx, k, local, span); ctx.restore(); }
      else { ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 - 0.12 * e, 1 - 0.12 * e); ctx.translate(-W / 2, -H / 2); ctx.globalAlpha = 1 - e; drawScreen(ctx, k - 1, prevLocal, prevSpan); ctx.restore(); ctx.globalAlpha = 1; ctx.save(); ctx.translate(W / 2, H / 2); const s2 = 1.15 - 0.15 * e; ctx.scale(s2, s2); ctx.translate(-W / 2, -H / 2); ctx.globalAlpha = e; drawScreen(ctx, k, local, span); ctx.restore(); ctx.globalAlpha = 1; }
    } else if (k === 0) {
      const e = easeBack(local / 0.7); ctx.save(); ctx.globalAlpha = clamp01(local / 0.4); ctx.translate(0, (1 - e) * H * 0.08); drawScreen(ctx, k, local, span); ctx.restore();
    } else drawScreen(ctx, k, local, span);
    const left = timeline.duration - t; if (left < 0.5) { ctx.globalAlpha = 1 - clamp01(left / 0.5); background(ctx); ctx.globalAlpha = 1; }
  };
  return { duration: timeline.duration, paint };
}
