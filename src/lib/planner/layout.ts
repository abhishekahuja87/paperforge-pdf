import type { Item, Sheet } from '../paper/geometry';
import { PAGE_SIZES, TONES, WEIGHTS } from '../paper/types';
import { addDays, daysInMonth, firstWeekday, longDate, monthName, parseIso, shortDate, startOfWeek, weekdayName } from './dates';
import { MAX_COUNT, type PlannerSettings } from './types';

const TEXT = '#444444';
const r3 = (value: number) => Math.round(value * 1000) / 1000;

interface Ctx { s: PlannerSettings; x: number; y: number; w: number; h: number; color: string; weight: number; items: Item[] }

const line = (c: Ctx, x1: number, y1: number, x2: number, y2: number, w = c.weight, color = c.color, dash?: [number, number]) =>
  c.items.push({ t: 'line', x1: r3(x1), y1: r3(y1), x2: r3(x2), y2: r3(y2), w, c: color, dash });
const text = (c: Ctx, x: number, y: number, size: number, value: string, bold = false, anchor: 'start' | 'middle' | 'end' = 'start', color = TEXT) =>
  c.items.push({ t: 'text', x: r3(x), y: r3(y), size, text: value, c: color, bold, anchor });
const ring = (c: Ctx, x: number, y: number, r: number) => c.items.push({ t: 'ring', x: r3(x), y: r3(y), r: r3(r), w: c.weight, c: c.color });

function heading(c: Ctx, value: string): number {
  text(c, c.x, c.y + 8, 22, value, true);
  if (c.s.title.trim()) text(c, c.x + c.w, c.y + 8, 10, c.s.title.trim(), false, 'end');
  return 14;
}

/** Lines to write on, from a start y to an end y. */
function ruled(c: Ctx, x1: number, x2: number, y1: number, y2: number, step: number) {
  for (let y = y1 + step; y <= y2 + 1e-6; y += step) line(c, x1, y, x2, y, c.weight * 0.8);
}

function monthPage(c: Ctx, year: number, month: number): void {
  const { s } = c;
  const top = c.y + heading(c, `${monthName(year, month, s.locale)} ${year}`);
  const offset = (firstWeekday(year, month) - s.weekStart + 7) % 7;
  const days = daysInMonth(year, month);
  const rows = Math.ceil((offset + days) / 7);
  const notesH = s.notes ? 34 : 0;
  const headH = 7;
  const gridH = c.h - (top - c.y) - headH - notesH - (s.notes ? 4 : 0);
  const cellW = c.w / 7;
  const cellH = gridH / rows;
  const gridTop = top + headH;
  for (let d = 0; d < 7; d += 1) text(c, c.x + d * cellW + cellW / 2, top + 5, 8.5, weekdayName((s.weekStart + d) % 7, s.locale, cellW >= 26 ? 'long' : 'short'), true, 'middle');
  line(c, c.x, top, c.x + c.w, top, c.weight * 1.6);
  for (let r = 0; r <= rows; r += 1) line(c, c.x, gridTop + r * cellH, c.x + c.w, gridTop + r * cellH, r === 0 || r === rows ? c.weight * 1.6 : c.weight);
  for (let d = 0; d <= 7; d += 1) line(c, c.x + d * cellW, top, c.x + d * cellW, gridTop + rows * cellH, d === 0 || d === 7 ? c.weight * 1.6 : c.weight);
  for (let day = 1; day <= days; day += 1) {
    const index = offset + day - 1;
    text(c, c.x + (index % 7) * cellW + 1.8, gridTop + Math.floor(index / 7) * cellH + 5, 10, String(day), true);
  }
  if (s.notes) {
    const ny = gridTop + rows * cellH + 4;
    text(c, c.x, ny + 4, 9, 'Notes', true);
    ruled(c, c.x, c.x + c.w, ny + 5, c.y + c.h, 7);
  }
}

function weekPage(c: Ctx, first: Date): void {
  const { s } = c;
  const last = addDays(first, 6);
  const top = c.y + heading(c, `${shortDate(first, s.locale)} – ${shortDate(last, s.locale)} ${last.getUTCFullYear()}`);
  const areaH = c.h - (top - c.y);
  const labelFor = (i: number) => {
    const day = addDays(first, i);
    return { name: weekdayName(day.getUTCDay(), s.locale, 'long'), number: String(day.getUTCDate()) };
  };
  if (s.landscape) {
    const colW = c.w / 7;
    for (let i = 0; i < 7; i += 1) {
      const x = c.x + i * colW;
      const label = labelFor(i);
      text(c, x + colW / 2, top + 5, 8.5, label.name, true, 'middle');
      text(c, x + colW / 2, top + 11, 9, label.number, false, 'middle');
      line(c, x, top, x, top + areaH);
      ruled(c, x + 1, x + colW - 1, top + 12, top + areaH, 8);
    }
    line(c, c.x + c.w, top, c.x + c.w, top + areaH);
    line(c, c.x, top, c.x + c.w, top, c.weight * 1.6);
    line(c, c.x, top + areaH, c.x + c.w, top + areaH, c.weight * 1.6);
    return;
  }
  const rowH = areaH / 7;
  for (let i = 0; i < 7; i += 1) {
    const y = top + i * rowH;
    const label = labelFor(i);
    line(c, c.x, y, c.x + c.w, y, i === 0 ? c.weight * 1.6 : c.weight);
    text(c, c.x + 1.5, y + 6, 10, label.name, true);
    text(c, c.x + 1.5, y + 12, 9, label.number);
    ruled(c, c.x + 30, c.x + c.w, y + 1, y + rowH, 8);
  }
  line(c, c.x, top + areaH, c.x + c.w, top + areaH, c.weight * 1.6);
}

