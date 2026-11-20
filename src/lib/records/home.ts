import { daysInMonth, firstWeekday, monthName, weekdayName } from '../planner/dates';
import { INK, clamp, fitText, flag, line, lines, makePages, num, table, text, titleBar } from './draw';
import type { Family, SheetDef } from './types';

const LOCALE = 'en';
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: monthName(2026, i + 1, LOCALE) }));
const now = new Date();

/** A table of the days of a month with one column for each thing tracked, such as milk, the maid or the newspaper. */
const milk: SheetDef = {
  id: 'milk-maid-attendance-calendar-printable',
  label: 'Milk and maid calendar',
  hint: 'Daily ticks for milk, maid, paper',
  path: '/milk-maid-attendance-calendar-printable',
  landscape: false,
  fields: [
    { type: 'list', key: 'items', label: 'Things to track', hint: 'One per line, up to 5. Add the unit in brackets if you count it, such as Milk (litres).', max: 5 },
    { type: 'select', key: 'month', label: 'Month', options: MONTHS },
    { type: 'number', key: 'year', label: 'Year', min: 2020, max: 2100, step: 1, unit: '' },
    { type: 'number', key: 'months', label: 'How many months', min: 1, max: 12, step: 1, unit: 'months' },
    { type: 'toggle', key: 'totals', label: 'Total, rate and amount due rows', hint: 'Space at the bottom to add up the month and work out the bill.' },
  ],
  defaults: { items: 'Milk (litres)\nMaid\nNewspaper', month: String(now.getMonth() + 1), year: now.getFullYear(), months: 1, totals: true },
  build: (v, common) => {
    const items = lines(v, 'items', 5);
    const cols = items.length > 0 ? items : ['Milk (litres)'];
    const months = clamp(num(v, 'months', 1), 1, 12);
    return makePages(common, months, (c, i) => {
      const index = clamp(num(v, 'month', 1), 1, 12) - 1 + i;
      const year = clamp(num(v, 'year', now.getFullYear()), 2020, 2100) + Math.floor(index / 12);
      const month = (index % 12) + 1;
      const days = daysInMonth(year, month);
      const start = firstWeekday(year, month);
      const top = c.y + titleBar(c, `Daily record: ${monthName(year, month, LOCALE)} ${year}`, 'Tick or write the quantity each day.');
      const extra = flag(v, 'totals') ? 3 : 0;
      const columns = [{ label: 'Date', w: 0.9 }, { label: 'Day', w: 1 }, ...cols.map((label) => ({ label, w: 2.2 })), { label: 'Remarks', w: 2.4 }];
      const t = table(c, top, c.y + c.h, columns, days + extra, [], { headH: 10 });
      for (let d = 0; d < days; d += 1) {
        const weekday = (start + d) % 7;
        const y = t.firstRow + d * t.rowH + t.rowH / 2 + 1.2;
        const size = Math.min(9, t.rowH * 1.4);
        text(c, (t.xs[0]! + t.xs[1]!) / 2, y, size, String(d + 1), true, 'middle', INK);
        text(c, (t.xs[1]! + t.xs[2]!) / 2, y, size, weekdayName(weekday, LOCALE, 'short'), weekday === 0, 'middle', weekday === 0 ? INK : '#555555');
      }
      if (extra) ['Total', 'Rate', 'Amount due'].forEach((label, k) => {
        const y = t.firstRow + (days + k) * t.rowH;
        line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
        text(c, c.x + 1.5, y + t.rowH / 2 + 1.4, Math.min(8, t.rowH * 1.3), label, true, 'start', INK);
      });
    });
  },
};

const BUDGET_DEFAULT = {
  income: 'Salary\nOther income',
  fixed: 'Rent or home loan EMI\nElectricity\nInternet and phone\nSchool fees\nInsurance',
  variable: 'Groceries\nMilk and vegetables\nFuel and travel\nMedical\nEating out\nShopping',
  savings: 'SIP or RD\nEmergency fund',
};

