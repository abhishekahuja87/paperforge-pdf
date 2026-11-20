import { addDays, daysInMonth, firstWeekday, longDate, monthName, parseIso, weekdayName } from '../planner/dates';
import { INK, clamp, fitText, flag, line, lines, makePages, num, ruled, str, table, text, titleBar } from './draw';
import type { Family, SheetDef } from './types';

const LOCALE = 'en';
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: monthName(2026, i + 1, LOCALE) }));
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

/** Staff down the side, the days of the month across, a blank box for each day. */
const attendance: SheetDef = {
  id: 'staff-attendance-register-printable',
  label: 'Staff attendance register',
  hint: 'A month, staff by days',
  path: '/staff-attendance-register-printable',
  landscape: true,
  fields: [
    { type: 'list', key: 'staff', label: 'Staff names (optional)', hint: 'One per line, up to 30. Leave empty to write the names by hand.', max: 30 },
    { type: 'number', key: 'rows', label: 'Rows', min: 8, max: 30, step: 1, unit: 'rows' },
    { type: 'select', key: 'month', label: 'Month', options: MONTHS },
    { type: 'number', key: 'year', label: 'Year', min: 2020, max: 2100, step: 1, unit: '' },
    { type: 'number', key: 'months', label: 'How many months', min: 1, max: 12, step: 1, unit: 'months' },
    { type: 'toggle', key: 'weekdays', label: 'Weekday letters under the dates' },
    { type: 'toggle', key: 'salary', label: 'Daily rate and amount columns', hint: 'Amount = days present multiplied by the daily rate.' },
  ],
  defaults: { staff: '', rows: 15, month: String(now.getMonth() + 1), year: now.getFullYear(), months: 1, weekdays: true, salary: false },
  build: (v, common) => {
    const staff = lines(v, 'staff', 30);
    const rows = Math.max(clamp(num(v, 'rows', 15), 8, 30), staff.length);
    const months = clamp(num(v, 'months', 1), 1, 12);
    return makePages(common, months, (c, i) => {
      const index = clamp(num(v, 'month', 1), 1, 12) - 1 + i;
      const year = clamp(num(v, 'year', now.getFullYear()), 2020, 2100) + Math.floor(index / 12);
      const month = (index % 12) + 1;
      const days = daysInMonth(year, month);
      const start = firstWeekday(year, month);
      const salary = flag(v, 'salary');
      const top = c.y + titleBar(c, `Attendance: ${monthName(year, month, LOCALE)} ${year}`);
      const noW = 8; const nameW = 44; const totW = 14; const rateW = salary ? 16 : 0; const amtW = salary ? 22 : 0;
      const dayW = (c.w - noW - nameW - totW - rateW - amtW) / days;
      const headH = flag(v, 'weekdays') ? 13 : 9;
      const legendH = 7;
      const bottom = c.y + c.h - legendH;
      const rowH = (bottom - top - headH) / rows;
      const xs: number[] = [c.x, c.x + noW, c.x + noW + nameW];
      for (let d = 0; d < days; d += 1) xs.push(xs[2]! + (d + 1) * dayW);
      xs.push(xs[xs.length - 1]! + totW);
      if (salary) { xs.push(xs[xs.length - 1]! + rateW); xs.push(xs[xs.length - 1]! + amtW); }
      const gridTop = top + headH;
      line(c, c.x, top, c.x + c.w, top, c.weight * 1.6);
      text(c, c.x + noW / 2, top + 6, 8, 'No.', true, 'middle', INK);
      text(c, c.x + noW + nameW / 2, top + 6, 9, 'Name', true, 'middle', INK);
      for (let d = 0; d < days; d += 1) {
        const weekday = (start + d) % 7;
        text(c, xs[2 + d]! + dayW / 2, top + 5.5, Math.min(7.5, dayW * 1.15), String(d + 1), true, 'middle', INK);
        if (flag(v, 'weekdays')) text(c, xs[2 + d]! + dayW / 2, top + 10.5, Math.min(7, dayW * 1.05), weekdayName(weekday, LOCALE, 'narrow'), weekday === 0, 'middle', weekday === 0 ? INK : '#666666');
      }
      const tailStart = 2 + days;
      text(c, (xs[tailStart]! + xs[tailStart + 1]!) / 2, top + 6, 7.5, 'Days', true, 'middle', INK);
      if (salary) {
        text(c, (xs[tailStart + 1]! + xs[tailStart + 2]!) / 2, top + 6, 7.5, 'Rate', true, 'middle', INK);
        text(c, (xs[tailStart + 2]! + xs[tailStart + 3]!) / 2, top + 6, 7.5, 'Amount', true, 'middle', INK);
      }
      for (let r = 0; r <= rows; r += 1) line(c, c.x, gridTop + r * rowH, c.x + c.w, gridTop + r * rowH, r === 0 || r === rows ? c.weight * 1.6 : c.weight);
      xs.forEach((x, k) => line(c, x, top, x, gridTop + rows * rowH, k === 0 || k === xs.length - 1 || k === 2 || k === 2 + days ? c.weight * 1.6 : c.weight * 0.8));
      for (let r = 0; r < rows; r += 1) {
        const y = gridTop + r * rowH;
        text(c, c.x + noW / 2, y + rowH / 2 + 1.2, Math.min(8, rowH * 1.3), String(r + 1), false, 'middle');
        if (staff[r]) fitText(c, c.x + noW + 1.2, y + Math.min(5, rowH * 0.62), nameW - 2.4, rowH - 0.8, staff[r]!, Math.min(10, rowH * 1.5));
      }
      text(c, c.x, c.y + c.h - 1.5, 7.5, 'Write P for present, A for absent, H for half day and L for leave. Check your state\'s Shops and Establishments rules for the registers you must keep.');
    });
  },
};

