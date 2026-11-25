/**
 * Draws the Photo Story Video: a title card, your photos with a slow zoom or pan and a caption on each, and an end card.
 * The picture at any moment is worked out from the time alone, so the preview, the slider and the recorded video all match.
 */

import { FONT_FAMILIES, type FontId, type SpeedId } from '../sequence/scene';

export type LookId = 'clean' | 'night' | 'paper' | 'bold';
export type MotionId = 'auto' | 'in' | 'out' | 'left' | 'right' | 'up' | 'none';
export type TransitionId = 'fade' | 'slide' | 'zoom' | 'cut';
export type CaptionId = 'bar' | 'center' | 'cinema' | 'none';
export type FillId = 'fill' | 'fit' | 'polaroid';

export interface Pic { source: CanvasImageSource; width: number; height: number }
export interface Slide { kind: 'title' | 'photo' | 'end'; pic: Pic | null; caption: string; motion: MotionId; /** 0 for automatic. */ seconds: number }

export interface Look { bg: [string, string]; ink: string; card: string; cardInk: string; accent: string; font: FontId; stroke: number }
export const LOOKS: Record<LookId, Look> = {
  clean: { bg: ['#fff7ed', '#fed7aa'], ink: '#1f2937', card: '#ffffff', cardInk: '#1f2937', accent: '#ea580c', font: 'clean', stroke: 0 },
  night: { bg: ['#0b1020', '#1e1b4b'], ink: '#f8fafc', card: '#0f172a', cardInk: '#f8fafc', accent: '#22d3ee', font: 'clean', stroke: 0 },
  paper: { bg: ['#fbf3e0', '#e9d5a8'], ink: '#3b2a14', card: '#fffaf0', cardInk: '#3b2a14', accent: '#b45309', font: 'friendly', stroke: 0 },
  bold: { bg: ['#fde047', '#fb923c'], ink: '#111111', card: '#ffffff', cardInk: '#111111', accent: '#e11d48', font: 'clean', stroke: 5 },
};

export interface StoryOptions { look: LookId; font: FontId; speed: SpeedId; transition: TransitionId; caption: CaptionId; fill: FillId; motion: MotionId }

export interface Timeline { starts: number[]; ends: number[]; duration: number }

const BASE: Record<SpeedId, number> = { slow: 5, normal: 3.8, fast: 2.6 };
const TAIL = 0.6;

/** How long each slide stays: its own seconds, or a base time plus a little for a long caption. Title and end cards are shorter. */
const wanted = (slides: Slide[], speed: SpeedId) => slides.map((slide) => slide.seconds > 0 ? slide.seconds : (slide.kind === 'photo' ? BASE[speed] : BASE[speed] * 0.7) + Math.min(2, slide.caption.length * 0.04));

