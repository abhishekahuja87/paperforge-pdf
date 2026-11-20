import { monthName } from '../planner/dates';
import { INK, clamp, fitText, flag, line, lines, makePages, num, str, table, text, titleBar, type Ctx } from './draw';
import { monthGrid } from './grid';
import type { Field, SheetDef } from './types';

const LOCALE = 'en';
const now = new Date();
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: monthName(2026, i + 1, LOCALE) }));

/** A label with a line after it. */
export function blank(c: Ctx, x: number, y: number, w: number, label: string, value = ''): void {
  text(c, x, y + 3.2, 8, label, true, 'start', INK);
  const at = x + label.length * 1.75 + 2;
  line(c, at, y + 3.7, x + w, y + 3.7, c.weight * 0.9);
  fitText(c, at + 1, y + 2.6, x + w - at - 2, 5, value, 9);
}

export interface TableSpec {
  id: string;
  label: string;
  hint: string;
  title: string;
  landscape: boolean;
  /** Column headings and relative widths. */
  columns: { label: string; w: number }[];
  rows: number;
  maxRows: number;
  /** Blank lines printed above the table, such as "Vehicle:". */
  top?: string[];
  /** A typed list for the first free column, with its label and default lines. */
  list?: { label: string; hint: string; defaults: string };
  /** The first column is a row number. */
  numbered?: boolean;
  legend?: string;
}

/** A page of one table: title, optional blank lines, a ruled table with typed entries in one column, and a note under it. */
export function tableSheet(s: TableSpec): SheetDef {
  const fields: Field[] = [];
  if (s.list) fields.push({ type: 'list', key: 'list', label: s.list.label, hint: s.list.hint, max: s.maxRows });
  fields.push({ type: 'number', key: 'rows', label: 'Rows on each page', min: 5, max: s.maxRows, step: 1, unit: 'rows' });
  fields.push({ type: 'number', key: 'pages', label: 'Pages', min: 1, max: 12, step: 1, unit: 'pages' });
  return {
    id: s.id, label: s.label, hint: s.hint, path: `/${s.id}`, landscape: s.landscape, fields,
    defaults: { list: s.list?.defaults ?? '', rows: s.rows, pages: 1 },
    build: (v, common) => {
      const rows = clamp(num(v, 'rows', s.rows), 5, s.maxRows);
      const typed = s.list ? lines(v, 'list', s.maxRows) : [];
      const pages = Math.max(clamp(num(v, 'pages', 1), 1, 12), Math.min(12, Math.ceil(typed.length / rows)));
      return makePages(common, pages, (c, i) => {
        let top = c.y + titleBar(c, s.title);
        if (s.top?.length) {
          const each = c.w / s.top.length;
          s.top.forEach((label, k) => blank(c, c.x + k * each, top + 1, each - 5, label));
          top += 10;
        }
        const bottom = c.y + c.h - (s.legend ? 6 : 0);
        table(c, top, bottom, s.columns, rows, typed.slice(i * rows, (i + 1) * rows), { numbered: s.numbered, headH: 10 });
        if (s.legend) text(c, c.x, c.y + c.h - 1, 7.5, s.legend);
      });
    },
  };
}

export interface HabitSpec { id: string; label: string; hint: string; title: string; defaults: string; listLabel: string; legend: string }

/** A month grid for habits, medicines-free chores or any daily tick list: items down the side, a box for each day. */
export function habitSheet(s: HabitSpec): SheetDef {
  return {
    id: s.id, label: s.label, hint: s.hint, path: `/${s.id}`, landscape: true,
    fields: [
      { type: 'list', key: 'list', label: s.listLabel, hint: 'One per line, up to 20.', max: 20 },
      { type: 'number', key: 'rows', label: 'Rows', min: 5, max: 20, step: 1, unit: 'rows' },
      { type: 'select', key: 'month', label: 'Month', options: MONTHS },
      { type: 'number', key: 'year', label: 'Year', min: 2020, max: 2100, step: 1, unit: '' },
      { type: 'number', key: 'months', label: 'How many months', min: 1, max: 12, step: 1, unit: 'months' },
      { type: 'toggle', key: 'weekdays', label: 'Weekday letters under the dates' },
    ],
    defaults: { list: s.defaults, rows: 10, month: String(now.getMonth() + 1), year: now.getFullYear(), months: 1, weekdays: true },
    build: (v, common) => {
      const items = lines(v, 'list', 20);
      const rows = Math.max(clamp(num(v, 'rows', 10), 5, 20), items.length);
      return makePages(common, clamp(num(v, 'months', 1), 1, 12), (c, i) => {
        const index = clamp(num(v, 'month', 1), 1, 12) - 1 + i;
        const year = clamp(num(v, 'year', now.getFullYear()), 2020, 2100) + Math.floor(index / 12);
        const month = (index % 12) + 1;
        monthGrid(c, { title: `${s.title}: ${monthName(year, month, LOCALE)} ${year}`, labelHead: 'Habit or task', labelW: 50, labels: items, rows, year, month, skipSundays: false, weekdays: flag(v, 'weekdays'), tail: [{ label: 'Days', w: 12 }], foot: [], legend: s.legend });
      });
    },
  };
}