function dayPage(c: Ctx, date: Date): void {
  const { s } = c;
  text(c, c.x, c.y + 8, 17, longDate(date, s.locale), true);
  if (s.title.trim()) text(c, c.x + c.w, c.y + 8, 10, s.title.trim(), false, 'end');
  const top = c.y + 14;
  const bottom = c.y + c.h;
  const leftW = c.w * 0.58;
  const gap = 6;
  const rightX = c.x + leftW + gap;
  const rightW = c.w - leftW - gap;
  const { from, to, step } = s.hours;
  const slots = Math.max(1, Math.round(((to - from) * 60) / step));
  const slotH = (bottom - top - 7) / slots;
  text(c, c.x, top + 5, 9, 'Schedule', true);
  const gridTop = top + 7;
  line(c, c.x, gridTop, c.x + leftW, gridTop, c.weight * 1.6);
  for (let i = 0; i < slots; i += 1) {
    const minutes = from * 60 + i * step;
    const label = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    text(c, c.x + 1, gridTop + i * slotH + Math.min(4.2, slotH - 1), 7.5, label);
    line(c, c.x, gridTop + (i + 1) * slotH, c.x + leftW, gridTop + (i + 1) * slotH, i === slots - 1 ? c.weight * 1.6 : c.weight * 0.8);
  }
  line(c, c.x + 13, gridTop, c.x + 13, gridTop + slots * slotH);
  text(c, rightX, top + 5, 9, 'Top priorities', true);
  const priorityTop = top + 7;
  for (let i = 0; i < 3; i += 1) {
    const y = priorityTop + (i + 1) * 9;
    ring(c, rightX + 2, y - 2.5, 1.7);
    line(c, rightX + 6, y, rightX + rightW, y);
  }
  const todoTitle = priorityTop + 3 * 9 + 7;
  text(c, rightX, todoTitle, 9, 'To do', true);
  const notesH = Math.max(30, (bottom - todoTitle) * 0.32);
  const notesTop = bottom - notesH;
  const todoRows = Math.max(1, Math.floor((notesTop - todoTitle - 6) / 8));
  for (let i = 0; i < todoRows; i += 1) {
    const y = todoTitle + 4 + (i + 1) * 8;
    ring(c, rightX + 2, y - 2.3, 1.6);
    line(c, rightX + 6, y, rightX + rightW, y, c.weight * 0.8);
  }
  text(c, rightX, notesTop + 4, 9, 'Notes', true);
  ruled(c, rightX, rightX + rightW, notesTop + 4, bottom, 7);
}

function yearPage(c: Ctx): void {
  const { s } = c;
  const top = c.y + heading(c, String(s.year));
  const cols = s.landscape ? 4 : 3;
  const rows = 12 / cols;
  const gap = 5;
  const cellW = (c.w - gap * (cols - 1)) / cols;
  const cellH = (c.h - (top - c.y) - gap * (rows - 1)) / rows;
  for (let m = 0; m < 12; m += 1) {
    const x = c.x + (m % cols) * (cellW + gap);
    const y = top + Math.floor(m / cols) * (cellH + gap);
    text(c, x, y + 4.5, 9.5, monthName(s.year, m + 1, s.locale), true);
    line(c, x, y + 6.5, x + cellW, y + 6.5, c.weight * 1.4);
    const dayW = cellW / 7;
    for (let d = 0; d < 7; d += 1) text(c, x + d * dayW + dayW / 2, y + 11, 6, weekdayName((s.weekStart + d) % 7, s.locale, 'narrow'), true, 'middle');
    const offset = (firstWeekday(s.year, m + 1) - s.weekStart + 7) % 7;
    const rowH = Math.min(5.2, (cellH - 14) / 6);
    for (let day = 1; day <= daysInMonth(s.year, m + 1); day += 1) {
      const index = offset + day - 1;
      text(c, x + (index % 7) * dayW + dayW / 2, y + 16 + Math.floor(index / 7) * rowH, 6.5, String(day), false, 'middle');
    }
  }
}

/** Builds every page of the planner. */
export function buildPlannerPages(s: PlannerSettings): Sheet[] {
  const size = PAGE_SIZES[s.page];
  const width = s.landscape ? size.height : size.width;
  const height = s.landscape ? size.width : size.height;
  const margin = Math.min(30, Math.max(4, s.margin));
  const color = TONES[s.tone].color;
  const weight = WEIGHTS[s.weight].mm;
  const count = Math.min(MAX_COUNT[s.kind], Math.max(1, Math.round(s.count)));
  const pages: Sheet[] = [];
  const start = parseIso(s.startDate) ?? new Date(Date.UTC(s.year, s.month - 1, 1));
  for (let i = 0; i < count; i += 1) {
    const ctx: Ctx = { s, x: margin, y: margin, w: width - 2 * margin, h: height - 2 * margin, color, weight, items: [] };
    if (s.kind === 'month') {
      const index = s.month - 1 + i;
      monthPage(ctx, s.year + Math.floor(index / 12), (index % 12) + 1);
    } else if (s.kind === 'week') weekPage(ctx, addDays(startOfWeek(start, s.weekStart), i * 7));
    else if (s.kind === 'day') dayPage(ctx, addDays(start, i));
    else yearPage(ctx);
    pages.push({ width, height, area: { x: margin, y: margin, w: ctx.w, h: ctx.h }, fixed: ctx.items, pageNumber: null });
  }
  return pages;
}
