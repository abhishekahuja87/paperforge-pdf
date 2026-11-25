/**
 * Draws a parsed sequence diagram and animates it one step at a time. makeRenderer lays the diagram out for a picture size (the layout needs
 * text measuring, so it creates a small hidden canvas) and paints any moment of it. buildTimeline decides when each step starts.
 * Pure drawing: nothing here touches the page, the microphone or storage.
 */
import type { Diagram, GroupKind, Item, MessageItem, NoteItem, Participant } from './parse';

export type ThemeId = 'light' | 'dark' | 'chalk' | 'paper';
export type FontId = 'clean' | 'friendly';
export type SpeedId = 'slow' | 'normal' | 'fast';

export interface SeqOptions { arrows: boolean; numbers: boolean; theme: ThemeId; font: FontId; speed: SpeedId }

interface Theme { bg: string; ink: string; soft: string; accent: string; fill: string; noteFill: string; noteInk: string }
export const THEMES: Record<ThemeId, Theme> = {
  light: { bg: '#ffffff', ink: '#1f2937', soft: '#94a3b8', accent: '#ea580c', fill: '#f1f5f9', noteFill: '#fef3c7', noteInk: '#44403c' },
  dark: { bg: '#111111', ink: '#f3f4f6', soft: '#6b7280', accent: '#fb923c', fill: '#262626', noteFill: '#3f3a1f', noteInk: '#fde68a' },
  chalk: { bg: '#1f3d2b', ink: '#f5f5ef', soft: '#9db8a5', accent: '#fcd34d', fill: '#2a4d38', noteFill: '#3b5d46', noteInk: '#f5f5ef' },
  paper: { bg: '#fbf1d9', ink: '#3b2f2f', soft: '#a8957a', accent: '#c2410c', fill: '#f4e6c4', noteFill: '#fde8a8', noteInk: '#3b2f2f' },
};

const FALLBACK = `'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', 'Noto Sans', system-ui, sans-serif`;
export const FONT_FAMILIES: Record<FontId, string> = { clean: `'Poppins', ${FALLBACK}`, friendly: `'Fredoka', ${FALLBACK}` };
export const fontCss = (font: FontId, size: number) => `500 ${size}px ${FONT_FAMILIES[font]}`;

// ---- timing ----

export const isStep = (item: Item) => item.kind === 'message' || item.kind === 'note' || item.kind === 'state' || item.kind === 'divider' || item.kind === 'delay' || item.kind === 'destroy' || item.kind === 'pause';
export const countSteps = (diagram: Diagram) => diagram.items.filter(isStep).length;

export interface Step { item: number; start: number; end: number }
export interface Timeline { steps: Step[]; /** When each item appears. */ at: number[]; /** How long each item takes to draw. */ anim: number[]; duration: number }

const INTRO = 1.1;
const HOLD = 1.8;
const BASE: Record<SpeedId, number> = { slow: 2.6, normal: 1.8, fast: 1.1 };

const textOf = (item: Item) => ('text' in item ? item.text : '');

