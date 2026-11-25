/**
 * Draws slide decks and animates them one step at a time, like a presentation that builds up while someone talks.
 * makeRenderer lays every slide out for a picture size (text is shrunk until it fits) and paints any moment of it.
 * buildTimeline decides when each step starts, from the amount of text or from the moments a voice recording was tapped.
 * Looks come from styles.ts and icons from icons.ts.
 */
import { fontCss, type FontId, type SpeedId } from '../sequence/scene';
import { drawIcon } from './icons';
import { STYLES, type StyleDef, type StyleId } from './styles';
import type { BulletRow, Cell, Deck, Row, Slide } from './parse';

export type LayoutId = 'auto' | 'side' | 'stacked';
export type RevealId = 'pop' | 'type';
export interface SlideOptions { style: StyleId; font: FontId; speed: SpeedId; layout: LayoutId; reveal: RevealId; zoom: boolean; boxes: boolean }
export interface Pic { source: CanvasImageSource; width: number; height: number }

// ---- timing ----

const INTRO = 0.7;
const HOLD = 1.8;
const MULT: Record<SpeedId, number> = { slow: 1.4, normal: 1, fast: 0.7 };

export interface Timeline { starts: number[]; ends: number[]; duration: number }

const wanted = (deck: Deck, speed: SpeedId): number[] => deck.steps.map((info) => {
  const m = MULT[speed];
  switch (info.kind) {
    case 'pause': return info.seconds;
    case 'arrow': return (0.9 + info.text.length * 0.04) * m;
    case 'down': return (0.9 + info.text.length * 0.04) * m;
    case 'big': return (1.4 + info.text.length * 0.05) * m;
    default: return (1 + info.text.length * 0.045) * m;
  }
});

/** Voice recording gives the exact start of every step (`stepTimes`). Without it each step gets time to be read. */
export function buildTimeline(deck: Deck, speed: SpeedId, extras: { stepTimes?: number[] | null; minDuration?: number; fitTo?: number } = {}): Timeline {
  const want = wanted(deck, speed);
  const given = extras.stepTimes && extras.stepTimes.length === want.length ? extras.stepTimes : null;
  const starts: number[] = []; let end = 0;
  if (given) {
    given.forEach((value, k) => starts.push(k === 0 ? Math.max(0, value) : Math.max(value, starts[k - 1]! + 0.2)));
    end = (starts[starts.length - 1] ?? 0) + (want[want.length - 1] ?? 1);
  } else {
    const total = want.reduce((sum, value) => sum + value, 0);
    const stretch = extras.fitTo && total > 0 ? Math.max(0.4, Math.min(6, (extras.fitTo - INTRO - HOLD) / total)) : 1;
    let cursor = INTRO; for (const value of want) { starts.push(cursor); cursor += value * stretch; }
    end = cursor;
  }
  const ends = starts.map((_, k) => (k + 1 < starts.length ? starts[k + 1]! : end));
  return { starts, ends, duration: Math.max(extras.minDuration ?? 0, end + HOLD, INTRO + 1) };
}

// ---- helpers ----

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
const easeInOut = (value: number) => { const v = clamp01(value); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
/** Rises past 1 and settles, for a springy pop. */
const easeBack = (value: number) => { const v = clamp01(value) - 1; return 1 + 2.70158 * v * v * v + 1.70158 * v * v; };

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width <= maxWidth || !line) {
        if (!line && ctx.measureText(word).width > maxWidth) {
          let piece = '';
          for (const char of word) { if (ctx.measureText(piece + char).width > maxWidth && piece) { out.push(piece); piece = ''; } piece += char; }
          line = piece;
        } else line = trial;
      } else { out.push(line); line = word; }
    }
    out.push(line);
  }
  if (out.length > maxLines) { const kept = out.slice(0, maxLines); kept[maxLines - 1] = `${kept[maxLines - 1]!.replace(/…$/, '')}…`; return kept; }
  return out;
}

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

// ---- layout ----