/** One page per customer: date, what was given, what was received and the running balance. */
const ledger: SheetDef = {
  id: 'udhaar-credit-ledger-printable',
  label: 'Udhaar (credit) ledger',
  hint: 'A page for each customer',
  path: '/udhaar-credit-ledger-printable',
  landscape: false,
  fields: [
    { type: 'list', key: 'customers', label: 'Customer names (optional)', hint: 'One per line, up to 20. Each customer gets a page. Leave empty for blank pages.', max: 20 },
    { type: 'number', key: 'pages', label: 'Blank pages', min: 1, max: 20, step: 1, unit: 'pages' },
    { type: 'toggle', key: 'phone', label: 'Phone number line' },
  ],
  defaults: { customers: '', pages: 2, phone: true },
  build: (v, common) => {
    const customers = lines(v, 'customers', 20);
    const count = customers.length > 0 ? customers.length : clamp(num(v, 'pages', 2), 1, 20);
    return makePages(common, count, (c, i) => {
      const top = c.y + titleBar(c, 'Credit ledger (udhaar khata)');
      text(c, c.x, top + 6, 10, 'Customer:', true, 'start', INK);
      line(c, c.x + 22, top + 6.5, c.x + c.w * (flag(v, 'phone') ? 0.62 : 1), top + 6.5, c.weight);
      if (customers[i]) fitText(c, c.x + 24, top + 5.5, c.w * (flag(v, 'phone') ? 0.62 : 1) - 26, 7, customers[i]!, 12, true);
      if (flag(v, 'phone')) { text(c, c.x + c.w * 0.66, top + 6, 10, 'Phone:', true, 'start', INK); line(c, c.x + c.w * 0.66 + 16, top + 6.5, c.x + c.w, top + 6.5, c.weight); }
      const gridTop = top + 12;
      const bottom = c.y + c.h - 8;
      const rows = 26;
      table(c, gridTop, bottom, [{ label: 'Date', w: 1.1 }, { label: 'Details of items', w: 3.2 }, { label: 'Given (Rs.)', w: 1.3 }, { label: 'Received (Rs.)', w: 1.3 }, { label: 'Balance (Rs.)', w: 1.3 }], rows);
      text(c, c.x, c.y + c.h - 1.5, 7.5, 'Balance = the balance above + given - received. Ask the customer to sign or initial when a large amount is settled.');
    });
  },
};

