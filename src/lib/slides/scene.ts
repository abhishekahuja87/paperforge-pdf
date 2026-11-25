/**
 * Draws slide decks and animates them one step at a time, like a presentation that builds up while someone talks.
 * makeRenderer lays every slide out for a picture size (text is shrunk until the slide fits) and paints any moment.
 * buildTimeline decides when each step starts, from the amount of text or from the moments a voice recording was tapped.
 */
import { THEMES, fontCss, type FontId, type SpeedId, type ThemeId } from '../sequence/scene';
import type { BulletRow, Cell, Deck, Row, Slide } from './parse';

export interface SlideOptions { boxes: boolean; theme: ThemeId; font: FontId; speed: SpeedId }
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
    default: return (0.9 + info.text.length * 0.045) * m;
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

const MARGIN = 60;
interface CellBox { cell: Cell; x: number; y: number; w: number; h: number; lines: string[]; imageH: number }
interface RowBox { row: Row; y: number; h: number; left?: CellBox; right?: CellBox; centre?: CellBox; lines: string[]; arrowLines: string[]; arrowY: number; gapX: number; gapW: number }
interface SlideLayout { fs: number; rows: RowBox[]; top: number; overflow: boolean; titleLines: string[] }

const LHF = 1.28;

export interface Renderer { duration: number; paint: (ctx: CanvasRenderingContext2D, seconds: number) => void; /** Slides whose text had to be shrunk a lot to fit: tell the person to split them. */ crowded: number[] }

