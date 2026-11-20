import type { Item, Sheet } from '../paper/geometry';
import { PAGE_SIZES, WEIGHTS } from '../paper/types';
import { inkOf, resolveTheme, restyle } from '../paper/style';
import { FONTS } from '../records/theme';
import { addDays, daysInMonth, firstWeekday, longDate, monthName, parseIso, shortDate, startOfWeek, weekdayName } from '../planner/dates';
import { MAX_COUNT, type MealSettings } from './types';

const TEXT = '#444444';
const INK = '#222222';
const r3 = (value: number) => Math.round(value * 1000) / 1000;
const LOCALE = 'en';

interface Ctx { s: MealSettings; x: number; y: number; w: number; h: number; color: string; weight: number; items: Item[] }

const line = (c: Ctx, x1: number, y1: number, x2: number, y2: number, w = c.weight, color = c.color) =>
  c.items.push({ t: 'line', x1: r3(x1), y1: r3(y1), x2: r3(x2), y2: r3(y2), w, c: color });
const text = (c: Ctx, x: number, y: number, size: number, value: string, bold = false, anchor: 'start' | 'middle' | 'end' = 'start', color = TEXT) =>
  c.items.push({ t: 'text', x: r3(x), y: r3(y), size, text: value, c: color, bold, anchor });