/** Petty cash vouchers, four to a page. */
export const voucherSheet: SheetDef = {
  id: 'petty-cash-voucher-printable', label: 'Petty cash voucher', hint: 'Four vouchers on a page', path: '/petty-cash-voucher-printable', landscape: false,
  fields: [{ type: 'number', key: 'pages', label: 'Pages', min: 1, max: 12, step: 1, unit: 'pages' }, { type: 'text', key: 'payer', label: 'Business name (optional)', placeholder: 'Sharma Traders' }],
  defaults: { pages: 1, payer: '' },
  build: (v, common) => makePages(common, clamp(num(v, 'pages', 1), 1, 12), (c) => {
    const each = c.h / 4;
    for (let k = 0; k < 4; k += 1) {
      const y = c.y + k * each;
      const x = c.x;
      const w = c.w;
      line(c, x, y + 1, x + w, y + 1, c.weight * 1.6); line(c, x, y + each - 3, x + w, y + each - 3, c.weight * 1.6);
      line(c, x, y + 1, x, y + each - 3, c.weight * 1.6); line(c, x + w, y + 1, x + w, y + each - 3, c.weight * 1.6);
      text(c, x + 3, y + 8, 12, 'PETTY CASH VOUCHER', true, 'start', INK);
      if (str(v, 'payer')) text(c, x + w - 3, y + 8, 9, str(v, 'payer'), true, 'end', INK);
      blank(c, x + 3, y + 11, w * 0.3, 'No.:'); blank(c, x + w * 0.62, y + 11, w * 0.36, 'Date:');
      blank(c, x + 3, y + 20, w - 6, 'Paid to:');
      blank(c, x + 3, y + 29, w - 6, 'For (purpose):');
      blank(c, x + 3, y + 38, w * 0.5, 'Amount (Rs.):'); blank(c, x + w * 0.54, y + 38, w * 0.44, 'In words:');
      blank(c, x + 3, y + each - 18, w * 0.3, 'Approved by:'); blank(c, x + w * 0.34, y + each - 18, w * 0.3, 'Paid by:'); blank(c, x + w * 0.68, y + each - 18, w * 0.3, 'Received by:');
    }
  }),
};

/** Meeting minutes: details, agenda and discussion lines, and an action table. */
export const minutesSheet: SheetDef = {
  id: 'meeting-minutes-template-printable', label: 'Meeting minutes', hint: 'Attendees, notes and actions', path: '/meeting-minutes-template-printable', landscape: false,
  fields: [{ type: 'number', key: 'pages', label: 'Pages', min: 1, max: 12, step: 1, unit: 'pages' }, { type: 'number', key: 'actions', label: 'Action rows', min: 3, max: 10, step: 1, unit: 'rows' }],
  defaults: { pages: 1, actions: 6 },
  build: (v, common) => makePages(common, clamp(num(v, 'pages', 1), 1, 12), (c) => {
    let top = c.y + titleBar(c, 'Meeting minutes');
    blank(c, c.x, top + 1, c.w * 0.62, 'Meeting:'); blank(c, c.x + c.w * 0.66, top + 1, c.w * 0.34, 'Date:');
    blank(c, c.x, top + 10, c.w * 0.62, 'Place:'); blank(c, c.x + c.w * 0.66, top + 10, c.w * 0.34, 'Time:');
    blank(c, c.x, top + 19, c.w, 'Present:');
    line(c, c.x, top + 31, c.x + c.w, top + 31, c.weight * 0.8);
    top += 25;
    const actions = clamp(num(v, 'actions', 6), 3, 10);
    const tableH = 9 + actions * 9;
    const notesBottom = c.y + c.h - tableH - 6;
    text(c, c.x + 1, top + 5.5, 9.5, 'Agenda and discussion', true, 'start', INK);
    for (let y = top + 13; y < notesBottom; y += 7.5) line(c, c.x, y, c.x + c.w, y, c.weight * 0.8);
    table(c, c.y + c.h - tableH, c.y + c.h, [{ label: 'Action', w: 5 }, { label: 'Who', w: 2 }, { label: 'By when', w: 1.6 }, { label: 'Done', w: 1 }], actions, [], { headH: 9 });
  }),
};