/** Voice recording gives the exact start of every step (`stepTimes`); without it each step gets a time from its speed and the length of its text. */
export function buildTimeline(diagram: Diagram, speed: SpeedId, extras: { stepTimes?: number[] | null; minDuration?: number; fitTo?: number } = {}): Timeline {
  const items = diagram.items;
  const stepIdx = items.map((item, i) => (isStep(item) ? i : -1)).filter((i) => i >= 0);
  const want = stepIdx.map((i) => {
    const item = items[i]!;
    if (item.kind === 'pause') return item.seconds;
    const base = item.kind === 'message' || item.kind === 'note' ? BASE[speed] : BASE[speed] * 0.7;
    return base + Math.min(2, textOf(item).length * 0.03);
  });
  let starts: number[] = []; let end = 0;
  const given = extras.stepTimes && extras.stepTimes.length === stepIdx.length ? extras.stepTimes : null;
  if (given) {
    starts = given.map((value, k) => (k === 0 ? Math.max(0, value) : Math.max(value, given[k - 1]! + 0.2)));
    const last = starts[starts.length - 1] ?? 0;
    end = last + (want[want.length - 1] ?? 1);
  } else {
    // Optionally stretch or squeeze the steps so the picture ends with a voice file.
    const total = want.reduce((sum, value) => sum + value, 0);
    const stretch = extras.fitTo && total > 0 ? Math.max(0.4, Math.min(6, (extras.fitTo - INTRO - HOLD) / total)) : 1;
    let cursor = INTRO;
    for (const value of want) { starts.push(cursor); cursor += value * stretch; }
    end = cursor;
  }
  const steps: Step[] = stepIdx.map((item, k) => ({ item, start: starts[k]!, end: k + 1 < stepIdx.length ? starts[k + 1]! : end }));
  const duration = Math.max(extras.minDuration ?? 0, end + HOLD, INTRO + 1);
  const at = items.map(() => 0);
  const anim = items.map(() => 0.5);
  items.forEach((item, i) => {
    const k = stepIdx.indexOf(i);
    if (k >= 0) { at[i] = steps[k]!.start; anim[i] = Math.max(0.3, Math.min(0.9, (steps[k]!.end - steps[k]!.start) * 0.7)); return; }
    const startish = item.kind === 'groupStart' || item.kind === 'groupElse' || item.kind === 'activate';
    const next = stepIdx.findIndex((index) => index > i);
    const before = [...stepIdx].reverse().findIndex((index) => index < i);
    const prevK = before < 0 ? -1 : stepIdx.length - 1 - before;
    if (startish) at[i] = next >= 0 ? steps[next]!.start : (steps[steps.length - 1]?.start ?? INTRO);
    else at[i] = prevK >= 0 ? steps[prevK]!.start : INTRO;
  });
  return { steps, at, anim, duration };
}