export function makeRenderer(deck: Deck, options: SlideOptions, images: Map<string, Pic>, W: number, H: number, timeline: Timeline): Renderer {
  const measure = document.createElement('canvas').getContext('2d')!;
  const aspect = W / H;
  const LW = aspect < 0.7 ? 900 : aspect < 0.9 ? 1000 : aspect < 1.2 ? 1100 : 1600;
  const s = W / LW; const LHs = H / s;
  const theme = THEMES[options.theme];
  const fsMax = Math.min(72, (LW / 900) * 58);
  const cellW = (LW - MARGIN * 2) * 0.36;
  const gapW = LW - MARGIN * 2 - cellW * 2;

  /** True when one word is wider than the space, so it would be cut in the middle. The text is then shrunk instead. */
  const breaksWord = (text: string, width: number) => text.split(/\s+/).some((word) => measure.measureText(word).width > width);
  const layoutAt = (slide: Slide, fs: number): SlideLayout => {
    const lh = fs * LHF; measure.font = fontCss(options.font, fs);
    const titleLines = slide.title ? (measure.font = fontCss(options.font, fs * 1.2), wrap(measure, slide.title, LW - MARGIN * 2, 2)) : [];
    const titleH = titleLines.length ? titleLines.length * fs * 1.2 * LHF + 36 : 0;
    const top = 60 + titleH; const availH = LHs - top - 60;
    const gap = fs * 0.8; const rows: RowBox[] = []; let y = 0; let tooWide = false;
    const cellBox = (cell: Cell, width: number, x: number): CellBox => {
      measure.font = fontCss(options.font, fs);
      const lines = cell.text ? wrap(measure, cell.text, width - 44, 4) : [];
      if (cell.text && (breaksWord(cell.text, width - 44) || lines.length >= 4)) tooWide = true;
      const pic = cell.image ? images.get(cell.image) : undefined;
      const imageH = pic ? Math.min(width * (pic.height / pic.width), availH * 0.42, width * 1.1) : 0;
      const h = (imageH ? imageH + 24 : 18) + (lines.length ? lines.length * lh + 18 : imageH ? 6 : 18) + (imageH && lines.length ? 0 : 0);
      return { cell, x, y: 0, w: width, h, lines, imageH };
    };
    for (const row of slide.rows) {
      const box: RowBox = { row, y, h: 0, lines: [], arrowLines: [], arrowY: 0, gapX: 0, gapW };
      if (row.kind === 'pair') {
        if (row.left) box.left = cellBox(row.left, cellW, MARGIN);
        if (row.right) box.right = cellBox(row.right, cellW, LW - MARGIN - cellW);
        measure.font = fontCss(options.font, fs * 0.72);
        if (row.arrow?.label) { box.arrowLines = wrap(measure, row.arrow.label, gapW - 24, 3); if (breaksWord(row.arrow.label, gapW - 24) || box.arrowLines.length >= 3) tooWide = true; }
        box.gapX = MARGIN + cellW;
        const cellsH = Math.max(box.left?.h ?? 0, box.right?.h ?? 0);
        const arrowH = box.arrowLines.length * fs * 0.72 * LHF + fs * 1.4;
        box.h = Math.max(cellsH, arrowH, fs * 2);
        for (const c of [box.left, box.right]) if (c) { c.y = y + (box.h - c.h) / 2; }
        box.arrowY = y + box.h / 2 + (box.arrowLines.length * fs * 0.72 * LHF) / 2;
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
    for (const r of rows) { r.y += offset; for (const c of [r.left, r.right, r.centre]) if (c) c.y += offset; r.arrowY += offset; }
    return { fs, rows, top, overflow: total > availH || tooWide, titleLines };
  };

  const crowded: number[] = [];
  const layouts: (SlideLayout | null)[] = deck.slides.map((slide, k) => {
    if (slide.firstStep < 0) return null;
    let fs = fsMax; let found = layoutAt(slide, fs);
    while (found.overflow && fs > 22) { fs -= 2; found = layoutAt(slide, fs); }
    if (found.overflow || fs < fsMax * 0.55) crowded.push(k);
    return found;
  });
  const active = deck.slides.map((slide, k) => (slide.firstStep >= 0 ? k : -1)).filter((k) => k >= 0);

  const slideStart = (k: number) => (active[0] === k ? 0 : timeline.starts[deck.slides[k]!.firstStep] ?? 0);
  const liveStep = (t: number) => timeline.starts.findIndex((start, n) => t >= start && t < timeline.ends[n]!);
  const q = (n: number, t: number) => { const span = Math.min(0.7, Math.max(0.3, (timeline.ends[n]! - timeline.starts[n]!) * 0.7)); return easeOut((t - timeline.starts[n]!) / span); };

  const paintSlide = (ctx: CanvasRenderingContext2D, k: number, t: number, alpha: number, dx: number) => {
    const slide = deck.slides[k]!; const layout = layouts[k]; if (!layout) return;
    const fs = layout.fs; const live = liveStep(t);
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(dx, 0); ctx.textBaseline = 'middle'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // Title.
    if (layout.titleLines.length) {
      const ta = easeOut((t - slideStart(k)) / 0.5); ctx.save(); ctx.globalAlpha = alpha * ta; ctx.fillStyle = theme.ink; ctx.textAlign = 'center'; ctx.font = fontCss(options.font, fs * 1.2);
      layout.titleLines.forEach((text, n) => ctx.fillText(text, LW / 2, 60 + fs * 0.7 + n * fs * 1.2 * LHF + (1 - ta) * -16)); ctx.restore();
      ctx.save(); ctx.globalAlpha = alpha * ta; ctx.strokeStyle = theme.accent; ctx.lineWidth = 5; const underline = 60 + layout.titleLines.length * fs * 1.2 * LHF + 6; ctx.beginPath(); ctx.moveTo(LW / 2 - 70, underline); ctx.lineTo(LW / 2 + 70, underline); ctx.stroke(); ctx.restore();
    }
    const drawCell = (box: CellBox, zone: 'left' | 'right' | 'center') => {
      const n = box.cell.step; if (t < timeline.starts[n]!) return;
      const p = q(n, t); const colour = n === live ? theme.accent : theme.ink;
      ctx.save(); ctx.globalAlpha = alpha * p; const shift = (1 - p) * (zone === 'left' ? -50 : zone === 'right' ? 50 : 0); ctx.translate(shift, zone === 'center' ? (1 - p) * 24 : 0);
      const boxed = options.boxes && zone !== 'center';
      if (boxed) { ctx.fillStyle = theme.fill; ctx.strokeStyle = colour; ctx.lineWidth = 3.5; roundRect(ctx, box.x, box.y, box.w, box.h, 22); ctx.fill(); ctx.stroke(); }
      let cy = box.y + 12;
      const pic = box.cell.image ? images.get(box.cell.image) : undefined;
      if (pic && box.imageH) {
        const ratio = Math.min((box.w - 24) / pic.width, box.imageH / pic.height); const iw = pic.width * ratio, ih = pic.height * ratio;
        ctx.save(); roundRect(ctx, box.x + (box.w - iw) / 2, cy, iw, ih, 14); ctx.clip(); ctx.drawImage(pic.source, box.x + (box.w - iw) / 2, cy, iw, ih); ctx.restore(); cy += box.imageH + 12;
      }
      ctx.fillStyle = theme.ink; ctx.textAlign = 'center'; ctx.font = fontCss(options.font, fs);
      box.lines.forEach((text, i) => ctx.fillText(text, box.x + box.w / 2, cy + fs * LHF / 2 + i * fs * LHF));
      ctx.restore();
    };
    for (const row of layout.rows) {
      const r = row.row;
      if (r.kind === 'pair') {
        if (row.left) drawCell(row.left, 'left');
        if (row.right) drawCell(row.right, 'right');
        const a = r.arrow;
        if (a && t >= timeline.starts[a.step]!) {
          const p = q(a.step, t); const colour = a.step === live ? theme.accent : theme.ink;
          const x1 = row.gapX + 18, x2 = row.gapX + row.gapW - 18; const from = a.back ? x2 : x1, to = a.back ? x1 : x2; const y = row.arrowY;
          const tip = from + (to - from) * p; const dir = a.back ? -1 : 1;
          ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = colour; ctx.fillStyle = colour; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(from, y); ctx.lineTo(tip, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(tip + dir * 4, y); ctx.lineTo(tip - dir * 26, y - 16); ctx.lineTo(tip - dir * 26, y + 16); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = alpha * clamp01((p - 0.2) / 0.6); ctx.textAlign = 'center'; ctx.font = fontCss(options.font, fs * 0.72); ctx.fillStyle = a.step === live ? theme.accent : theme.ink;
          row.arrowLines.forEach((text, i) => ctx.fillText(text, row.gapX + row.gapW / 2, y - 30 - (row.arrowLines.length - 1 - i) * fs * 0.72 * LHF));
          ctx.restore();
        }
      } else if (r.kind === 'center' && row.centre) drawCell(row.centre, 'center');
      else if (r.kind === 'bullet') drawBullet(ctx, r, row, fs, t, alpha, live);
      else if (r.kind === 'big') {
        if (t < timeline.starts[r.step]!) continue;
        const p = q(r.step, t); ctx.save(); ctx.globalAlpha = alpha * p; ctx.translate(LW / 2, row.y + row.h / 2); ctx.scale(0.8 + 0.2 * p, 0.8 + 0.2 * p);
        ctx.fillStyle = r.step === live ? theme.accent : theme.ink; ctx.textAlign = 'center'; ctx.font = fontCss(options.font, fs * 1.9);
        row.lines.forEach((text, i) => ctx.fillText(text, 0, (i - (row.lines.length - 1) / 2) * fs * 1.9 * LHF)); ctx.restore();
      } else if (r.kind === 'down') {
        if (t < timeline.starts[r.step]!) continue;
        const p = q(r.step, t); const colour = r.step === live ? theme.accent : theme.ink; const x = LW / 2; const y1 = row.y + 6, y2 = row.y + row.h - 6; const tip = y1 + (y2 - y1) * p;
        ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = colour; ctx.fillStyle = colour; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, tip); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, tip + 4); ctx.lineTo(x - 16, tip - 24); ctx.lineTo(x + 16, tip - 24); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = alpha * clamp01((p - 0.2) / 0.6); ctx.textAlign = 'left'; ctx.font = fontCss(options.font, fs * 0.8); row.lines.forEach((text, i) => ctx.fillText(text, x + 34, row.y + row.h / 2 + (i - (row.lines.length - 1) / 2) * fs * 0.8 * LHF)); ctx.restore();
      }
    }
    ctx.restore(); void slide;
  };

  function drawBullet(ctx: CanvasRenderingContext2D, r: BulletRow, row: RowBox, fs: number, t: number, alpha: number, live: number) {
    if (t < timeline.starts[r.step]!) return;
    const p = q(r.step, t); const colour = r.step === live ? theme.accent : theme.ink;
    ctx.save(); ctx.globalAlpha = alpha * p; ctx.translate((1 - p) * -40, 0); ctx.fillStyle = theme.accent; ctx.beginPath(); ctx.arc(MARGIN + 16, row.y + fs * LHF / 2, fs * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colour; ctx.textAlign = 'left'; ctx.font = fontCss(options.font, fs); row.lines.forEach((text, i) => ctx.fillText(text, MARGIN + 56, row.y + fs * LHF / 2 + i * fs * LHF)); ctx.restore();
  }

  const paint = (ctx: CanvasRenderingContext2D, t: number) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, W, H); ctx.setTransform(s, 0, 0, s, 0, 0);
    if (!active.length) { ctx.setTransform(1, 0, 0, 1, 0, 0); return; }
    let pos = 0; for (let i = 0; i < active.length; i++) if (t >= slideStart(active[i]!)) pos = i;
    const k = active[pos]!; const p = pos === 0 ? 1 : easeOut((t - slideStart(k)) / 0.45);
    if (pos > 0 && p < 1) paintSlide(ctx, active[pos - 1]!, t, 1 - p, -60 * p);
    paintSlide(ctx, k, t, p, (1 - p) * 60);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  return { duration: timeline.duration, paint, crowded };
}