/** Splits text into lines of at most `max` characters, at spaces where it can. */
function wrap(value: string, max: number): string[] {
  const lines: string[] = [];
  let currentLine = '';
  for (const word of value.split(/\s+/)) {
    const piece = word.length > max ? `${word.slice(0, max - 1)}\u2026` : word;
    if (currentLine && currentLine.length + 1 + piece.length > max) { lines.push(currentLine); currentLine = piece; } else currentLine = currentLine ? `${currentLine} ${piece}` : piece;
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/** A typed dish, wrapped onto a few lines and made smaller if it still does not fit, then cut with a dot dot dot. A character is about 0.19 mm wide per point of size. */
function fitText(c: Ctx, x: number, y: number, width: number, height: number, value: string, size = 10): void {
  const clean = value.trim();
  if (!clean) return;
  let pt = size;
  let lines = wrap(clean, Math.max(3, Math.floor(width / (pt * FONTS[c.s.font ?? 'sans'].cw))));
  const room = (p: number) => Math.max(1, Math.floor((height - 1) / (p * 0.45)));
  while (pt > 6.5 && lines.length > room(pt)) { pt -= 0.5; lines = wrap(clean, Math.max(3, Math.floor(width / (pt * FONTS[c.s.font ?? 'sans'].cw)))); }
  const limit = room(pt);
  if (lines.length > limit) {
    lines = lines.slice(0, limit);
    const last = lines[limit - 1]!;
    lines[limit - 1] = `${last.slice(0, Math.max(1, last.length - 1))}\u2026`;
  }
  lines.forEach((value, i) => text(c, x, y + i * pt * 0.45, pt, value, false, 'start', INK));
}

function heading(c: Ctx, value: string): number {
  text(c, c.x, c.y + 8, 20, value, true);
  if (c.s.title.trim()) text(c, c.x + c.w, c.y + 8, 10, c.s.title.trim(), false, 'end');
  return 14;
}

const dish = (s: MealSettings, weekday: number, meal: string) => s.dishes[String(weekday)]?.[meal] ?? '';

function ruled(c: Ctx, x1: number, x2: number, y1: number, y2: number, step: number) {
  for (let y = y1 + step; y <= y2 + 1e-6; y += step) line(c, x1, y, x2, y, c.weight * 0.8);
}

function weekPage(c: Ctx, first: Date): void {
  const { s } = c;
  const last = addDays(first, 6);
  const top = c.y + heading(c, `Menu: ${shortDate(first, LOCALE)} – ${shortDate(last, LOCALE)} ${last.getUTCFullYear()}`);
  const shopW = s.shopping ? Math.min(60, c.w * 0.24) : 0;
  const gap = s.shopping ? 6 : 0;
  const gridW = c.w - shopW - gap;
  const labelW = Math.min(26, gridW * 0.16);
  const meals = s.meals;
  const headH = 8;
  const rowH = (c.h - (top - c.y) - headH) / 7;
  const colW = (gridW - labelW) / meals.length;
  const gridTop = top + headH;
  meals.forEach((meal, i) => text(c, c.x + labelW + i * colW + colW / 2, top + 5.5, 9, meal, true, 'middle'));
  line(c, c.x, top, c.x + gridW, top, c.weight * 1.6);
  for (let d = 0; d < 7; d += 1) {
    const date = addDays(first, d);
    const weekday = date.getUTCDay();
    const y = gridTop + d * rowH;
    line(c, c.x, y, c.x + gridW, y, d === 0 ? c.weight * 1.6 : c.weight);
    text(c, c.x + 1.5, y + 5.5, 9.5, weekdayName(weekday, LOCALE, labelW >= 22 ? 'long' : 'short'), true);
    text(c, c.x + 1.5, y + 10.5, 7.5, shortDate(date, LOCALE));
    meals.forEach((meal, i) => fitText(c, c.x + labelW + i * colW + 1.8, y + 5.5, colW - 3.5, rowH - 6, dish(s, weekday, meal), 9.5));
  }
  line(c, c.x, gridTop + 7 * rowH, c.x + gridW, gridTop + 7 * rowH, c.weight * 1.6);
  for (let i = 0; i <= meals.length; i += 1) line(c, c.x + labelW + i * colW, top, c.x + labelW + i * colW, gridTop + 7 * rowH, i === meals.length ? c.weight * 1.6 : c.weight);
  line(c, c.x, top, c.x, gridTop + 7 * rowH, c.weight * 1.6);
  if (s.shopping) {
    const sx = c.x + gridW + gap;
    text(c, sx, top + 5.5, 9, 'Shopping list', true);
    line(c, sx, top, sx + shopW, top, c.weight * 1.6);
    ruled(c, sx, sx + shopW, top + 5, c.y + c.h, 8);
  }
}

function dayPage(c: Ctx, date: Date): void {
  const { s } = c;
  text(c, c.x, c.y + 8, 17, longDate(date, LOCALE), true);
  if (s.title.trim()) text(c, c.x + c.w, c.y + 8, 10, s.title.trim(), false, 'end');
  const top = c.y + 14;
  const notesH = s.notes ? Math.min(34, (c.y + c.h - top) * 0.2) : 0;
  const bottom = c.y + c.h - notesH - (s.notes ? 5 : 0);
  const blockH = (bottom - top) / s.meals.length;
  const weekday = date.getUTCDay();
  s.meals.forEach((meal, i) => {
    const y = top + i * blockH;
    line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
    text(c, c.x + 1.5, y + 6, 11, meal, true);
    fitText(c, c.x + 1.5 + 30, y + 6, c.w - 33, 6, dish(s, weekday, meal), 11);
    ruled(c, c.x + 28, c.x + c.w, y + 6, y + blockH - 1, 8);
  });
  line(c, c.x, bottom, c.x + c.w, bottom, c.weight * 1.6);
  if (s.notes) {
    text(c, c.x, bottom + 5, 9, 'Notes', true);
    ruled(c, c.x, c.x + c.w, bottom + 5, c.y + c.h, 7);
  }
}

function monthPage(c: Ctx, year: number, month: number): void {
  const { s } = c;
  const top = c.y + heading(c, `Menu: ${monthName(year, month, LOCALE)} ${year}`);
  const offset = (firstWeekday(year, month) - s.weekStart + 7) % 7;
  const days = daysInMonth(year, month);
  const rows = Math.ceil((offset + days) / 7);
  const notesH = s.notes ? 34 : 0;
  const headH = 7;
  const gridH = c.h - (top - c.y) - headH - notesH - (s.notes ? 4 : 0);
  const cellW = c.w / 7;
  const cellH = gridH / rows;
  const gridTop = top + headH;
  const band = resolveTheme(s).theme.fill ? resolveTheme(s).theme.accent : '';
  if (band) c.items.push({ t: 'rect', x: c.x, y: top, w: c.w, h: headH, c: band });
  for (let d = 0; d < 7; d += 1) text(c, c.x + d * cellW + cellW / 2, top + 5, 8.5, weekdayName((s.weekStart + d) % 7, LOCALE, cellW >= 26 ? 'long' : 'short'), true, 'middle', band ? '#ffffff' : TEXT);
  line(c, c.x, top, c.x + c.w, top, c.weight * 1.6);
  for (let r = 0; r <= rows; r += 1) line(c, c.x, gridTop + r * cellH, c.x + c.w, gridTop + r * cellH, r === 0 || r === rows ? c.weight * 1.6 : c.weight);
  for (let d = 0; d <= 7; d += 1) line(c, c.x + d * cellW, top, c.x + d * cellW, gridTop + rows * cellH, d === 0 || d === 7 ? c.weight * 1.6 : c.weight);
  for (let day = 1; day <= days; day += 1) {
    const index = offset + day - 1;
    const x = c.x + (index % 7) * cellW;
    const y = gridTop + Math.floor(index / 7) * cellH;
    text(c, x + 1.8, y + 5, 10, String(day), true);
    ruled(c, x + 1.5, x + cellW - 1.5, y + 5, y + cellH - 1, Math.max(5, (cellH - 6) / 3));
  }
  if (s.notes) {
    const ny = gridTop + rows * cellH + 4;
    text(c, c.x, ny + 4, 9, 'Notes', true);
    ruled(c, c.x, c.x + c.w, ny + 5, c.y + c.h, 7);
  }
}

/** Builds every page of the meal plan. */
export function buildMealPages(s: MealSettings): Sheet[] {
  const size = PAGE_SIZES[s.page];
  const width = s.landscape ? size.height : size.width;
  const height = s.landscape ? size.width : size.height;
  const margin = Math.min(30, Math.max(4, s.margin));
  const color = inkOf(s);
  const weight = WEIGHTS[s.weight].mm;
  const count = Math.min(MAX_COUNT[s.kind], Math.max(1, Math.round(s.count)));
  const meals = s.meals.length > 0 ? s.meals : ['Lunch'];
  const settings = { ...s, meals };
  const start = parseIso(s.startDate) ?? new Date(Date.UTC(s.year, s.month - 1, 1));
  const pages: Sheet[] = [];
  for (let i = 0; i < count; i += 1) {
    const ctx: Ctx = { s: settings, x: margin, y: margin, w: width - 2 * margin, h: height - 2 * margin, color, weight, items: [] };
    if (s.kind === 'week') weekPage(ctx, addDays(startOfWeek(start, s.weekStart), i * 7));
    else if (s.kind === 'day') dayPage(ctx, addDays(start, i));
    else {
      const index = s.month - 1 + i;
      monthPage(ctx, s.year + Math.floor(index / 12), (index % 12) + 1);
    }
    pages.push({ width, height, area: { x: margin, y: margin, w: ctx.w, h: ctx.h }, fixed: ctx.items, pageNumber: null });
  }
  return restyle(pages, s);
}