// ---- drawing helpers ----

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
const easeInOut = (value: number) => { const v = clamp01(value); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width <= maxWidth || !line) {
        if (!line && ctx.measureText(word).width > maxWidth) {
          // One long word: break it by letters.
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

const line = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

// ---- layout ----

const LH = 38;           // line height of a label
const HEAD = 130;        // pinned header with the names
const TITLE_H = 72;
const FS = 30;           // label size

interface Row { item: Item; i: number; top: number; h: number; lines: string[]; arrowY: number; endY: number; x1: number; x2: number; boxX: number; boxW: number; depth: number; num: number }
interface Bar { who: number; depth: number; startItem: number; endItem: number; y0: number; y1: number }
interface Frame { kind: GroupKind; text: string; startItem: number; endItem: number; rowStart: number; rowEnd: number; depth: number; elses: { row: number; text: string }[] }

interface Layout { LW: number; s: number; headTop: number; cx: number[]; boxW: number; rows: Row[]; bars: Bar[]; frames: Frame[]; bottom: number; created: Map<number, { row: number; y: number }>; destroyed: Map<number, { row: number; y: number }> }

function layoutDiagram(ctx: CanvasRenderingContext2D, diagram: Diagram, options: SeqOptions, W: number, H: number): Layout {
  const n = Math.max(1, diagram.participants.length);
  const aspect = W / H;
  const baseWidth = aspect < 0.7 ? 900 : aspect < 0.9 ? 1000 : aspect < 1.2 ? 1100 : 1600;
  const LW = Math.max(baseWidth, n * 200 + 120);
  const s = W / LW;
  const margin = 60;
  const colW = (LW - margin * 2) / n;
  const cx = diagram.participants.map((_, k) => margin + colW * (k + 0.5));
  const boxW = Math.min(colW - 16, 300);
  const pIndex = new Map(diagram.participants.map((p, k) => [p.id, k]));
  const headTop = diagram.title ? TITLE_H : 0;
  ctx.font = fontCss(options.font, FS);

  const rows: Row[] = []; const bars: Bar[] = []; const frames: Frame[] = [];
  const created = new Map<number, { row: number; y: number }>(); const destroyed = new Map<number, { row: number; y: number }>();
  const open: Frame[] = []; const barStack = new Map<number, Bar[]>();
  let y = headTop + HEAD + 24; let lastArrow = y; let lastEnd = y; let number = diagram.numberFrom > 0 || options.numbers ? Math.max(1, diagram.numberFrom) : 0;
  const idx = (id: string | null, edge: number) => (id === null ? edge : cx[pIndex.get(id) ?? 0] ?? edge);

  diagram.items.forEach((item, i) => {
    const row: Row = { item, i, top: y, h: 0, lines: [], arrowY: y, endY: y, x1: 0, x2: 0, boxX: 0, boxW: 0, depth: open.length, num: 0 };
    ctx.font = fontCss(options.font, FS);
    if (item.kind === 'message') {
      const self = item.from !== null && item.from === item.to;
      const x1 = idx(item.from, 30), x2 = idx(item.to, LW - 30);
      const createdTarget = (item.mark === '*' || item.mark === '*+') && item.to !== null;
      row.x1 = x1; row.x2 = x2;
      const span = Math.abs(x2 - x1);
      const labelMax = self ? 300 : Math.max(300, Math.min(LW - 80, span - 36));
      row.lines = item.text ? wrap(ctx, item.text, labelMax, 3) : [];
      const textH = row.lines.length * LH;
      if (number > 0) row.num = number++;
      if (self) { row.h = Math.max(96, textH + 70); row.arrowY = y + Math.max(20, textH / 2 + 10); row.endY = row.arrowY + 46; }
      else { row.h = Math.max(64, textH + 48) + item.delay * 14; row.arrowY = y + textH + 16; row.endY = row.arrowY + item.delay * 14; }
      if (createdTarget) {
        row.h = Math.max(row.h, 120); row.arrowY = Math.max(row.arrowY, y + 48); row.endY = row.arrowY + item.delay * 14;
        const who = pIndex.get(item.to!)!; created.set(who, { row: i, y: row.endY });
        row.x2 = x2 + (x2 > x1 ? -boxW / 2 : boxW / 2);
      }
      lastArrow = row.arrowY; lastEnd = row.endY;
      if (item.mark === '+' || item.mark === '*+') {
        const who = item.to === null ? -1 : pIndex.get(item.to) ?? -1;
        if (who >= 0) { const stack = barStack.get(who) ?? []; const bar: Bar = { who, depth: stack.length, startItem: i, endItem: -1, y0: row.endY, y1: 0 }; stack.push(bar); barStack.set(who, stack); bars.push(bar); }
      }
      if (item.mark === '-') {
        const who = item.from === null ? -1 : pIndex.get(item.from) ?? -1; const bar = who >= 0 ? barStack.get(who)?.pop() : undefined;
        if (bar) { bar.endItem = i; bar.y1 = row.arrowY; }
      }
    } else if (item.kind === 'note' || item.kind === 'state') {
      const a = pIndex.get(item.a) ?? 0, b = item.b ? pIndex.get(item.b) ?? a : a;
      const isState = item.kind === 'state';
      let width: number; let x: number;
      if (item.kind === 'note' && item.side !== 'over') {
        width = Math.max(130, Math.min(360, item.side === 'left' ? cx[a]! - 24 : LW - cx[a]! - 24));
        x = item.side === 'left' ? cx[a]! - 22 - width : cx[a]! + 22;
      } else if (item.b && a !== b) { const left = Math.min(cx[a]!, cx[b]!), right = Math.max(cx[a]!, cx[b]!); width = right - left + 160; x = left - 80; }
      else { width = Math.max(220, Math.min(520, colW * 1.5 + 60)); x = cx[a]! - width / 2; }
      x = Math.max(10, Math.min(LW - 10 - width, x));
      row.lines = wrap(ctx, item.text || ' ', width - 44, 5);
      const noteH = row.lines.length * LH + 30;
      row.boxX = x; row.boxW = width; row.h = noteH + 34; row.arrowY = y + 12 + noteH / 2; row.endY = y + 12 + noteH;
      if (isState) row.h = Math.max(row.h, 80);
      lastArrow = row.arrowY; lastEnd = row.endY;
    } else if (item.kind === 'groupStart') {
      row.h = 66; const frame: Frame = { kind: item.group, text: item.text, startItem: i, endItem: -1, rowStart: rows.length, rowEnd: -1, depth: open.length, elses: [] };
      open.push(frame); frames.push(frame);
    } else if (item.kind === 'groupElse') { row.h = 56; open[open.length - 1]?.elses.push({ row: rows.length, text: item.text }); }
    else if (item.kind === 'groupEnd') { row.h = 30; const frame = open.pop(); if (frame) { frame.endItem = i; frame.rowEnd = rows.length; } }
    else if (item.kind === 'divider' || item.kind === 'delay') { row.h = 86; row.arrowY = y + 43; row.endY = y + 43; row.lines = wrap(ctx, item.text || (item.kind === 'delay' ? '' : ' '), LW - 200, 2); lastArrow = row.arrowY; lastEnd = row.endY; }
    else if (item.kind === 'destroy') {
      row.h = 70; row.arrowY = y + 30; row.endY = y + 30; const who = pIndex.get(item.who) ?? 0; destroyed.set(who, { row: i, y: row.arrowY });
      const bar = barStack.get(who)?.pop(); if (bar) { bar.endItem = i; bar.y1 = row.arrowY; }
    } else if (item.kind === 'activate') {
      const who = pIndex.get(item.who) ?? 0; const stack = barStack.get(who) ?? []; const bar: Bar = { who, depth: stack.length, startItem: i, endItem: -1, y0: lastArrow, y1: 0 }; stack.push(bar); barStack.set(who, stack); bars.push(bar);
    } else if (item.kind === 'deactivate') {
      const who = pIndex.get(item.who) ?? 0; const bar = barStack.get(who)?.pop(); if (bar) { bar.endItem = i; bar.y1 = lastEnd; }
    } else if (item.kind === 'pause') row.h = 0;
    rows.push(row); y += row.h;
  });
  const bottom = y + 50;
  for (const bar of bars) if (bar.endItem < 0) { bar.y1 = bottom - 40; }
  for (const frame of frames) if (frame.rowEnd < 0) { frame.rowEnd = rows.length - 1; frame.endItem = diagram.items.length - 1; }
  return { LW, s, headTop, cx, boxW, rows, bars, frames, bottom, created, destroyed };
}

// ---- participants ----

function drawParticipant(ctx: CanvasRenderingContext2D, p: Participant, x: number, top: number, w: number, theme: Theme, font: FontId, alpha: number) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineWidth = 3; ctx.strokeStyle = theme.ink; ctx.fillStyle = theme.fill; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  let size = 28; ctx.font = fontCss(font, size);
  let lines = wrap(ctx, p.label, w - 28, 2);
  while (size > 18 && lines.some((text) => ctx.measureText(text).width > w - 28)) { size -= 2; ctx.font = fontCss(font, size); lines = wrap(ctx, p.label, w - 28, 2); }
  const h = 88; const mid = top + h / 2;
  const label = (cy: number) => { ctx.fillStyle = theme.ink; lines.forEach((text, k) => ctx.fillText(text, x, cy + (k - (lines.length - 1) / 2) * (size + 4))); };
  if (p.type === 'actor') {
    const head = top + 14;
    ctx.beginPath(); ctx.arc(x, head, 12, 0, Math.PI * 2); ctx.stroke();
    line(ctx, x, head + 12, x, head + 40); line(ctx, x - 20, head + 24, x + 20, head + 24); line(ctx, x, head + 40, x - 16, head + 62); line(ctx, x, head + 40, x + 16, head + 62);
    ctx.fillStyle = theme.ink; ctx.font = fontCss(font, Math.min(size, 24)); lines = wrap(ctx, p.label, w, 1); ctx.fillText(lines[0] ?? '', x, top + 98);
  } else if (p.type === 'database') {
    const left = x - w / 2, ry = 12;
    ctx.beginPath(); ctx.moveTo(left, top + ry); ctx.lineTo(left, top + h - ry); ctx.ellipse(x, top + h - ry, w / 2, ry, 0, Math.PI, 0, true); ctx.lineTo(left + w, top + ry); ctx.ellipse(x, top + ry, w / 2, ry, 0, 0, Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, top + ry, w / 2, ry, 0, 0, Math.PI); ctx.stroke(); label(mid + 8);
  } else if (p.type === 'cloud') {
    const left = x - w / 2;
    ctx.beginPath(); ctx.moveTo(left + 30, top + h - 8);
    ctx.arc(left + 30, top + h - 28, 20, Math.PI / 2, Math.PI * 1.5); ctx.arc(left + w * 0.38, top + 24, 22, Math.PI, Math.PI * 1.9); ctx.arc(left + w * 0.7, top + 26, 20, Math.PI * 1.15, Math.PI * 2.1); ctx.arc(left + w - 28, top + h - 28, 20, Math.PI * 1.5, Math.PI * 2.5); ctx.closePath(); ctx.fill(); ctx.stroke(); label(mid);
  } else if (p.type === 'queue') {
    roundRect(ctx, x - w / 2, top + 10, w, h - 20, 24); ctx.fill(); ctx.stroke();
    line(ctx, x + w / 2 - 34, top + 10, x + w / 2 - 34, top + h - 10); ctx.save(); ctx.translate(-14, 0); label(mid); ctx.restore();
  } else if (p.type === 'collections') {
    roundRect(ctx, x - w / 2 + 12, top, w - 12, h - 12, 12); ctx.fill(); ctx.stroke(); roundRect(ctx, x - w / 2, top + 12, w - 12, h - 12, 12); ctx.fill(); ctx.stroke(); ctx.save(); ctx.translate(-6, 6); label(mid); ctx.restore();
  } else { roundRect(ctx, x - w / 2, top + 4, w, h - 8, 14); ctx.fill(); ctx.stroke(); label(mid); }
  ctx.restore();
}

// ---- renderer ----

export interface Renderer { duration: number; /** Paints the moment `seconds` into the video. */ paint: (ctx: CanvasRenderingContext2D, seconds: number) => void; /** True when the diagram is taller than the picture and the view follows the steps. */ scrolls: boolean }

export function makeRenderer(diagram: Diagram, options: SeqOptions, W: number, H: number, timeline: Timeline): Renderer {
  const measure = document.createElement('canvas').getContext('2d')!;
  const L = layoutDiagram(measure, diagram, options, W, H);
  const theme = THEMES[options.theme];
  const visH = H / L.s - L.headTop - HEAD;
  const maxOffset = Math.max(0, L.bottom - (L.headTop + HEAD) - visH);
  const offsets = timeline.steps.map((step) => { const row = L.rows[step.item]!; return Math.max(0, Math.min(maxOffset, row.top + row.h - (L.headTop + HEAD) - visH + 60)); });

  const camera = (t: number) => {
    let current = 0;
    for (let k = 0; k < timeline.steps.length; k++) {
      const start = timeline.steps[k]!.start; if (t < start) break;
      const target = Math.max(current, offsets[k]!);
      if (t < start + 0.7) return current + (target - current) * easeInOut((t - start) / 0.7);
      current = target;
    }
    return current;
  };

  const p = (i: number, t: number) => clamp01((t - timeline.at[i]!) / timeline.anim[i]!);
  const shown = (i: number, t: number) => t >= timeline.at[i]!;
  const currentItem = (t: number) => { const k = timeline.steps.findIndex((step) => t >= step.start && t < step.end); return k < 0 ? -1 : timeline.steps[k]!.item; };

  const paint = (ctx: CanvasRenderingContext2D, t: number) => {
    const { LW, s, cx, rows } = L;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(s, 0, 0, s, 0, 0); ctx.textBaseline = 'middle'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const top = L.headTop + HEAD;
    const offset = camera(t);
    const live = currentItem(t);

    // Everything below the header scrolls.
    ctx.save(); ctx.beginPath(); ctx.rect(0, top - 6, LW, H / s); ctx.clip(); ctx.translate(0, -offset);

    // Lifelines.
    ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.strokeStyle = theme.soft;
    diagram.participants.forEach((_, k) => {
      const made = L.created.get(k); const gone = L.destroyed.get(k);
      if (made && !shown(made.row, t)) return;
      const y0 = made ? made.y + 40 : top - 8; const y1 = gone ? (shown(gone.row, t) ? gone.y : L.bottom - 30) : L.bottom - 30;
      if (y1 > y0) line(ctx, cx[k]!, y0, cx[k]!, y1);
    });
    ctx.setLineDash([]);

    // Group boxes (drawn behind the steps).
    for (const frame of L.frames) {
      if (!shown(frame.startItem, t)) continue;
      const first = rows[frame.rowStart]!; const finished = shown(frame.endItem, t);
      let last = frame.rowStart;
      for (let r = frame.rowStart; r <= frame.rowEnd; r++) if (shown(rows[r]!.i, t)) last = r;
      const bottomRow = rows[finished ? frame.rowEnd : last]!;
      const inset = 22 + frame.depth * 14; const x = inset, w = LW - inset * 2; const y0 = first.top + 14; const y1 = Math.max(y0 + 50, bottomRow.top + bottomRow.h - 6);
      const grow = easeOut(p(frame.startItem, t));
      ctx.save(); ctx.globalAlpha = grow; ctx.lineWidth = 2.5; ctx.strokeStyle = theme.accent; roundRect(ctx, x, y0, w, y1 - y0, 12); ctx.stroke();
      ctx.font = fontCss(options.font, 24); const tab = frame.kind;
      const tabW = ctx.measureText(tab).width + 32; ctx.fillStyle = theme.accent; roundRect(ctx, x, y0, tabW, 36, 10); ctx.fill();
      ctx.fillStyle = theme.bg; ctx.textAlign = 'left'; ctx.fillText(tab, x + 16, y0 + 19);
      ctx.fillStyle = theme.ink; if (frame.text) ctx.fillText(`[ ${frame.text} ]`, x + tabW + 14, y0 + 19);
      for (const other of frame.elses) {
        const r = rows[other.row]!; if (!shown(r.i, t)) continue;
        ctx.setLineDash([10, 8]); line(ctx, x, r.top + 14, x + w, r.top + 14); ctx.setLineDash([]);
        ctx.fillStyle = theme.ink; ctx.fillText(`[ ${other.text || 'else'} ]`, x + 16, r.top + 36);
      }
      ctx.restore();
    }

    // Activation bars.
    for (const bar of L.bars) {
      if (!shown(bar.startItem, t)) continue;
      const ended = bar.endItem >= 0 && shown(bar.endItem, t); const x = cx[bar.who]! - 8 + bar.depth * 9;
      let reach = bar.y0; for (const r of rows) if (r.i >= bar.startItem && shown(r.i, t) && r.endY > reach) reach = r.endY;
      const bottom = ended ? bar.y1 : Math.min(bar.y1, Math.max(bar.y0 + 8, reach));
      ctx.fillStyle = theme.fill; ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.5; ctx.fillRect(x, bar.y0, 16, bottom - bar.y0); ctx.strokeRect(x, bar.y0, 16, bottom - bar.y0);
    }

    // The steps.
    for (const row of rows) {
      const item = row.item; if (!shown(row.i, t)) continue;
      const q = easeOut(p(row.i, t)); const isLive = row.i === live;
      const colour = isLive ? theme.accent : theme.ink;
      if (item.kind === 'message') drawMessage(ctx, item, row, q, colour, isLive);
      else if (item.kind === 'note') drawNote(ctx, item, row, q);
      else if (item.kind === 'state') drawState(ctx, row, q);
      else if (item.kind === 'divider') drawDivider(ctx, row, q);
      else if (item.kind === 'delay') drawDelay(ctx, row, q);
      else if (item.kind === 'destroy') drawX(ctx, cx[Math.max(0, diagram.participants.findIndex((who) => who.id === item.who))] ?? 0, row.arrowY, q);
    }

    // Participants created in the middle of the diagram.
    for (const [who, made] of L.created) {
      if (!shown(made.row, t)) continue;
      drawParticipant(ctx, diagram.participants[who]!, cx[who]!, made.y - 44, L.boxW, theme, options.font, easeOut(p(made.row, t)));
    }
    ctx.restore();

    // Pinned header: the names.
    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, LW, top - 6);
    if (offset > 4) { ctx.strokeStyle = theme.soft; ctx.lineWidth = 2; line(ctx, 0, top - 6, LW, top - 6); }
    if (diagram.title) {
      ctx.font = fontCss(options.font, 36); ctx.fillStyle = theme.ink; ctx.textAlign = 'center'; ctx.globalAlpha = easeOut(t / 0.6);
      const title = wrap(ctx, diagram.title, LW - 100, 1)[0] ?? ''; ctx.fillText(title, LW / 2, TITLE_H / 2 + 6); ctx.globalAlpha = 1;
    }
    diagram.participants.forEach((who, k) => {
      if (L.created.has(k)) return;
      drawParticipant(ctx, who, cx[k]!, L.headTop + 14, L.boxW, theme, options.font, easeOut((t - k * 0.08) / 0.5));
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = 'left';
  };

  function drawMessage(ctx: CanvasRenderingContext2D, item: MessageItem, row: Row, q: number, colour: string, isLive: boolean) {
    const self = item.from !== null && item.from === item.to;
    const { x1, arrowY } = row; const x2 = row.x2; const y2 = row.endY;
    ctx.save(); ctx.strokeStyle = colour; ctx.fillStyle = colour; ctx.lineWidth = isLive ? 4 : 3.2;
    ctx.font = fontCss(options.font, FS); ctx.textBaseline = 'middle';
    const textTop = row.top + 4;
    const midX = (x1 + x2) / 2;
    const labelAlpha = clamp01((q - 0.15) / 0.5);
    if (options.arrows) {
      const lineP = clamp01(q / 0.7);
      if (self) {
        const w = 70, h = 46; ctx.globalAlpha = easeOut(lineP); ctx.setLineDash(item.dashed ? [10, 8] : []);
        ctx.beginPath(); ctx.moveTo(x1, arrowY); ctx.lineTo(x1 + w, arrowY); ctx.lineTo(x1 + w, arrowY + h); ctx.lineTo(x1 + 4, arrowY + h); ctx.stroke(); ctx.setLineDash([]);
        drawHead(ctx, x1 + 4, arrowY + h, -1, 0, item.open, 1);
        ctx.globalAlpha = labelAlpha; ctx.textAlign = 'left'; ctx.fillStyle = colour;
        row.lines.forEach((text, k) => ctx.fillText(text, x1 + w + 60, arrowY + 4 + k * LH));
        badge(ctx, row, x1 + w + 60, arrowY + 4, labelAlpha); ctx.restore(); return;
      }
      const dir = x2 >= x1 ? 1 : -1; const tipX = x1 + (x2 - x1) * easeOut(lineP); const tipY = arrowY + (y2 - arrowY) * easeOut(lineP);
      ctx.setLineDash(item.dashed ? [12, 9] : []); line(ctx, x1, arrowY, tipX, tipY); ctx.setLineDash([]);
      const angle = Math.atan2(tipY - arrowY, tipX - x1 || dir * 0.001); drawHead(ctx, tipX, tipY, Math.cos(angle), Math.sin(angle), item.open, lineP > 0.04 ? 1 : 0);
      if (item.from !== null) { ctx.beginPath(); ctx.arc(x1, arrowY, 5, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = labelAlpha; ctx.textAlign = 'center'; ctx.fillStyle = isLive ? theme.accent : theme.ink;
      row.lines.forEach((text, k) => ctx.fillText(text, midX, textTop + 18 + k * LH));
      badge(ctx, row, midX - Math.max(...row.lines.map((text) => measureWidth(ctx, text)), 0) / 2 - 8, textTop + 18, labelAlpha); ctx.restore();
      return;
    }
    // Arrows hidden: the text slides from the first name toward the middle, between two dots on the lines.
    ctx.globalAlpha = Math.min(1, q * 1.6);
    for (const x of [x1, x2]) if (x > 40 && x < L.LW - 40) { ctx.beginPath(); ctx.arc(x, arrowY, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = labelAlpha; ctx.textAlign = 'center'; ctx.fillStyle = isLive ? theme.accent : theme.ink;
    const slide = x1 + (midX - x1) * easeOut(q);
    const lines = row.lines.length ? row.lines : [''];
    ctx.font = fontCss(options.font, FS);
    if (self) { ctx.textAlign = 'left'; lines.forEach((text, k) => ctx.fillText(text, x1 + 24, textTop + 22 + k * LH)); }
    else lines.forEach((text, k) => ctx.fillText(text, slide, arrowY - (lines.length - k) * LH + 10));
    if (!self) badge(ctx, row, slide - Math.max(...lines.map((text) => measureWidth(ctx, text)), 0) / 2 - 6, arrowY - lines.length * LH + 10, labelAlpha);
    ctx.restore();
  }

  function badge(ctx: CanvasRenderingContext2D, row: Row, x: number, y: number, alpha: number) {
    if (!row.num) return;
    ctx.globalAlpha = alpha; ctx.fillStyle = theme.accent; ctx.beginPath(); ctx.arc(x - 14, y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.bg; ctx.textAlign = 'center'; ctx.font = fontCss(options.font, 20); ctx.fillText(String(row.num), x - 14, y + 1);
  }
  function measureWidth(ctx: CanvasRenderingContext2D, text: string) { ctx.font = fontCss(options.font, FS); return ctx.measureText(text).width; }

  function drawHead(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, open: boolean, alpha: number) {
    if (!alpha) return;
    const len = 26, wide = 12; const bx = x - dx * len, by = y - dy * len; const nx = -dy, ny = dx;
    ctx.beginPath();
    if (open) { ctx.moveTo(bx + nx * wide, by + ny * wide); ctx.lineTo(x, y); ctx.lineTo(bx - nx * wide, by - ny * wide); ctx.stroke(); }
    else { ctx.moveTo(x, y); ctx.lineTo(bx + nx * wide, by + ny * wide); ctx.lineTo(bx - nx * wide, by - ny * wide); ctx.closePath(); ctx.fill(); }
  }

  function drawNote(ctx: CanvasRenderingContext2D, item: NoteItem, row: Row, q: number) {
    const noteH = row.lines.length * LH + 30; const x = row.boxX, w = row.boxW; const y = row.top + 12 + (1 - q) * 14;
    ctx.save(); ctx.globalAlpha = q; ctx.fillStyle = theme.noteFill; ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.5;
    const fold = 22; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - fold, y); ctx.lineTo(x + w, y + fold); ctx.lineTo(x + w, y + noteH); ctx.lineTo(x, y + noteH); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - fold, y); ctx.lineTo(x + w - fold, y + fold); ctx.lineTo(x + w, y + fold); ctx.stroke();
    ctx.fillStyle = theme.noteInk; ctx.textAlign = 'left'; ctx.font = fontCss(options.font, FS - 2);
    row.lines.forEach((text, k) => ctx.fillText(text, x + 20, y + 16 + LH / 2 + k * LH)); ctx.restore(); void item;
  }

  function drawState(ctx: CanvasRenderingContext2D, row: Row, q: number) {
    const h = row.lines.length * LH + 24; const y = row.top + 12 + (1 - q) * 10;
    ctx.save(); ctx.globalAlpha = q; ctx.fillStyle = theme.fill; ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.5; roundRect(ctx, row.boxX, y, row.boxW, h, h / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = theme.ink; ctx.textAlign = 'center'; ctx.font = fontCss(options.font, FS - 2); row.lines.forEach((text, k) => ctx.fillText(text, row.boxX + row.boxW / 2, y + 12 + LH / 2 + k * LH)); ctx.restore();
  }

  function drawDivider(ctx: CanvasRenderingContext2D, row: Row, q: number) {
    const y = row.arrowY; const half = (L.LW - 80) / 2 * easeOut(q); const cxm = L.LW / 2;
    ctx.save(); ctx.strokeStyle = theme.ink; ctx.lineWidth = 3; ctx.fillStyle = theme.bg;
    line(ctx, cxm - half, y - 5, cxm + half, y - 5); line(ctx, cxm - half, y + 5, cxm + half, y + 5);
    ctx.font = fontCss(options.font, FS); const label = row.lines.join(' '); const tw = ctx.measureText(label).width + 56;
    ctx.globalAlpha = q; ctx.fillStyle = theme.fill; roundRect(ctx, cxm - tw / 2, y - 26, tw, 52, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = theme.ink; ctx.textAlign = 'center'; ctx.fillText(label, cxm, y + 1); ctx.restore();
  }

  function drawDelay(ctx: CanvasRenderingContext2D, row: Row, q: number) {
    const y = row.arrowY; ctx.save(); ctx.globalAlpha = q; ctx.font = fontCss(options.font, FS);
    const label = row.lines.join(' ') || '…'; const tw = ctx.measureText(label).width + 40;
    ctx.fillStyle = theme.bg; ctx.fillRect(L.LW / 2 - tw / 2, y - 24, tw, 48);
    ctx.fillStyle = theme.soft; ctx.textAlign = 'center'; ctx.fillText(label, L.LW / 2, y + 1); ctx.restore();
  }

  function drawX(ctx: CanvasRenderingContext2D, x: number, y: number, q: number) {
    ctx.save(); ctx.globalAlpha = q; ctx.strokeStyle = theme.accent; ctx.lineWidth = 6; const r = 18 * easeOut(q); line(ctx, x - r, y - r, x + r, y + r); line(ctx, x + r, y - r, x - r, y + r); ctx.restore();
  }

  return { duration: timeline.duration, paint, scrolls: maxOffset > 0 };
}