const DENOMS = ['500', '200', '100', '50', '20', '10', 'Coins'];

/** One page for each day: opening cash, sales by how they were paid, expenses and a count of the notes in the drawer. */
const cash: SheetDef = {
  id: 'daily-cash-sales-sheet-printable',
  label: 'Daily cash and sales',
  hint: 'Opening, sales, expenses, closing',
  path: '/daily-cash-sales-sheet-printable',
  landscape: false,
  fields: [
    { type: 'date', key: 'start', label: 'First day' },
    { type: 'number', key: 'days', label: 'How many days (one page each)', min: 1, max: 31, step: 1, unit: 'days' },
    { type: 'number', key: 'expenses', label: 'Expense lines', min: 4, max: 12, step: 1, unit: 'lines' },
    { type: 'toggle', key: 'notes', label: 'Note and coin count table', hint: 'Count of 500, 200, 100, 50, 20 and 10 rupee notes and coins in the drawer.' },
  ],
  defaults: { start: today, days: 7, expenses: 8, notes: true },
  build: (v, common) => {
    const start = parseIso(str(v, 'start')) ?? now;
    const days = clamp(num(v, 'days', 7), 1, 31);
    const expenses = clamp(num(v, 'expenses', 8), 4, 12);
    return makePages(common, days, (c, i) => {
      const date = addDays(start, i);
      const top = c.y + titleBar(c, 'Daily cash and sales', longDate(date, LOCALE));
      const notes = flag(v, 'notes');
      const leftW = notes ? c.w * 0.56 : c.w;
      const gap = 6;
      const rightX = c.x + leftW + gap;
      const rightW = c.w - leftW - gap;
      const lineRow = (x: number, y: number, w: number, label: string, bold = false) => {
        text(c, x + 1, y + 5.5, 9.5, label, bold, 'start', bold ? INK : '#333333');
        line(c, x, y + 8, x + w, y + 8, c.weight * (bold ? 1.4 : 0.9));
        line(c, x + w * 0.66, y, x + w * 0.66, y + 8, c.weight * 0.8);
      };
      let y = top + 1;
      lineRow(c.x, y, leftW, 'Opening cash (Rs.)', true); y += 11;
      text(c, c.x, y + 4, 10, 'Sales', true, 'start', INK); y += 6;
      ['Cash sales', 'UPI and online', 'Card', 'Credit given (udhaar)'].forEach((label) => { lineRow(c.x, y, leftW, label); y += 9; });
      lineRow(c.x, y, leftW, 'Total sales', true); y += 12;
      text(c, c.x, y + 4, 10, 'Money received', true, 'start', INK); y += 6;
      ['Udhaar collected', 'Other cash in'].forEach((label) => { lineRow(c.x, y, leftW, label); y += 9; });
      y += 3;
      text(c, c.x, y + 4, 10, 'Expenses paid', true, 'start', INK); y += 6;
      const expRow = Math.min(8, (c.y + c.h - 30 - y) / expenses);
      for (let r = 0; r < expenses; r += 1) { line(c, c.x, y + (r + 1) * expRow, c.x + leftW, y + (r + 1) * expRow, c.weight * 0.8); }
      line(c, c.x + leftW * 0.66, y, c.x + leftW * 0.66, y + expenses * expRow, c.weight * 0.8);
      y += expenses * expRow + 2;
      lineRow(c.x, y, leftW, 'Total expenses', true); y += 11;
      lineRow(c.x, y, leftW, 'Expected closing cash', true);
      fitText({ x: 0, y: 0, w: 0, h: 0, color: c.color, weight: c.weight, heading: '', items: c.items }, c.x, y + 14, leftW, 8, 'Opening cash + cash sales + udhaar collected + other cash in - expenses.', 7.5);
      if (notes) {
        let ry = top + 1;
        text(c, rightX, ry + 4, 10, 'Cash in the drawer', true, 'start', INK); ry += 6;
        const rowH = 9.5;
        const cols = [0.38, 0.28, 0.34];
        const xs = [rightX, rightX + rightW * cols[0]!, rightX + rightW * (cols[0]! + cols[1]!), rightX + rightW];
        ['Note', 'Count', 'Rs.'].forEach((label, k) => text(c, (xs[k]! + xs[k + 1]!) / 2, ry + 6, 8.5, label, true, 'middle', INK));
        line(c, rightX, ry, rightX + rightW, ry, c.weight * 1.6);
        ry += 9;
        DENOMS.forEach((label, k) => { line(c, rightX, ry + k * rowH, rightX + rightW, ry + k * rowH, c.weight * 0.9); text(c, (xs[0]! + xs[1]!) / 2, ry + k * rowH + 6.3, 9, label === 'Coins' ? 'Coins' : `Rs. ${label}`, false, 'middle', '#333333'); });
        const endY = ry + DENOMS.length * rowH;
        line(c, rightX, endY, rightX + rightW, endY, c.weight * 1.6);
        text(c, rightX + 1, endY + 6.3, 9, 'Total counted', true, 'start', INK);
        line(c, rightX, endY + 9.5, rightX + rightW, endY + 9.5, c.weight * 1.6);
        xs.forEach((x, k) => line(c, x, ry - 9, x, endY + 9.5, k === 0 || k === 3 ? c.weight * 1.6 : c.weight * 0.8));
        let by = endY + 16;
        text(c, rightX, by + 5, 9.5, 'Difference (counted minus expected)', true, 'start', INK);
        line(c, rightX, by + 12, rightX + rightW, by + 12, c.weight);
        by += 22;
        text(c, rightX, by + 5, 9.5, 'Notes', true, 'start', INK);
        ruled(c, rightX, rightX + rightW, by + 5, c.y + c.h, 8);
      }
    });
  },
};

