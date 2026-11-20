import { daysInMonth, firstWeekday, weekdayName } from '../planner/dates';
import { INK, fillRect, fitText, line, text, titleBar, type Ctx } from './draw';

export interface GridOptions {
  title: string;
  sub?: string;
  /** Heading and width (mm) of the column with names or tasks. */
  labelHead: string;
  labelW: number;
  /** Typed names or tasks for the first rows; the rest stay blank. */
  labels: string[];
  rows: number;
  year: number;
  month: number;
  /** Leave Sundays out, so only working days have a column. */
  skipSundays: boolean;
  /** Small weekday letters under the dates. */
  weekdays: boolean;
  /** Extra columns after the days, such as Present and Absent. */
  tail: { label: string; w: number }[];
  /** Rows under the grid with a label on the left and a box for each day, such as "Checked by". */
  foot: string[];
  legend: string;
}

const NUMBER_W = 8;
const FOOT_ROW = 7.5;

/** A month as a grid: names or tasks down the side, one narrow column for each day, a blank box for each. Used for attendance registers and cleaning checklists. */
export function monthGrid(c: Ctx, o: GridOptions): void {
  const top = c.y + titleBar(c, o.title, o.sub);
  const total = daysInMonth(o.year, o.month);
  const start = firstWeekday(o.year, o.month);
  const days: { d: number; weekday: number }[] = [];
  for (let d = 1; d <= total; d += 1) {
    const weekday = (start + d - 1) % 7;
    if (!(o.skipSundays && weekday === 0)) days.push({ d, weekday });
  }
  const tailW = o.tail.reduce((sum, col) => sum + col.w, 0);
  const dayW = (c.w - NUMBER_W - o.labelW - tailW) / days.length;
  const headH = o.weekdays ? 13 : 9;
  const footH = o.foot.length * FOOT_ROW;
  const bottom = c.y + c.h - 7;
  const rowH = (bottom - top - headH - footH) / o.rows;
  const gridTop = top + headH;
  const gridBottom = gridTop + o.rows * rowH + footH;

  const xs: number[] = [c.x, c.x + NUMBER_W, c.x + NUMBER_W + o.labelW];
  days.forEach((_, i) => xs.push(xs[2]! + (i + 1) * dayW));
  o.tail.forEach((col) => xs.push(xs[xs.length - 1]! + col.w));
  const tailStart = 2 + days.length;

  const head = c.fill ? '#ffffff' : INK;
  if (c.fill) fillRect(c, c.x, top, c.w, headH, c.accent);
  line(c, c.x, top, c.x + c.w, top, c.weight * 1.6);
  text(c, c.x + NUMBER_W / 2, top + 6, 8, 'No.', true, 'middle', head);
  fitText(c, c.x + NUMBER_W + 1, top + 5.4, o.labelW - 2, 7, o.labelHead, 9, true, 'middle', head);
  days.forEach(({ d, weekday }, i) => {
    const cx = xs[2 + i]! + dayW / 2;
    text(c, cx, top + 5.5, Math.min(7.5, dayW * 1.15), String(d), true, 'middle', head);
    if (o.weekdays) text(c, cx, top + 10.5, Math.min(7, dayW * 1.05), weekdayName(weekday, 'en', 'narrow'), weekday === 0, 'middle', c.fill ? '#ffffff' : weekday === 0 ? INK : '#666666');
  });
  o.tail.forEach((col, i) => fitText(c, xs[tailStart + i]! + 0.8, top + 5.4, col.w - 1.6, headH - 2, col.label, 7.5, true, 'middle', head));

  for (let r = 0; r <= o.rows; r += 1) line(c, c.x, gridTop + r * rowH, c.x + c.w, gridTop + r * rowH, r === 0 || r === o.rows ? c.weight * 1.6 : c.weight);
  for (let f = 1; f <= o.foot.length; f += 1) line(c, c.x, gridTop + o.rows * rowH + f * FOOT_ROW, c.x + c.w, gridTop + o.rows * rowH + f * FOOT_ROW, f === o.foot.length ? c.weight * 1.6 : c.weight);
  xs.forEach((x, k) => line(c, x, top, x, gridBottom, k === 0 || k === xs.length - 1 || k === 2 || k === tailStart ? c.weight * 1.6 : c.weight * 0.8));

  for (let r = 0; r < o.rows; r += 1) {
    const y = gridTop + r * rowH;
    text(c, c.x + NUMBER_W / 2, y + rowH / 2 + 1.2, Math.min(8, rowH * 1.3), String(r + 1), false, 'middle');
    if (o.labels[r]) fitText(c, c.x + NUMBER_W + 1.2, y + Math.min(5, rowH * 0.62), o.labelW - 2.4, rowH - 0.8, o.labels[r]!, Math.min(10, rowH * 1.5));
  }
  o.foot.forEach((label, f) => fitText(c, c.x + 1.5, gridTop + o.rows * rowH + f * FOOT_ROW + 4.8, NUMBER_W + o.labelW - 3, FOOT_ROW - 1, label, 8, true));
  text(c, c.x, c.y + c.h - 1.5, 7.5, o.legend);
}