/** One page for a month: income, fixed costs, everyday costs and savings, each with a planned and an actual column. */
const budget: SheetDef = {
  id: 'monthly-household-budget-sheet-printable',
  label: 'Monthly budget',
  hint: 'Income, bills and savings',
  path: '/monthly-household-budget-sheet-printable',
  landscape: false,
  fields: [
    { type: 'select', key: 'month', label: 'Month', options: MONTHS },
    { type: 'number', key: 'year', label: 'Year', min: 2020, max: 2100, step: 1, unit: '' },
    { type: 'toggle', key: 'planned', label: 'Planned and actual columns', hint: 'Off prints a single Actual column.' },
    { type: 'list', key: 'income', label: 'Income lines', hint: 'One per line, up to 10.', max: 10 },
    { type: 'list', key: 'fixed', label: 'Fixed costs', hint: 'Bills that stay the same each month.', max: 10 },
    { type: 'list', key: 'variable', label: 'Everyday costs', hint: 'Spending that changes each month.', max: 10 },
    { type: 'list', key: 'savings', label: 'Savings and investing', max: 10 },
  ],
  defaults: { month: String(now.getMonth() + 1), year: now.getFullYear(), planned: true, ...BUDGET_DEFAULT },
  build: (v, common) => makePages(common, 1, (c) => {
    const month = clamp(num(v, 'month', 1), 1, 12);
    const year = clamp(num(v, 'year', now.getFullYear()), 2020, 2100);
    const top = c.y + titleBar(c, `Household budget: ${monthName(year, month, LOCALE)} ${year}`, 'Amounts in rupees. Write the plan first, then the actual at the end of the month.');
    const planned = flag(v, 'planned');
    const sections = [
      { name: 'Income', rows: lines(v, 'income', 10), total: 'Total income' },
      { name: 'Fixed costs', rows: lines(v, 'fixed', 10), total: 'Total fixed costs' },
      { name: 'Everyday costs', rows: lines(v, 'variable', 10), total: 'Total everyday costs' },
      { name: 'Savings and investing', rows: lines(v, 'savings', 10), total: 'Total saved' },
    ];
    const blank = 1;
    const count = sections.reduce((sum, s) => sum + 2 + s.rows.length + blank, 0) + 2;
    const rowH = Math.min(9, (c.y + c.h - top) / count);
    const labelW = c.w * (planned ? 0.52 : 0.72);
    const colW = planned ? (c.w - labelW) / 2 : c.w - labelW;
    const size = Math.min(10, rowH * 1.5);
    let y = top;
    for (const s of sections) {
      line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
      text(c, c.x + 1.5, y + rowH / 2 + 1.4, size, s.name, true, 'start', INK);
      if (planned) text(c, c.x + labelW + colW / 2, y + rowH / 2 + 1.4, size * 0.9, 'Planned', true, 'middle', INK);
      text(c, c.x + labelW + (planned ? colW * 1.5 : colW / 2), y + rowH / 2 + 1.4, size * 0.9, 'Actual', true, 'middle', INK);
      y += rowH;
      const rows = [...s.rows, ...Array.from({ length: blank }, () => '')];
      rows.forEach((label) => {
        line(c, c.x, y, c.x + c.w, y, c.weight * 0.8);
        fitText(c, c.x + 3, y + rowH / 2 + 1.3, labelW - 4, rowH, label, size);
        y += rowH;
      });
      line(c, c.x, y, c.x + c.w, y, c.weight);
      text(c, c.x + 3, y + rowH / 2 + 1.4, size, s.total, true, 'start', INK);
      y += rowH;
    }
    line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
    text(c, c.x + 1.5, y + rowH / 2 + 1.4, size, 'Left over (income minus costs and savings)', true, 'start', INK);
    y += rowH;
    line(c, c.x, y, c.x + c.w, y, c.weight * 1.6);
    const bottom = y;
    [c.x, c.x + labelW, ...(planned ? [c.x + labelW + colW] : []), c.x + c.w].forEach((x, i, all) => line(c, x, top, x, bottom, i === 0 || i === all.length - 1 ? c.weight * 1.6 : c.weight));
  }),
};

/** A register of what was bought, with warranty dates, plus an optional page for service visits. */
const warranty: SheetDef = {
  id: 'warranty-service-record-printable',
  label: 'Warranty and service record',
  hint: 'Appliances, bills and service dates',
  path: '/warranty-service-record-printable',
  landscape: true,
  fields: [
    { type: 'list', key: 'items', label: 'Items to pre-fill (optional)', hint: 'One per line, such as Refrigerator or Water purifier. Leave empty for blank rows.', max: 24 },
    { type: 'number', key: 'rows', label: 'Rows', min: 8, max: 24, step: 1, unit: 'rows' },
    { type: 'toggle', key: 'service', label: 'Add a service log page', hint: 'Date, work done, cost and next service due.' },
  ],
  defaults: { items: '', rows: 14, service: true },
  build: (v, common) => {
    const items = lines(v, 'items', 24);
    const rows = Math.max(clamp(num(v, 'rows', 14), 8, 24), items.length);
    return makePages(common, flag(v, 'service') ? 2 : 1, (c, i) => {
      if (i === 0) {
        const top = c.y + titleBar(c, 'Warranty and bills record', 'Staple the bill or take a photo. The warranty period is on the warranty card.');
        table(c, top, c.y + c.h, [{ label: 'No.', w: 0.5 }, { label: 'Item', w: 2.2 }, { label: 'Brand and model', w: 2.4 }, { label: 'Bought on', w: 1.4 }, { label: 'Shop and bill number', w: 2.6 }, { label: 'Warranty until', w: 1.4 }, { label: 'Notes', w: 2.4 }], rows, items, { numbered: true });
      } else {
        const top = c.y + titleBar(c, 'Service log', 'Write down every repair or service so you can show the history.');
        table(c, top, c.y + c.h, [{ label: 'Date', w: 1.2 }, { label: 'Item', w: 2.2 }, { label: 'What was done', w: 3.6 }, { label: 'Cost (Rs.)', w: 1.2 }, { label: 'Next service due', w: 1.6 }, { label: 'Technician and phone', w: 2.4 }], Math.min(rows, 18), []);
      }
    });
  },
};

export const HOME_FAMILY: Family = {
  key: 'home',
  headingLabel: 'Household or family name (optional)',
  headingPlaceholder: 'e.g. Sharma family',
  sheets: [milk, budget, warranty],
};
