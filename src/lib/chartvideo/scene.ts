/**
 * Draws the Chart Reveal Video: bars, horizontal bars, a line, a pie, a donut or a race that build up one step at a time.
 * The picture at any moment is worked out from the time alone, so the preview, the slider and the recorded video all match.
 */

import { FONT_FAMILIES, type FontId, type SpeedId } from '../sequence/scene';
import type { ChartDeck, ChartType, DataStep } from './parse';

export type StyleId = 'clean' | 'dark' | 'paper' | 'bold';
export type GroupingId = 'indian' | 'intl' | 'none';
export type HighlightId = 'max' | 'last' | 'none';
export type SortId = 'none' | 'desc' | 'asc';

export interface ChartStyle { bg: string; ink: string; muted: string; grid: string; card: string; cardInk: string; accent: string; palette: string[]; font: FontId; stroke: number; shadow: boolean }

export const STYLES: Record<StyleId, ChartStyle> = {
  clean: { bg: '#ffffff', ink: '#1f2937', muted: '#6b7280', grid: '#e5e7eb', card: '#f1f5f9', cardInk: '#1f2937', accent: '#ea580c', palette: ['#ea580c', '#0d9488', '#7c3aed', '#db2777', '#ca8a04', '#2563eb', '#16a34a', '#64748b'], font: 'clean', stroke: 0, shadow: true },
  dark: { bg: '#0b1020', ink: '#f8fafc', muted: '#94a3b8', grid: '#1e293b', card: '#151d36', cardInk: '#f8fafc', accent: '#22d3ee', palette: ['#22d3ee', '#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#fb923c', '#60a5fa', '#e879f9'], font: 'clean', stroke: 0, shadow: false },
  paper: { bg: '#fbf3e0', ink: '#3b2a14', muted: '#8a7350', grid: '#e8d9b5', card: '#fffaf0', cardInk: '#3b2a14', accent: '#b45309', palette: ['#b45309', '#15803d', '#9a3412', '#a16207', '#0f766e', '#86198f', '#be123c', '#4d7c0f'], font: 'friendly', stroke: 0, shadow: true },
  bold: { bg: '#fde047', ink: '#111111', muted: '#44403c', grid: '#eab308', card: '#ffffff', cardInk: '#111111', accent: '#e11d48', palette: ['#e11d48', '#111111', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#be185d'], font: 'clean', stroke: 4, shadow: false },
};

export interface ChartOptions {
  type: ChartType; style: StyleId; font: FontId; speed: SpeedId;
  /** A different colour for each bar or slice, or one colour. */ multi: boolean;
  /** Show the numbers. */ values: boolean;
  /** Numbers count up as a bar grows. */ countUp: boolean;
  /** Grid lines and numbers on the side. */ grid: boolean;
  highlight: HighlightId; sort: SortId; grouping: GroupingId;
  prefix: string; suffix: string; endText: string;
  /** How many bars the race shows at a time. */ top: number;
}

export interface Timeline { starts: number[]; ends: number[]; duration: number; /** When the highlight and end card begin, or -1. */ finaleAt: number }

const INTRO = 0.7, HOLD = 0.8, FINALE = 3;
const BASE: Record<SpeedId, number> = { slow: 3, normal: 2.2, fast: 1.5 };
const RACE: Record<SpeedId, number> = { slow: 3.6, normal: 2.6, fast: 1.8 };

const wanted = (deck: ChartDeck, type: ChartType, speed: SpeedId) => deck.steps.map((step) => (step.kind === 'pause' ? step.seconds : (type === 'race' ? RACE[speed] : BASE[speed]) + Math.min(1.5, step.note.length * 0.03)));

export function buildTimeline(deck: ChartDeck, type: ChartType, speed: SpeedId, extras: { stepTimes?: number[] | null; minDuration?: number; fitTo?: number; finale?: boolean } = {}): Timeline {
  const want = wanted(deck, type, speed);
  const given = extras.stepTimes && extras.stepTimes.length === want.length ? extras.stepTimes : null;
  const starts: number[] = []; let end = 0;
  if (given) {
    given.forEach((value, k) => starts.push(k === 0 ? Math.max(0, value) : Math.max(value, starts[k - 1]! + 0.2)));
    end = (starts[starts.length - 1] ?? 0) + (want[want.length - 1] ?? 1);
  } else {
    const total = want.reduce((sum, value) => sum + value, 0);
    const tail = extras.finale ? FINALE : HOLD;
    const stretch = extras.fitTo && total > 0 ? Math.max(0.4, Math.min(6, (extras.fitTo - INTRO - tail) / total)) : 1;
    let cursor = INTRO; for (const value of want) { starts.push(cursor); cursor += value * stretch; }
    end = cursor;
  }
  const ends = starts.map((_, k) => (k + 1 < starts.length ? starts[k + 1]! : end));
  const finale = !!extras.finale && deck.steps.some((step) => step.kind === 'data');
  return { starts, ends, duration: Math.max(extras.minDuration ?? 0, end + (finale ? FINALE : HOLD), INTRO + 1), finaleAt: finale ? end : -1 };
}

// ---- helpers ----

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
const easeInOut = (value: number) => { const v = clamp01(value); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
const easeBack = (value: number) => { const v = clamp01(value) - 1; return 1 + 1.9 * v * v * v + 0.9 * v * v; };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + k, y); ctx.arcTo(x + w, y, x + w, y + h, k); ctx.arcTo(x + w, y + h, x, y + h, k); ctx.arcTo(x, y + h, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath();
}

/** A round upper limit for the axis that splits into five equal steps, such as 120 for 104 or 25,000 for 23,100. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  for (const step of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (step * power >= value * 1.04) return step * power;
  return 10 * power;
}

export interface Renderer { duration: number; paint: (ctx: CanvasRenderingContext2D, seconds: number) => void }

export function makeRenderer(deck: ChartDeck, options: ChartOptions, W: number, H: number, timeline: Timeline): Renderer {
  const style = STYLES[options.style]; const FAM = FONT_FAMILIES[options.font];
  const U = Math.min(W, H * 0.75); const pad = U * 0.06; const px = U / 1080;
  const items: { k: number; step: DataStep }[] = []; deck.steps.forEach((step, k) => { if (step.kind === 'data') items.push({ k, step }); });
  const n = items.length; const race = options.type === 'race';
  const hasCard = deck.endText !== '' || options.endText !== '' || items.some((item) => item.step.note);
  const topBand = deck.title ? U * 0.2 : U * 0.06; const bottomBand = hasCard ? U * 0.3 : U * 0.07;
  const cTop = topBand, cBottom = H - bottomBand;

  const all = items.flatMap((item) => item.step.values);
  const allInt = all.every((v) => Number.isInteger(v));
  const locale = options.grouping === 'indian' ? 'en-IN' : 'en-US';
  const num = (v: number) => (options.grouping === 'none' ? String(allInt ? Math.round(v) : Math.round(v * 100) / 100) : v.toLocaleString(locale, { maximumFractionDigits: allInt ? 0 : 2 }));
  const money = (v: number) => `${options.prefix}${num(v)}${options.suffix}`;
  const maxOf = (values: number[]) => values.reduce((m, v) => Math.max(m, v), 0);
  const axisMax = niceMax(race ? maxOf(all) : maxOf(items.map((item) => item.step.values[0]!)));
  const hi = (() => {
    if (options.highlight === 'none' || n === 0) return -1;
    if (options.highlight === 'last') return n - 1;
    if (race) { const last = items[n - 1]!.step.values; return last.indexOf(maxOf(last)); }
    let best = 0; items.forEach((item, i) => { if (item.step.values[0]! > items[best]!.step.values[0]!) best = i; }); return best;
  })();
  const growOf = (k: number) => Math.max(0.25, Math.min(race ? 1.6 : 1.1, (timeline.ends[k]! - timeline.starts[k]!) * 0.7));
  const progress = (i: number, t: number) => clamp01((t - timeline.starts[items[i]!.k]!) / growOf(items[i]!.k));
  const colourOf = (i: number) => (options.multi || options.type === 'pie' || options.type === 'donut' ? style.palette[i % style.palette.length]! : style.accent);

  const text = (ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, weight: number, colour: string, align: CanvasTextAlign, maxW = Infinity, base: CanvasTextBaseline = 'middle') => {
    let px2 = size; ctx.font = `${weight} ${px2}px ${FAM}`;
    while (px2 > size * 0.5 && ctx.measureText(s).width > maxW) { px2 -= 1; ctx.font = `${weight} ${px2}px ${FAM}`; }
    let out = s; while (out.length > 1 && ctx.measureText(out).width > maxW) out = `${out.slice(0, -2)}…`;
    ctx.fillStyle = colour; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(out, x, y);
  };

  const paint = (ctx: CanvasRenderingContext2D, seconds: number) => {
    const t = Math.max(0, seconds);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.fillStyle = style.bg; ctx.fillRect(0, 0, W, H);
    const fin = timeline.finaleAt >= 0 && t >= timeline.finaleAt ? easeOut((t - timeline.finaleAt) / 0.7) : 0;
    const dim = (i: number) => (hi >= 0 && i !== hi ? 1 - 0.55 * fin : 1);
    const shown = (i: number) => (race ? 1 : progress(i, t));

    // ---- title ----
    if (deck.title) {
      text(ctx, deck.title, W / 2, topBand * 0.46, U * 0.064, 700, style.ink, 'center', W - pad * 2);
      ctx.fillStyle = style.accent; roundRect(ctx, W / 2 - U * 0.07, topBand * 0.46 + U * 0.062, U * 0.14, U * 0.012, U * 0.006); ctx.fill();
    }

    // ---- grid and side numbers shared by bars and the line ----
    const gridLeft = pad + (options.grid ? U * 0.11 : 0);
    const drawGrid = (px0: number, py0: number, pw: number, ph: number, vertical: boolean) => {
      if (!options.grid) return;
      ctx.lineWidth = 2 * px; ctx.strokeStyle = style.grid;
      const ticks = 5;
      for (let g = 0; g <= ticks; g++) {
        const v = (axisMax / ticks) * g;
        ctx.beginPath();
        if (vertical) { const y = py0 + ph - (ph * g) / ticks; ctx.moveTo(px0, y); ctx.lineTo(px0 + pw, y); ctx.stroke(); text(ctx, num(v), px0 - U * 0.015, y, U * 0.026, 500, style.muted, 'right', U * 0.1); }
        else { const x = px0 + (pw * g) / ticks; ctx.moveTo(x, py0); ctx.lineTo(x, py0 + ph); ctx.stroke(); text(ctx, num(v), x, py0 + ph + U * 0.03, U * 0.024, 500, style.muted, 'center', pw / ticks); }
      }
    };

    const valueText = (i: number, e: number) => {
      const v = items[i]!.step.values[0]!;
      const shownValue = options.countUp ? v * e : (e > 0.2 ? v : 0);
      return money(allInt ? Math.round(shownValue) : Math.round(shownValue * 100) / 100);
    };

    const type = options.type;
    if (n > 0 && (type === 'bar')) {
      const order = items.map((_, i) => i); if (options.sort !== 'none') order.sort((a, b) => (options.sort === 'desc' ? 1 : -1) * (items[b]!.step.values[0]! - items[a]!.step.values[0]!));
      const left = gridLeft, right = W - pad, top = cTop + U * 0.07, bottom = cBottom - U * 0.1; const pw = right - left, ph = bottom - top;
      drawGrid(left, top, pw, ph, true);
      ctx.strokeStyle = style.muted; ctx.lineWidth = 3 * px; ctx.beginPath(); ctx.moveTo(left, bottom); ctx.lineTo(right, bottom); ctx.stroke();
      const slot = pw / n; const barW = Math.min(slot * 0.66, U * 0.24);
      order.forEach((i, pos) => {
        const e = easeOut(shown(i)); if (e <= 0) return; const v = items[i]!.step.values[0]!;
        const cx = left + slot * (pos + 0.5); const h = (v / axisMax) * ph * e; const a = dim(i); ctx.globalAlpha = a;
        ctx.fillStyle = colourOf(i); roundRect(ctx, cx - barW / 2, bottom - h, barW, h, Math.min(barW * 0.2, 18 * px)); ctx.fill();
        if (style.stroke) { ctx.strokeStyle = style.ink; ctx.lineWidth = style.stroke * px; ctx.stroke(); }
        if (options.values) text(ctx, valueText(i, e), cx, bottom - h - U * 0.028, U * 0.04, 700, style.ink, 'center', slot * 1.15);
        text(ctx, items[i]!.step.label, cx, bottom + U * 0.05, U * 0.034, 500, style.ink, 'center', slot * 0.96);
        ctx.globalAlpha = 1;
        if (fin > 0 && i === hi) { ctx.strokeStyle = style.accent; ctx.lineWidth = 5 * px; ctx.globalAlpha = fin; roundRect(ctx, cx - barW / 2 - 8 * px, bottom - h - 8 * px, barW + 16 * px, h + 8 * px, 12 * px); ctx.stroke(); ctx.globalAlpha = 1; }
      });
    }

    if (n > 0 && type === 'hbar') {
      const order = items.map((_, i) => i); if (options.sort !== 'none') order.sort((a, b) => (options.sort === 'desc' ? 1 : -1) * (items[b]!.step.values[0]! - items[a]!.step.values[0]!));
      ctx.font = `500 ${U * 0.036}px ${FAM}`; const labelW = Math.min(W * 0.34, Math.max(...items.map((item) => ctx.measureText(item.step.label).width)) + U * 0.02);
      const valueRoom = options.values ? U * 0.2 : U * 0.03;
      const left = pad + labelW + U * 0.02, right = W - pad - valueRoom, top = cTop + U * 0.02, bottom = cBottom - (options.grid ? U * 0.05 : U * 0.02); const pw = right - left, ph = bottom - top;
      drawGrid(left, top, pw, ph, false);
      ctx.strokeStyle = style.muted; ctx.lineWidth = 3 * px; ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.stroke();
      const slot = ph / n; const barH = Math.min(slot * 0.66, U * 0.11);
      order.forEach((i, pos) => {
        const e = easeOut(shown(i)); if (e <= 0) return; const v = items[i]!.step.values[0]!;
        const cy = top + slot * (pos + 0.5); const w = (v / axisMax) * pw * e; ctx.globalAlpha = dim(i);
        text(ctx, items[i]!.step.label, left - U * 0.02, cy, U * 0.036, 500, style.ink, 'right', labelW);
        ctx.fillStyle = colourOf(i); roundRect(ctx, left, cy - barH / 2, Math.max(w, 1), barH, Math.min(barH * 0.3, 16 * px)); ctx.fill();
        if (style.stroke) { ctx.strokeStyle = style.ink; ctx.lineWidth = style.stroke * px; ctx.stroke(); }
        if (options.values) text(ctx, valueText(i, e), left + w + U * 0.02, cy, U * 0.04, 700, style.ink, 'left', valueRoom);
        ctx.globalAlpha = 1;
        if (fin > 0 && i === hi) { ctx.strokeStyle = style.accent; ctx.lineWidth = 5 * px; ctx.globalAlpha = fin; roundRect(ctx, left, cy - barH / 2 - 7 * px, w + 7 * px, barH + 14 * px, 12 * px); ctx.stroke(); ctx.globalAlpha = 1; }
      });
    }

    if (n > 0 && type === 'line') {
      const left = gridLeft + U * 0.03, right = W - pad - U * 0.03, top = cTop + U * 0.08, bottom = cBottom - U * 0.1; const pw = right - left, ph = bottom - top;
      drawGrid(gridLeft, top, right - gridLeft + U * 0.03, ph, true);
      const xs = items.map((_, i) => (n === 1 ? (left + right) / 2 : left + (pw * i) / (n - 1)));
      const ys = items.map((item) => bottom - (item.step.values[0]! / axisMax) * ph);
      // Line and the area under it, growing point by point.
      const pts: [number, number][] = [];
      items.forEach((_, i) => { const e = easeInOut(shown(i)); if (i === 0) { if (e > 0) pts.push([xs[0]!, ys[0]!]); } else if (e > 0) pts.push([xs[i - 1]! + (xs[i]! - xs[i - 1]!) * e, ys[i - 1]! + (ys[i]! - ys[i - 1]!) * e]); });
      if (pts.length > 1) {
        ctx.beginPath(); ctx.moveTo(pts[0]![0], bottom); pts.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.lineTo(pts[pts.length - 1]![0], bottom); ctx.closePath(); ctx.globalAlpha = 0.14; ctx.fillStyle = style.accent; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); pts.forEach((p, k) => (k === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]))); ctx.strokeStyle = style.accent; ctx.lineWidth = Math.max(5 * px, U * 0.008); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
      }
      items.forEach((item, i) => {
        const e = shown(i); if (e <= 0) return; const dot = easeBack(e); const a = dim(i); ctx.globalAlpha = a;
        ctx.fillStyle = i === hi && fin > 0 ? style.accent : style.bg; ctx.strokeStyle = style.accent; ctx.lineWidth = 5 * px; ctx.beginPath(); ctx.arc(xs[i]!, ys[i]!, U * 0.016 * Math.max(0.01, dot) * (i === hi ? 1 + 0.5 * fin : 1), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (options.values) { ctx.globalAlpha = a * clamp01((e - 0.5) * 2); text(ctx, valueText(i, 1), xs[i]!, ys[i]! - U * 0.04, U * 0.036, 700, style.ink, 'center', Math.max(U * 0.12, pw / n * 1.1)); }
        ctx.globalAlpha = a * clamp01(e * 2); text(ctx, item.step.label, xs[i]!, bottom + U * 0.05, U * 0.034, 500, style.ink, 'center', Math.max(U * 0.1, (pw / Math.max(1, n - 1)) * 0.96));
        ctx.globalAlpha = 1;
      });
    }

    if (n > 0 && (type === 'pie' || type === 'donut')) {
      const total = items.reduce((sum, item) => sum + item.step.values[0]!, 0) || 1;
      const side = W >= H * 1.15; const areaW = W - pad * 2, areaH = cBottom - cTop;
      const legendRows = side ? n : Math.ceil(n / 2); const rowH = Math.min(U * 0.07, (side ? areaH : areaH * 0.38) / Math.max(1, legendRows));
      const R = side ? Math.min(areaW * 0.44, areaH * 0.46) : Math.min(areaW * 0.46, (areaH - rowH * legendRows - U * 0.04) * 0.5);
      const cx = side ? pad + R + U * 0.01 : W / 2, cy = side ? cTop + areaH / 2 : cTop + R + U * 0.015;
      const inner = type === 'donut' ? R * 0.58 : 0;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); if (inner) ctx.arc(cx, cy, inner, 0, Math.PI * 2, true); ctx.fillStyle = style.grid; ctx.globalAlpha = 0.5; ctx.fill('evenodd'); ctx.globalAlpha = 1;
      let angle = -Math.PI / 2; let sum = 0;
      items.forEach((item, i) => {
        const full = (item.step.values[0]! / total) * Math.PI * 2; const e = easeOut(shown(i)); const sweep = full * e; sum += item.step.values[0]! * e;
        if (e > 0) {
          const mid = angle + full / 2; const pop = i === hi ? R * 0.07 * fin : 0; const ox = Math.cos(mid) * pop, oy = Math.sin(mid) * pop;
          ctx.globalAlpha = dim(i); ctx.beginPath(); ctx.moveTo(cx + ox + Math.cos(angle) * inner, cy + oy + Math.sin(angle) * inner); ctx.arc(cx + ox, cy + oy, R, angle, angle + sweep); if (inner) ctx.arc(cx + ox, cy + oy, inner, angle + sweep, angle, true); else ctx.lineTo(cx + ox, cy + oy); ctx.closePath();
          ctx.fillStyle = colourOf(i); ctx.fill(); ctx.strokeStyle = style.bg; ctx.lineWidth = 4 * px; ctx.stroke(); ctx.globalAlpha = 1;
          if (options.values && e > 0.9 && full > 0.32) { const r2 = inner ? (R + inner) / 2 : R * 0.68; text(ctx, `${Math.round((item.step.values[0]! / total) * 100)}%`, cx + ox + Math.cos(mid) * r2, cy + oy + Math.sin(mid) * r2, U * 0.038, 700, options.style === 'bold' || options.style === 'clean' || options.style === 'paper' ? '#ffffff' : '#0b1020', 'center', R * 0.5); }
        }
        angle += full;
      });
      if (inner) { text(ctx, money(allInt ? Math.round(sum) : Math.round(sum * 100) / 100), cx, cy - U * 0.012, Math.min(inner * 0.36, U * 0.075), 700, style.ink, 'center', inner * 1.5); text(ctx, 'Total', cx, cy + Math.min(inner * 0.3, U * 0.05), U * 0.03, 500, style.muted, 'center', inner * 1.4); }
      // Legend.
      const colW = side ? Math.min(areaW - R * 2 - U * 0.06, U * 0.6) : areaW / 2; const lx = side ? W - pad - colW : pad; const ly = side ? cTop + areaH / 2 - (rowH * n) / 2 : cy + R + U * 0.05;
      items.forEach((item, i) => {
        const e = easeOut(shown(i)); if (e <= 0) return; const col = side ? 0 : i % 2; const row = side ? i : Math.floor(i / 2); const x = lx + col * colW; const y = ly + row * rowH + rowH / 2;
        ctx.globalAlpha = e * dim(i); ctx.fillStyle = colourOf(i); roundRect(ctx, x, y - rowH * 0.2, rowH * 0.4, rowH * 0.4, 5 * px); ctx.fill();
        const label = options.values ? `${item.step.label}  ${money(item.step.values[0]!)}` : item.step.label;
        text(ctx, label, x + rowH * 0.6, y, Math.min(U * 0.034, rowH * 0.5), 500, style.ink, 'left', colW - rowH * 0.8); ctx.globalAlpha = 1;
      });
    }

    if (n > 0 && race) {
      // Which moment are we in, and how far into the move to the next one.
      let j = -1; items.forEach((item, i) => { if (timeline.starts[item.k]! <= t) j = i; });
      if (j >= 0) {
        const e = easeInOut(progress(j, t));
        const zero = deck.series.map(() => 0); const prev = j > 0 ? items[j - 1]!.step.values : zero; const cur = items[j]!.step.values;
        const value = cur.map((v, s) => prev[s]! + (v - prev[s]!) * e);
        const rankOf = (values: number[]) => values.map((v, s) => values.filter((w, u) => w > v || (w === v && u < s)).length);
        const rp = rankOf(prev), rc = rankOf(cur);
        const top = Math.max(2, Math.min(options.top, deck.series.length));
        const left = pad + Math.min(W * 0.3, U * 0.3), right = W - pad - (options.values ? U * 0.2 : U * 0.02);
        const areaTop = cTop + U * 0.02, areaH = cBottom - areaTop - U * 0.02; const slot = areaH / top; const barH = Math.min(slot * 0.72, U * 0.11);
        const scale = Math.max(...value, 1) * 1.08;
        const rows = deck.series.map((name, s) => ({ name, s, pos: rp[s]! + (rc[s]! - rp[s]!) * e, v: value[s]! })).filter((row) => row.pos < top - 0.4 + 1).sort((a, b) => b.pos - a.pos);
        // Big moment label behind the bars.
        ctx.globalAlpha = 0.1; text(ctx, items[j]!.step.label, W - pad, cBottom - U * 0.12, U * 0.2, 700, style.ink, 'right', W - pad * 2); ctx.globalAlpha = 1;
        for (const row of rows) {
          const fade = clamp01(top - 0.3 - row.pos + 0.5); if (fade <= 0) continue; const cy = areaTop + slot * (row.pos + 0.5); const w = (row.v / scale) * (right - left);
          const leader = fin > 0 && row.s === hi; ctx.globalAlpha = fade * (hi >= 0 && row.s !== hi ? 1 - 0.55 * fin : 1);
          text(ctx, row.name, left - U * 0.02, cy, U * 0.036, 500, style.ink, 'right', left - pad - U * 0.02);
          ctx.fillStyle = options.multi ? style.palette[row.s % style.palette.length]! : style.accent; roundRect(ctx, left, cy - barH / 2, Math.max(w, 1), barH, Math.min(barH * 0.3, 16 * px)); ctx.fill();
          if (style.stroke) { ctx.strokeStyle = style.ink; ctx.lineWidth = style.stroke * px; ctx.stroke(); }
          if (leader) { ctx.strokeStyle = style.accent; ctx.lineWidth = 5 * px; roundRect(ctx, left, cy - barH / 2 - 6 * px, w + 6 * px, barH + 12 * px, 12 * px); ctx.stroke(); }
          if (options.values) text(ctx, money(allInt ? Math.round(row.v) : Math.round(row.v * 100) / 100), left + w + U * 0.02, cy, U * 0.04, 700, style.ink, 'left', U * 0.2);
          ctx.globalAlpha = 1;
        }
      }
    }

    // ---- card: the note of the current step, then the end card ----
    let note = ''; let from = 0; let alpha = 1;
    const endText = deck.endText || options.endText;
    if (fin > 0 && endText) { note = endText; from = timeline.finaleAt + 0.2; }
    else if (!(fin > 0)) {
      let cur = -1; items.forEach((item, i) => { if (timeline.starts[item.k]! <= t) cur = i; });
      if (cur >= 0 && items[cur]!.step.note) { note = items[cur]!.step.note; from = timeline.starts[items[cur]!.k]! + 0.2; const next = items[cur + 1]; if (next) alpha = 1 - clamp01((t - timeline.starts[next.k]!) / 0.25); }
    }
    if (note) {
      const pop = easeBack((t - from) / 0.4); const wide = W - pad * 2; const cardH = U * 0.2; const cx = W / 2; const cy = H - bottomBand * 0.5 - U * 0.01;
      ctx.save(); ctx.globalAlpha = alpha * clamp01((t - from) / 0.2 + 0.05); ctx.translate(cx, cy); ctx.scale(0.9 + 0.1 * Math.max(0, pop), 0.9 + 0.1 * Math.max(0, pop)); ctx.translate(-cx, -cy);
      if (style.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 22 * px; ctx.shadowOffsetY = 8 * px; }
      ctx.fillStyle = style.card; roundRect(ctx, pad, cy - cardH / 2, wide, cardH, U * 0.035); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      if (style.stroke) { ctx.strokeStyle = style.ink; ctx.lineWidth = style.stroke * px; ctx.stroke(); }
      ctx.fillStyle = style.accent; roundRect(ctx, pad, cy - cardH / 2, U * 0.016, cardH, U * 0.008); ctx.fill();
      // Wrap the note on up to three lines.
      let size = U * 0.05; const maxW = wide - U * 0.1; let lines: string[] = [];
      for (; size >= U * 0.03; size -= 2) { ctx.font = `700 ${size}px ${FAM}`; lines = []; let line = ''; for (const word of note.split(/\s+/)) { const trial = line ? `${line} ${word}` : word; if (ctx.measureText(trial).width <= maxW || !line) line = trial; else { lines.push(line); line = word; } } if (line) lines.push(line); if (lines.length <= 3 && lines.every((l) => ctx.measureText(l).width <= maxW)) break; }
      const lh = size * 1.2; lines.forEach((line, k) => text(ctx, line, pad + U * 0.05, cy - (lines.length * lh) / 2 + lh / 2 + k * lh, size, 700, style.cardInk, 'left', maxW));
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  return { duration: timeline.duration, paint };
}
