import type { FontId, Item, Sheet } from '../paper/geometry';
import { PAGE_SIZES, TONES, WEIGHTS } from '../paper/types';
import { FONTS, THEMES } from './theme';
import type { Common, Values } from './types';

export const TEXT = '#444444';
export const INK = '#111111';
const r3 = (value: number) => Math.round(value * 1000) / 1000;

export interface Ctx { x: number; y: number; w: number; h: number; color: string; weight: number; heading: string; items: Item[]; accent: string; tint: string; fill: boolean; font: FontId; cw: number }

/** A filled rectangle, such as a header band or a pale wash. */
export const fillRect = (c: Ctx, x: number, y: number, w: number, h: number, color: string) => c.items.push({ t: 'rect', x: r3(x), y: r3(y), w: r3(w), h: r3(h), c: color });

export const line = (c: Ctx, x1: number, y1: number, x2: number, y2: number, w = c.weight, color = c.color) =>
  c.items.push({ t: 'line', x1: r3(x1), y1: r3(y1), x2: r3(x2), y2: r3(y2), w, c: color });
export const text = (c: Ctx, x: number, y: number, size: number, value: string, bold = false, anchor: 'start' | 'middle' | 'end' = 'start', color = TEXT) =>
  c.items.push({ t: 'text', x: r3(x), y: r3(y), size, text: value, c: color, bold, anchor, ...(c.font !== 'sans' ? { font: c.font } : {}) });
export const box = (c: Ctx, x: number, y: number, size: number) => {
  line(c, x, y, x + size, y); line(c, x + size, y, x + size, y + size); line(c, x + size, y + size, x, y + size); line(c, x, y + size, x, y);
};
export const ruled = (c: Ctx, x1: number, x2: number, y1: number, y2: number, step: number) => {
  for (let y = y1 + step; y <= y2 + 1e-6; y += step) line(c, x1, y, x2, y, c.weight * 0.8);
};

/** Splits text into lines of at most `max` characters, at spaces where it can. */
export function wrap(value: string, max: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of value.split(/\s+/).filter(Boolean)) {
    const piece = word.length > max ? `${word.slice(0, max - 1)}…` : word;
    if (current && current.length + 1 + piece.length > max) { lines.push(current); current = piece; } else current = current ? `${current} ${piece}` : piece;
  }
  if (current) lines.push(current);
  return lines;
}

/** Typed text wrapped to a box (left edge x, width, height) and made smaller if needed, then cut with a dot dot dot. A character is about 0.19 mm wide per point of size. */
export function fitText(c: Ctx, x: number, y: number, width: number, height: number, value: string, size: number, bold = false, anchor: 'start' | 'middle' = 'start', color = INK): void {
  const clean = value.trim();
  if (!clean) return;
  let pt = size;
  let lines = wrap(clean, Math.max(3, Math.floor(width / (pt * c.cw))));
  const room = (p: number) => Math.max(1, Math.floor(height / (p * 0.42)));
  while (pt > 5.5 && lines.length > room(pt)) { pt -= 0.5; lines = wrap(clean, Math.max(3, Math.floor(width / (pt * c.cw)))); }
  const limit = room(pt);
  if (lines.length > limit) {
    lines = lines.slice(0, limit);
    const last = lines[limit - 1]!;
    lines[limit - 1] = `${last.slice(0, Math.max(1, last.length - 1))}…`;
  }
  const ox = anchor === 'middle' ? width / 2 : 0;
  lines.forEach((value, i) => text(c, x + ox, y + i * pt * 0.42, pt, value, bold, anchor, color));
}

/** The title at the top left and the typed name (shop, household or pet) at the top right. Returns how far down the content starts. */
export function titleBar(c: Ctx, title: string, sub = ''): number {
  text(c, c.x, c.y + 8, 18, title, true, 'start', c.accent);
  if (c.fill) { fillRect(c, c.x, c.y + 10.6, c.w, 0.9, c.accent); }
  if (c.heading.trim()) text(c, c.x + c.w, c.y + 8, 12, c.heading.trim(), true, 'end', c.accent);
  if (sub) text(c, c.x, c.y + 13.5, 9, sub);
  return sub ? 18 : 13;
}