export function buildTimeline(slides: Slide[], speed: SpeedId, extras: { stepTimes?: number[] | null; minDuration?: number; fitTo?: number } = {}): Timeline {
  const want = wanted(slides, speed);
  const given = extras.stepTimes && extras.stepTimes.length === want.length ? extras.stepTimes : null;
  const starts: number[] = []; let end = 0;
  if (given) {
    given.forEach((value, k) => starts.push(k === 0 ? Math.max(0, value) : Math.max(value, starts[k - 1]! + 0.5)));
    end = (starts[starts.length - 1] ?? 0) + (want[want.length - 1] ?? 1);
  } else {
    const total = want.reduce((sum, value) => sum + value, 0);
    const stretch = extras.fitTo && total > 0 ? Math.max(0.4, Math.min(6, (extras.fitTo - TAIL) / total)) : 1;
    let cursor = 0; for (const value of want) { starts.push(cursor); cursor += value * stretch; }
    end = cursor;
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

const AUTO: MotionId[] = ['in', 'left', 'out', 'right', 'up'];

export interface Renderer { duration: number; paint: (ctx: CanvasRenderingContext2D, seconds: number) => void }

export function makeRenderer(slides: Slide[], options: StoryOptions, W: number, H: number, timeline: Timeline): Renderer {
  const look = LOOKS[options.look]; const FAM = FONT_FAMILIES[options.font]; const U = Math.min(W, H * 0.75); const px = U / 1080;
  const tr = 0.7;
  const blurred = new Map<Pic, HTMLCanvasElement>();
  const blurOf = (pic: Pic) => {
    let c = blurred.get(pic);
    if (!c) { c = document.createElement('canvas'); c.width = 32; c.height = Math.max(8, Math.round((32 * pic.height) / pic.width)); c.getContext('2d')!.drawImage(pic.source, 0, 0, c.width, c.height); blurred.set(pic, c); }
    return c;
  };
  const motionOf = (slide: Slide, index: number): MotionId => { const m = slide.motion !== 'auto' ? slide.motion : options.motion; return m === 'auto' ? AUTO[index % AUTO.length]! : m; };

  const wrap = (ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number, size: number, weight: number, min: number) => {
    for (let s = size; s >= min; s -= 2) {
      ctx.font = `${weight} ${s}px ${FAM}`; const lines: string[] = []; let line = '';
      for (const word of text.split(/\s+/).filter(Boolean)) { const trial = line ? `${line} ${word}` : word; if (ctx.measureText(trial).width <= maxW || !line) line = trial; else { lines.push(line); line = word; } }
      if (line) lines.push(line);
      if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxW)) return { lines, size: s };
    }
    ctx.font = `${weight} ${min}px ${FAM}`; const lines = [text]; while (lines[0]!.length > 1 && ctx.measureText(lines[0]!).width > maxW) lines[0] = `${lines[0]!.slice(0, -2)}…`;
    return { lines, size: min };
  };

  /** The photo with its slow move. `local` is the seconds since this slide began, `span` how long it lasts. */
  const drawPhoto = (ctx: CanvasRenderingContext2D, slide: Slide, index: number, local: number, span: number, box: { x: number; y: number; w: number; h: number }, cover: boolean) => {
    const pic = slide.pic!; const motion = motionOf(slide, index); const p = clamp01(local / Math.max(0.5, span + tr));
    const iw = pic.width, ih = pic.height;
    const baseScale = cover ? Math.max(box.w / iw, box.h / ih) : Math.min(box.w / iw, box.h / ih);
    let zoom = 1.0, ox = 0, oy = 0; const room = 0.12;
    if (motion === 'in') zoom = 1 + room * p; else if (motion === 'out') zoom = 1 + room * (1 - p);
    else if (motion !== 'none') { zoom = 1 + room; const travel = room * 0.4; const f = (p - 0.5) * 2; if (motion === 'left') ox = -f * travel * box.w; if (motion === 'right') ox = f * travel * box.w; if (motion === 'up') oy = -f * travel * box.h; }
    const dw = iw * baseScale * zoom, dh = ih * baseScale * zoom;
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip();
    ctx.drawImage(pic.source, box.x + box.w / 2 - dw / 2 + ox, box.y + box.h / 2 - dh / 2 + oy, dw, dh);
    ctx.restore();
  };

  const drawCaption = (ctx: CanvasRenderingContext2D, text: string, local: number, span: number) => {
    if (!text || options.caption === 'none') return;
    const inA = easeOut((local - 0.35) / 0.4), outA = 1 - clamp01((local - (span - 0.2)) / 0.4); const a = Math.min(inA, outA); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; const pad = U * 0.06; const maxW = W - pad * 2 - U * 0.08;
    if (options.caption === 'center') {
      const g = ctx.createLinearGradient(0, H * 0.5, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.65)'); ctx.fillStyle = g; ctx.fillRect(0, H * 0.5, W, H * 0.5);
      const f = wrap(ctx, text, W - pad * 2, 3, U * 0.075, 700, U * 0.04); const lh = f.size * 1.18; ctx.font = `700 ${f.size}px ${FAM}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12 * px;
      const top = H - pad * 1.6 - f.lines.length * lh + lh / 2; f.lines.forEach((l, k) => ctx.fillText(l, W / 2, top + k * lh));
    } else if (options.caption === 'cinema') {
      const f = wrap(ctx, text, W - pad * 2, 2, U * 0.05, 500, U * 0.032); const lh = f.size * 1.25; ctx.font = `500 ${f.size}px ${FAM}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const barH = H * 0.14; const top = H - barH + (barH - f.lines.length * lh) / 2 + lh / 2; f.lines.forEach((l, k) => ctx.fillText(l, W / 2, top + k * lh));
    } else {
      const f = wrap(ctx, text, maxW, 3, U * 0.052, 700, U * 0.032); const lh = f.size * 1.22; const cardH = f.lines.length * lh + U * 0.07; const y = H - pad - cardH - U * 0.02; const slide = 1 - easeOut((local - 0.35) / 0.4);
      ctx.translate(0, slide * U * 0.04);
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 20 * px; ctx.shadowOffsetY = 6 * px; ctx.fillStyle = look.card; roundRect(ctx, pad, y, W - pad * 2, cardH, U * 0.03); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; if (look.stroke) { ctx.strokeStyle = look.cardInk; ctx.lineWidth = look.stroke * px; ctx.stroke(); }
      ctx.fillStyle = look.accent; roundRect(ctx, pad, y, U * 0.016, cardH, U * 0.008); ctx.fill();
      ctx.font = `700 ${f.size}px ${FAM}`; ctx.fillStyle = look.cardInk; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; f.lines.forEach((l, k) => ctx.fillText(l, pad + U * 0.045, y + U * 0.035 + lh / 2 + k * lh));
    }
    ctx.restore();
  };

  /** One slide, drawn on its own so a transition can place two of them on screen together. */
  const drawSlide = (ctx: CanvasRenderingContext2D, k: number, local: number) => {
    const slide = slides[k]!; const span = timeline.ends[k]! - timeline.starts[k]!;
    if (slide.kind !== 'photo' || !slide.pic) {
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, look.bg[0]); g.addColorStop(1, look.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const text = slide.caption || ''; if (!text) return;
      const pop = easeBack(local / 0.5); const f = wrap(ctx, text, W - U * 0.2, 4, U * 0.1, 700, U * 0.05); const lh = f.size * 1.18;
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(0.92 + 0.08 * Math.max(0, pop), 0.92 + 0.08 * Math.max(0, pop)); ctx.globalAlpha = clamp01(local / 0.3);
      ctx.font = `700 ${f.size}px ${FAM}`; ctx.fillStyle = look.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const top = -((f.lines.length - 1) * lh) / 2; f.lines.forEach((l, i) => ctx.fillText(l, 0, top + i * lh));
      ctx.fillStyle = look.accent; roundRect(ctx, -U * 0.08, top + f.lines.length * lh - lh * 0.2, U * 0.16, U * 0.014, U * 0.007); ctx.fill(); ctx.restore(); return;
    }
    const pic = slide.pic;
    const letter = options.caption === 'cinema' ? H * 0.14 : 0;
    if (options.fill === 'fill') {
      drawPhoto(ctx, slide, k, local, span, { x: 0, y: 0, w: W, h: H }, true);
    } else if (options.fill === 'fit') {
      ctx.drawImage(blurOf(pic), 0, 0, W, H); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H);
      drawPhoto(ctx, slide, k, local, span, { x: 0, y: 0, w: W, h: H }, false);
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, look.bg[0]); g.addColorStop(1, look.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const angle = ((k % 2 === 0 ? -1 : 1) * 2.2 * Math.PI) / 180; const cw = Math.min(W * 0.84, H * 0.7 * (pic.width / pic.height) + U * 0.1), border = U * 0.035; const innerW = cw - border * 2; const innerH = Math.min(innerW * (pic.height / pic.width), H * 0.62); const cardH = innerH + border * 2 + U * 0.14;
      const enter = easeOut(local / 0.6);
      ctx.save(); ctx.translate(W / 2, H * 0.46 + (1 - enter) * U * 0.05); ctx.rotate(angle + (1 - enter) * 0.04); ctx.globalAlpha = clamp01(enter * 1.4);
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 28 * px; ctx.shadowOffsetY = 10 * px; ctx.fillStyle = '#ffffff'; ctx.fillRect(-cw / 2, -cardH / 2, cw, cardH); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      drawPhoto(ctx, slide, k, local, span, { x: -innerW / 2 + 0, y: -cardH / 2 + border, w: innerW, h: innerH }, true) ;
      if (slide.caption && options.caption !== 'none') { ctx.font = `500 ${U * 0.045}px ${FONT_FAMILIES.friendly}`; ctx.fillStyle = '#374151'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; let s = slide.caption; while (s.length > 1 && ctx.measureText(s).width > innerW) s = `${s.slice(0, -2)}…`; ctx.fillText(s, 0, cardH / 2 - U * 0.06); }
      ctx.restore(); return;
    }
    if (options.caption === 'cinema') { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, letter * 0.45); ctx.fillRect(0, H - letter, W, letter); }
    drawCaption(ctx, slide.caption, local, span);
  };

  const paint = (ctx: CanvasRenderingContext2D, seconds: number) => {
    const t = Math.max(0, seconds);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
    let k = 0; slides.forEach((_, i) => { if (timeline.starts[i]! <= t) k = i; });
    if (slides.length === 0) return;
    const local = t - timeline.starts[k]!;
    const p = k > 0 && options.transition !== 'cut' ? clamp01(local / tr) : 1;
    if (k > 0 && p < 1) {
      const e = easeInOut(p); const prevLocal = t - timeline.starts[k - 1]!;
      if (options.transition === 'fade') { drawSlide(ctx, k - 1, prevLocal); ctx.globalAlpha = e; drawSlide(ctx, k, local); ctx.globalAlpha = 1; }
      else if (options.transition === 'slide') { ctx.save(); ctx.translate(-e * W, 0); drawSlide(ctx, k - 1, prevLocal); ctx.restore(); ctx.save(); ctx.translate((1 - e) * W, 0); drawSlide(ctx, k, local); ctx.restore(); }
      else { ctx.save(); ctx.translate(W / 2, H / 2); const s = 1 - 0.1 * e; ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); ctx.globalAlpha = 1 - e; drawSlide(ctx, k - 1, prevLocal); ctx.restore(); ctx.globalAlpha = 1; ctx.save(); ctx.translate(W / 2, H / 2); const s2 = 1.2 - 0.2 * e; ctx.scale(s2, s2); ctx.translate(-W / 2, -H / 2); ctx.globalAlpha = e; drawSlide(ctx, k, local); ctx.restore(); ctx.globalAlpha = 1; }
    } else drawSlide(ctx, k, local);
    // The first slide fades in from black, and the last fades out.
    if (k === 0) { const a = 1 - clamp01(t / 0.5); if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; } }
    const left = timeline.duration - t; if (left < 0.6) { ctx.globalAlpha = 1 - clamp01(left / 0.6); ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  };

  return { duration: timeline.duration, paint };
}