/** A list of items with an opening figure, what was counted and the difference. */
const stock: SheetDef = {
  id: 'stock-count-sheet-printable',
  label: 'Stock count sheet',
  hint: 'Opening, counted, difference',
  path: '/stock-count-sheet-printable',
  landscape: false,
  fields: [
    { type: 'list', key: 'items', label: 'Items to pre-fill (optional)', hint: 'One per line, up to 100. They run down the pages in order. Leave empty for blank rows.', max: 100 },
    { type: 'number', key: 'rows', label: 'Rows on each page', min: 12, max: 35, step: 1, unit: 'rows' },
    { type: 'number', key: 'pages', label: 'Blank pages', min: 1, max: 20, step: 1, unit: 'pages' },
  ],
  defaults: { items: '', rows: 25, pages: 2 },
  build: (v, common) => {
    const items = lines(v, 'items', 100);
    const rows = clamp(num(v, 'rows', 25), 12, 35);
    const count = items.length > 0 ? Math.ceil(items.length / rows) : clamp(num(v, 'pages', 2), 1, 20);
    return makePages(common, count, (c, i) => {
      const top = c.y + titleBar(c, 'Stock count sheet', count > 1 ? `Page ${i + 1} of ${count}` : '');
      text(c, c.x + c.w * 0.45, c.y + 13.5, 9, 'Date:', true, 'start', INK);
      line(c, c.x + c.w * 0.45 + 11, c.y + 14, c.x + c.w * 0.7, c.y + 14, c.weight);
      text(c, c.x + c.w * 0.73, c.y + 13.5, 9, 'Counted by:', true, 'start', INK);
      line(c, c.x + c.w * 0.73 + 19, c.y + 14, c.x + c.w, c.y + 14, c.weight);
      const slice = items.slice(i * rows, (i + 1) * rows);
      table(c, top + 2, c.y + c.h, [{ label: 'No.', w: 0.5 }, { label: 'Item', w: 3.4 }, { label: 'Unit', w: 0.9 }, { label: 'Opening', w: 1.2 }, { label: 'Counted', w: 1.2 }, { label: 'Difference', w: 1.2 }, { label: 'Notes', w: 2 }], rows, slice.map((label) => label), { numbered: true });
    });
  },
};

export const SHOP_FAMILY: Family = {
  key: 'shop',
  headingLabel: 'Shop or business name (optional)',
  headingPlaceholder: 'e.g. Sharma General Store',
  sheets: [attendance, ledger, cash, stock],
};