/** A grid with a header row. Columns are given as relative widths; rows are drawn blank, with optional typed text for the first column. */
export function table(c: Ctx, top: number, bottom: number, columns: { label: string; w: number }[], rows: number, firstColumn: string[] = [], opts: { headH?: number; numbered?: boolean; headSize?: number } = {}): { rowH: number; xs: number[]; firstRow: number } {
  const headH = opts.headH ?? 9;
  const total = columns.reduce((sum, col) => sum + col.w, 0);
  const rowH = (bottom - top - headH) / rows;
  const xs = [c.x];
  columns.forEach((col) => xs.push(xs[xs.length - 1]! + (col.w / total) * c.w));
  if (c.fill) {
    fillRect(c, c.x, top, c.w, headH, c.accent);
    for (let r = 1; r < rows; r += 2) fillRect(c, c.x, top + headH + r * rowH, c.w, rowH, c.tint);
  }
  line(c, c.x, top, c.x + c.w, top, c.weight * 1.6);
  columns.forEach((col, i) => fitText(c, xs[i]! + 1, top + headH / 2 - 0.5, xs[i + 1]! - xs[i]! - 2, headH - 1, col.label, opts.headSize ?? 8.5, true, 'middle', c.fill ? '#ffffff' : INK));
  const gridTop = top + headH;
  for (let r = 0; r <= rows; r += 1) line(c, c.x, gridTop + r * rowH, c.x + c.w, gridTop + r * rowH, r === 0 || r === rows ? c.weight * 1.6 : c.weight);
  xs.forEach((x, i) => line(c, x, top, x, gridTop + rows * rowH, i === 0 || i === xs.length - 1 ? c.weight * 1.6 : c.weight));
  for (let r = 0; r < rows; r += 1) {
    const y = gridTop + r * rowH;
    if (opts.numbered) text(c, (xs[0]! + xs[1]!) / 2, y + rowH / 2 + 1.2, Math.min(8, rowH * 1.3), String(r + 1), false, 'middle');
    const typed = firstColumn[r];
    if (typed) fitText(c, xs[opts.numbered ? 1 : 0]! + 1.2, y + Math.min(5, rowH * 0.62), xs[opts.numbered ? 2 : 1]! - xs[opts.numbered ? 1 : 0]! - 2.4, rowH - 0.8, typed, Math.min(10, rowH * 1.5));
  }
  return { rowH, xs, firstRow: gridTop };
}

/** Builds `count` pages with the paper settings, calling `draw` for each. */
export function makePages(common: Common, count: number, draw: (c: Ctx, index: number) => void): Sheet[] {
  const size = PAGE_SIZES[common.page];
  const width = common.landscape ? size.height : size.width;
  const height = common.landscape ? size.width : size.height;
  const margin = Math.min(30, Math.max(4, common.margin));
  const theme = common.theme ? THEMES[common.theme] : undefined;
  const color = theme ? theme.ink : TONES[common.tone].color;
  const face: FontId = common.font ?? 'sans';
  const weight = WEIGHTS[common.weight].mm;
  const pages: Sheet[] = [];
  for (let i = 0; i < count; i += 1) {
    const ctx: Ctx = { x: margin, y: margin, w: width - 2 * margin, h: height - 2 * margin, color, weight, heading: common.heading, items: [], accent: theme ? theme.accent : INK, tint: theme ? theme.tint : '#f1f1f1', fill: theme ? theme.fill : false, font: face, cw: FONTS[face].cw };
    draw(ctx, i);
    pages.push({ width, height, area: { x: margin, y: margin, w: ctx.w, h: ctx.h }, fixed: ctx.items, pageNumber: null });
  }
  return pages;
}

export const str = (v: Values, key: string): string => String(v[key] ?? '').trim();
export const num = (v: Values, key: string, fallback: number): number => {
  const n = Number(v[key]);
  return Number.isFinite(n) ? n : fallback;
};
export const flag = (v: Values, key: string): boolean => Boolean(v[key]);
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));
/** The non-empty lines of a list field, trimmed, at most `max` of them. */
export const lines = (v: Values, key: string, max: number): string[] =>
  String(v[key] ?? '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, max);