const MARGIN = 56;
const LHF = 1.28;
interface CellBox { cell: Cell; x: number; y: number; w: number; h: number; lines: string[]; imageH: number; iconSize: number }
interface RowBox { row: Row; y: number; h: number; left?: CellBox; right?: CellBox; centre?: CellBox; lines: string[]; arrowLines: string[]; arrowY: number; arrowTop: number; arrowH: number; gapX: number; gapW: number }
interface SlideLayout { fs: number; rows: RowBox[]; top: number; overflow: boolean; titleLines: string[]; focus: Map<number, { x: number; y: number }> }

export interface Renderer { duration: number; paint: (ctx: CanvasRenderingContext2D, seconds: number) => void; /** Slides whose text had to be shrunk a lot to fit: tell the person to split them. */ crowded: number[] }

export function makeRenderer(deck: Deck, options: SlideOptions, images: Map<string, Pic>, W: number, H: number, timeline: Timeline): Renderer {
  const measure = document.createElement('canvas').getContext('2d')!;
  const aspect = W / H;
  const LW = aspect < 0.7 ? 900 : aspect < 0.9 ? 1000 : aspect < 1.2 ? 1100 : 1600;
  const s = W / LW; const LHs = H / s;
  const st: StyleDef = STYLES[options.style] ?? STYLES.clean;
  const stacked = options.layout === 'stacked' || (options.layout === 'auto' && aspect < 0.9);
  const fsMax = stacked ? Math.min(84, (LW / 900) * 66 * st.weight) : Math.min(88, (LW / 900) * 58 * st.weight);
  const cellW = stacked ? (LW - MARGIN * 2) * 0.92 : (LW - MARGIN * 2) * 0.36;
  const gapW = LW - MARGIN * 2 - cellW * 2;

  /** True when one word is wider than the space, so it would be cut in the middle. The text is then shrunk instead. */
  const breaksWord = (text: string, width: number) => text.split(/\s+/).some((word) => measure.measureText(word).width > width);

  const layoutAt = (slide: Slide, fs: number): SlideLayout => {
    const lh = fs * LHF; measure.font = fontCss(options.font, fs);
    const titleLines = slide.title ? (measure.font = fontCss(options.font, fs * 1.15), wrap(measure, slide.title, LW - MARGIN * 2, 2)) : [];
    const titleH = titleLines.length ? titleLines.length * fs * 1.15 * LHF + 40 : 0;
    const top = 56 + titleH; const availH = LHs - top - 56;
    const gap = fs * (stacked ? 0.7 : 0.8); const rows: RowBox[] = []; let y = 0; let tooWide = false;
    const cellBox = (cell: Cell, width: number, x: number): CellBox => {
      measure.font = fontCss(options.font, fs);
      const lines = cell.text ? wrap(measure, cell.text, width - 48, 4) : [];
      if (cell.text && (breaksWord(cell.text, width - 48) || lines.length >= 4)) tooWide = true;
      const pic = cell.image ? images.get(cell.image) : undefined;
      const imageH = pic ? Math.min(width * (pic.height / pic.width), availH * 0.42, width * 1.1) : 0;
      const iconSize = cell.icon && !pic ? Math.min(fs * 2.3, width * 0.5) : 0;
      const top0 = imageH ? imageH + 28 : iconSize ? iconSize + 30 : 20;
      const h = top0 + (lines.length ? lines.length * lh + 14 : imageH || iconSize ? 8 : 20);
      return { cell, x, y: 0, w: width, h, lines, imageH, iconSize };
    };
    for (const row of slide.rows) {
      const box: RowBox = { row, y, h: 0, lines: [], arrowLines: [], arrowY: 0, arrowTop: 0, arrowH: 0, gapX: 0, gapW };
      if (row.kind === 'pair') {
        const lx = stacked ? (LW - cellW) / 2 : MARGIN, rx = stacked ? (LW - cellW) / 2 : LW - MARGIN - cellW;
        if (row.left) box.left = cellBox(row.left, cellW, lx);
        if (row.right) box.right = cellBox(row.right, cellW, rx);
        measure.font = fontCss(options.font, fs * 0.72);
        const labelWidth = stacked ? LW / 2 - MARGIN - 50 : gapW - 24;
        if (row.arrow?.label) { box.arrowLines = wrap(measure, row.arrow.label, labelWidth, 3); if (breaksWord(row.arrow.label, labelWidth) || box.arrowLines.length >= 3) tooWide = true; }
        box.gapX = MARGIN + cellW;
        if (stacked) {
          let cursor = y; const gapS = fs * 0.2;
          if (box.left) { box.left.y = cursor; cursor += box.left.h + gapS; }
          if (row.arrow || (box.left && box.right)) { box.arrowH = Math.max(fs * 2, box.arrowLines.length * fs * 0.72 * LHF + 24); box.arrowTop = cursor; cursor += box.arrowH + gapS; }
          if (box.right) { box.right.y = cursor; cursor += box.right.h + gapS; }
          box.h = Math.max(fs * 2, cursor - gapS - y);
        } else {
          const cellsH = Math.max(box.left?.h ?? 0, box.right?.h ?? 0);
          const arrowH = box.arrowLines.length * fs * 0.72 * LHF + fs * 1.4;
          box.h = Math.max(cellsH, arrowH, fs * 2);
          for (const c of [box.left, box.right]) if (c) c.y = y + (box.h - c.h) / 2;
          box.arrowY = y + box.h / 2 + (box.arrowLines.length * fs * 0.72 * LHF) / 2;
        }
      } else if (row.kind === 'center') {
        box.centre = cellBox(row.cell, LW - MARGIN * 2, MARGIN); box.centre.y = y; box.h = box.centre.h;
      } else if (row.kind === 'bullet') {
        measure.font = fontCss(options.font, fs); box.lines = wrap(measure, row.text, LW - MARGIN * 2 - 70, 3); if (breaksWord(row.text, LW - MARGIN * 2 - 70)) tooWide = true; box.h = box.lines.length * lh;
      } else if (row.kind === 'big') {
        measure.font = fontCss(options.font, fs * 1.9); box.lines = wrap(measure, row.text, LW - MARGIN * 2, 2); if (breaksWord(row.text, LW - MARGIN * 2)) tooWide = true; box.h = box.lines.length * fs * 1.9 * LHF;
      } else { measure.font = fontCss(options.font, fs * 0.8); box.lines = wrap(measure, row.label, LW - MARGIN * 2 - 140, 2); box.h = Math.max(fs * 2.6, box.lines.length * fs * 0.8 * LHF + 20); }
      rows.push(box); y += box.h + gap;
    }
    const total = Math.max(0, y - gap);
    const offset = top + Math.max(0, (availH - total) / 2);
    const focus = new Map<number, { x: number; y: number }>();
    for (const r of rows) {
      r.y += offset; r.arrowY += offset; r.arrowTop += offset;
      for (const c of [r.left, r.right, r.centre]) if (c) { c.y += offset; focus.set(c.cell.step, { x: c.x + c.w / 2, y: c.y + c.h / 2 }); }
      const row = r.row;
      if (row.kind === 'pair' && row.arrow) focus.set(row.arrow.step, stacked ? { x: LW / 2, y: r.arrowTop + r.arrowH / 2 } : { x: r.gapX + r.gapW / 2, y: r.arrowY });
      else if (row.kind !== 'pair' && row.kind !== 'center') focus.set(row.step, { x: LW / 2, y: r.y + r.h / 2 });
    }
    return { fs, rows, top, overflow: total > availH || tooWide, titleLines, focus };
  };

  const crowded: number[] = [];
  const layouts: (SlideLayout | null)[] = deck.slides.map((slide, k) => {
    if (slide.firstStep < 0) return null;
    let fs = fsMax; let found = layoutAt(slide, fs);
    while (found.overflow && fs > 22) { fs -= 2; found = layoutAt(slide, fs); }
    if (found.overflow || fs < fsMax * 0.5) crowded.push(k);
    return found;
  });
  const active = deck.slides.map((slide, k) => (slide.firstStep >= 0 ? k : -1)).filter((k) => k >= 0);

  const slideStart = (k: number) => (active[0] === k ? 0 : timeline.starts[deck.slides[k]!.firstStep] ?? 0);
  const liveStep = (t: number) => timeline.starts.findIndex((start, n) => t >= start && t < timeline.ends[n]!);
  const progress = (n: number, t: number) => { const span = Math.min(0.7, Math.max(0.3, (timeline.ends[n]! - timeline.starts[n]!) * 0.7)); return clamp01((t - timeline.starts[n]!) / span); };
  const shown = (n: number, t: number) => t >= timeline.starts[n]!;
  const typed = (lines: string[], n: number, t: number): string[] => {
    if (options.reveal !== 'type') return lines;
    const total = lines.reduce((sum, text) => sum + text.length, 0);
    const r = clamp01((t - timeline.starts[n]! - 0.12) / Math.min(2.2, 0.3 + total * 0.045));
    let left = Math.floor(r * total);
    return lines.map((text) => { const part = text.slice(0, Math.max(0, left)); left -= text.length; return part; });
  };
  const glowOn = (ctx: CanvasRenderingContext2D, colour: string, blur = 16) => { if (st.glow) { ctx.shadowColor = colour; ctx.shadowBlur = blur * s; } };
  const glowOff = (ctx: CanvasRenderingContext2D) => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; };

  const paintSlide = (ctx: CanvasRenderingContext2D, k: number, t: number, alpha: number, dx: number, allowZoom: boolean) => {
    const layout = layouts[k]; if (!layout) return;
    const fs = layout.fs; const live = liveStep(t);
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(dx, 0); ctx.textBaseline = 'middle'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // A gentle push in on the step being talked about.
    if (allowZoom && options.zoom && live >= 0) {
      const focus = layout.focus.get(live);
      if (focus) {
        const a = timeline.starts[live]!, b = timeline.ends[live]!;
        const inR = Math.min(0.6, (b - a) * 0.5), outR = Math.min(0.35, (b - a) * 0.4);
        const z = 1 + 0.085 * easeInOut((t - a) / inR) * (1 - easeInOut((t - (b - outR)) / outR));
        ctx.translate(focus.x, focus.y); ctx.scale(z, z); ctx.translate(-focus.x, -focus.y);
      }
    }

    // Title.
    if (layout.titleLines.length) {
      const ta = easeOut((t - slideStart(k)) / 0.5); ctx.save(); ctx.globalAlpha = alpha * ta; ctx.fillStyle = st.ink; ctx.textAlign = 'center'; ctx.font = fontCss(options.font, fs * 1.15); glowOn(ctx, st.accent, 10);
      layout.titleLines.forEach((text, n) => ctx.fillText(text, LW / 2, 56 + fs * 0.7 + n * fs * 1.15 * LHF + (1 - ta) * -18)); glowOff(ctx);
      ctx.strokeStyle = st.accent; ctx.lineWidth = 8; const underline = 56 + layout.titleLines.length * fs * 1.15 * LHF + 10; const half = 80 * ta; ctx.beginPath(); ctx.moveTo(LW / 2 - half, underline); ctx.lineTo(LW / 2 + half, underline); ctx.stroke(); ctx.restore();
    }

    const drawCell = (box: CellBox, zone: 'left' | 'right' | 'center') => {
      const n = box.cell.step; if (!shown(n, t)) return;
      const p = progress(n, t); const isLive = n === live; const index = zone === 'right' ? 1 : 0;
      const outline = isLive ? st.accent : st.outlines[index];
      const scale = 0.55 + 0.45 * easeBack(p);
      ctx.save(); ctx.globalAlpha = alpha * clamp01(p * 2.2); ctx.translate(box.x + box.w / 2, box.y + box.h / 2); ctx.scale(scale, scale); ctx.translate(-box.w / 2, -box.h / 2);
      const boxed = options.boxes && zone !== 'center';
      if (boxed) {
        if (st.shadow) { ctx.shadowColor = st.shadow.colour; ctx.shadowBlur = st.shadow.blur * s; ctx.shadowOffsetX = st.shadow.x * s; ctx.shadowOffsetY = st.shadow.y * s; }
        ctx.fillStyle = st.fills[index]; roundRect(ctx, 0, 0, box.w, box.h, st.radius); ctx.fill(); glowOff(ctx);
        ctx.strokeStyle = outline; ctx.lineWidth = st.stroke; glowOn(ctx, outline); roundRect(ctx, 0, 0, box.w, box.h, st.radius); ctx.stroke(); glowOff(ctx);
      }
      let cy = 14;
      const pic = box.cell.image ? images.get(box.cell.image) : undefined;
      if (pic && box.imageH) {
        const ratio = Math.min((box.w - 24) / pic.width, box.imageH / pic.height); const iw = pic.width * ratio, ih = pic.height * ratio;
        ctx.save(); roundRect(ctx, (box.w - iw) / 2, cy, iw, ih, Math.min(24, st.radius)); ctx.clip(); ctx.drawImage(pic.source, (box.w - iw) / 2, cy, iw, ih); ctx.restore(); cy += box.imageH + 14;
      } else if (box.iconSize) {
        const bob = p >= 1 ? Math.sin(t * 3 + n) * fs * 0.04 : 0;
        glowOn(ctx, st.icon.line, 10); drawIcon(ctx, box.cell.icon, box.w / 2, cy + box.iconSize / 2 + 2 + bob, box.iconSize, st.icon); glowOff(ctx); cy += box.iconSize + 16;
      }
      ctx.fillStyle = st.ink; ctx.textAlign = 'center'; ctx.font = fontCss(options.font, fs); glowOn(ctx, st.ink, 6);
      typed(box.lines, n, t).forEach((text, i) => ctx.fillText(text, box.w / 2, cy + fs * LHF / 2 + i * fs * LHF)); glowOff(ctx);
      ctx.restore();
    };

    const drawArrow = (row: RowBox, a: NonNullable<PairRowArrow>) => {
      if (!shown(a.step, t)) return;
      const p = easeOut(progress(a.step, t)); const isLive = a.step === live; const colour = isLive ? st.accent : st.ink;
      ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = colour; ctx.fillStyle = colour; ctx.lineWidth = Math.max(6, st.stroke * 1.5); glowOn(ctx, colour, 12);
      let x1: number, y1: number, x2: number, y2: number;
      if (stacked) { x1 = LW / 2; x2 = LW / 2; y1 = row.arrowTop + 6; y2 = row.arrowTop + row.arrowH - 6; if (a.back) [y1, y2] = [y2, y1]; }
      else { y1 = row.arrowY; y2 = row.arrowY; x1 = row.gapX + 18; x2 = row.gapX + row.gapW - 18; if (a.back) [x1, x2] = [x2, x1]; }
      const tx = x1 + (x2 - x1) * p, ty = y1 + (y2 - y1) * p; const len = Math.hypot(x2 - x1, y2 - y1) || 1; const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx + ux * 4, ty + uy * 4); ctx.lineTo(tx - ux * 28 - uy * 17, ty - uy * 28 + ux * 17); ctx.lineTo(tx - ux * 28 + uy * 17, ty - uy * 28 - ux * 17); ctx.closePath(); ctx.fill();
      // A bright dot keeps travelling along a finished arrow.
      if (p >= 1) { const q = ((t - timeline.starts[a.step]!) * 0.75) % 1; ctx.fillStyle = st.accent; ctx.beginPath(); ctx.arc(x1 + (x2 - x1) * q, y1 + (y2 - y1) * q, 8, 0, Math.PI * 2); ctx.fill(); }
      glowOff(ctx);
      ctx.globalAlpha = alpha * clamp01((p - 0.2) / 0.6); ctx.font = fontCss(options.font, fs * 0.72); ctx.fillStyle = colour;
      if (stacked) { ctx.textAlign = 'left'; row.arrowLines.forEach((text, i) => ctx.fillText(text, LW / 2 + 40, row.arrowTop + row.arrowH / 2 + (i - (row.arrowLines.length - 1) / 2) * fs * 0.72 * LHF)); }
      else { ctx.textAlign = 'center'; row.arrowLines.forEach((text, i) => ctx.fillText(text, row.gapX + row.gapW / 2, y1 - 30 - (row.arrowLines.length - 1 - i) * fs * 0.72 * LHF)); }
      ctx.restore();
    };

    for (const row of layout.rows) {
      const r = row.row;
      if (r.kind === 'pair') {
        if (row.left) drawCell(row.left, 'left');
        if (row.right) drawCell(row.right, 'right');
        if (r.arrow) drawArrow(row, r.arrow);
      } else if (r.kind === 'center' && row.centre) drawCell(row.centre, 'center');
      else if (r.kind === 'bullet') drawBullet(ctx, r, row, fs, t, alpha, live);
      else if (r.kind === 'big') {
        if (!shown(r.step, t)) continue;
        const p = progress(r.step, t); const sc = 0.5 + 0.5 * easeBack(p);
        ctx.save(); ctx.globalAlpha = alpha * clamp01(p * 2); ctx.translate(LW / 2, row.y + row.h / 2); ctx.scale(sc, sc);
        ctx.fillStyle = r.step === live ? st.accent : st.ink; ctx.textAlign = 'center'; ctx.font = fontCss(options.font, fs * 1.9); glowOn(ctx, r.step === live ? st.accent : st.ink, 14);
        typed(row.lines, r.step, t).forEach((text, i) => ctx.fillText(text, 0, (i - (row.lines.length - 1) / 2) * fs * 1.9 * LHF)); glowOff(ctx); ctx.restore();
      } else if (r.kind === 'down') {
        if (!shown(r.step, t)) continue;
        const p = easeOut(progress(r.step, t)); const colour = r.step === live ? st.accent : st.ink; const x = LW / 2; const y1 = row.y + 6, y2 = row.y + row.h - 6; const tip = y1 + (y2 - y1) * p;
        ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = colour; ctx.fillStyle = colour; ctx.lineWidth = Math.max(6, st.stroke * 1.5); glowOn(ctx, colour, 12); ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, tip); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, tip + 4); ctx.lineTo(x - 17, tip - 28); ctx.lineTo(x + 17, tip - 28); ctx.closePath(); ctx.fill(); glowOff(ctx);
        if (p >= 1) { const q = ((t - timeline.starts[r.step]!) * 0.75) % 1; ctx.fillStyle = st.accent; ctx.beginPath(); ctx.arc(x, y1 + (y2 - y1) * q, 8, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = alpha * clamp01((p - 0.2) / 0.6); ctx.fillStyle = colour; ctx.textAlign = 'left'; ctx.font = fontCss(options.font, fs * 0.8); row.lines.forEach((text, i) => ctx.fillText(text, x + 38, row.y + row.h / 2 + (i - (row.lines.length - 1) / 2) * fs * 0.8 * LHF)); ctx.restore();
      }
    }
    ctx.restore();
  };
  type PairRowArrow = Extract<Row, { kind: 'pair' }>['arrow'];

  function drawBullet(ctx: CanvasRenderingContext2D, r: BulletRow, row: RowBox, fs: number, t: number, alpha: number, live: number) {
    if (!shown(r.step, t)) return;
    const p = progress(r.step, t); const colour = r.step === live ? st.accent : st.ink;
    ctx.save(); ctx.globalAlpha = alpha * clamp01(p * 2); ctx.translate((1 - easeOut(p)) * -60, 0); ctx.fillStyle = st.accent; glowOn(ctx, st.accent, 10); ctx.beginPath(); ctx.arc(MARGIN + 18, row.y + fs * LHF / 2, fs * 0.22 * (0.6 + 0.4 * easeBack(p)), 0, Math.PI * 2); ctx.fill(); glowOff(ctx);
    ctx.fillStyle = colour; ctx.textAlign = 'left'; ctx.font = fontCss(options.font, fs); typed(row.lines, r.step, t).forEach((text, i) => ctx.fillText(text, MARGIN + 60, row.y + fs * LHF / 2 + i * fs * LHF)); ctx.restore();
  }

  const paintBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (Array.isArray(st.bg)) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, st.bg[0]); g.addColorStop(1, st.bg[1]); ctx.fillStyle = g; } else ctx.fillStyle = st.bg;
    ctx.fillRect(0, 0, W, H);
  };

  const paint = (ctx: CanvasRenderingContext2D, t: number) => {
    paintBackground(ctx); ctx.setTransform(s, 0, 0, s, 0, 0);
    if (!active.length) { ctx.setTransform(1, 0, 0, 1, 0, 0); return; }
    let pos = 0; for (let i = 0; i < active.length; i++) if (t >= slideStart(active[i]!)) pos = i;
    const k = active[pos]!; const p = pos === 0 ? 1 : easeOut((t - slideStart(k)) / 0.45);
    if (pos > 0 && p < 1) paintSlide(ctx, active[pos - 1]!, t, 1 - p, -70 * p, false);
    paintSlide(ctx, k, t, p, (1 - p) * 70, true);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  return { duration: timeline.duration, paint, crowded };
}
