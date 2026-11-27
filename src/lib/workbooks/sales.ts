/** Daily sales report workbook: a sales log, a day-by-day sheet for one month with the payment modes, sales by item, and a summary with charts. */
import { SheetBuilder, serial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { listSheet, settingsSheet } from './kit';
import { moneyFormat, type Region } from './region';
import { parseAmount } from './dates';
import T from '../../locales/packs/workbooks.more3.text.en.json';

const t = T.sales.sheet;
export interface SalesOptions { business: string; rows: Record<string, string>[]; spare: number; logRows: number; sample: boolean; region: Region; hinglish: boolean }

export function buildSales(o: SalesOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), N = T.common, cap = Math.min(300, Math.max(1, o.rows.length + o.spare)), first = 4, last = 3 + cap, lFirst = 4, lLast = 3 + o.logRows;
  const modes = t.modes as string[];
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetItems, t.sheetLog, t.sheetDaily, t.sheetSold, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });
  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.month, serial(now.getFullYear(), now.getMonth() + 1, 1), o.region.date]], t.settingsHelp);
  const m0 = `DATE(YEAR(${S0(1)}),MONTH(${S0(1)}),1)`;

  const items = listSheet(t.sheetItems, t.itemsTitle, t.itemsSub, [{ head: t.colItem, width: 28 }, { head: t.colPrice, width: 14, fmt: money, align: 'right' }, { head: t.colUnit, width: 12 }], o.rows.map((r) => [r.name, r.price === undefined || r.price === '' ? undefined : (parseAmount(r.price) ?? undefined), r.unit]), cap);
  items.validate({ range: `B${first}:B${last}`, kind: 'decimal', min: 0 });
  const It = (col: string) => `${q(t.sheetItems)}!$${col}$${first}:$${col}$${last}`;

  const monthStart = serial(now.getFullYear(), now.getMonth() + 1, 1);
  const sample = o.sample ? T.sales.sample.log.map((s) => [monthStart + s.day - 1, o.rows[s.item % Math.max(1, o.rows.length)]?.name, s.qty, undefined, modes[s.mode], s.note]) : [];
  const log = listSheet(t.sheetLog, t.logTitle, t.logSub, [{ head: t.colDate, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colItem, width: 26 }, { head: t.colQty, width: 10, fmt: '0.##', align: 'center' }, { head: t.colRate, width: 12, fmt: money, align: 'right' }, { head: t.colMode, width: 12 }, { head: t.colNote, width: 24 }, { head: t.colAmount, width: 14 }], sample, o.logRows);
  for (let r = lFirst; r <= lLast; r += 1) log.put(`G${r}`, `=IF(OR(B${r}="",C${r}=""),"",ROUND(C${r}*IF(D${r}<>"",D${r},IFERROR(INDEX(${It('B')},MATCH(B${r},${It('A')},0)),0)),2))`, { ...S.calc(money), bold: true });
  log.validate({ range: `A${lFirst}:A${lLast}`, kind: 'date', min: 36526 });
  log.validate({ range: `B${lFirst}:B${lLast}`, kind: 'list', listRef: It('A'), soft: true, title: t.colItem, prompt: t.itemHelp });
  log.validate({ range: `C${lFirst}:D${lLast}`, kind: 'decimal', min: 0 });
  log.validate({ range: `E${lFirst}:E${lLast}`, kind: 'list', list: modes, title: t.colMode, prompt: t.modeHelp });
  log.def.filter = `A3:G${lLast}`;
  const Lg = (col: string) => `${q(t.sheetLog)}!$${col}$${lFirst}:$${col}$${lLast}`;

  const day = new SheetBuilder(t.sheetDaily, C.greenBar); day.widths([14, 9, 11, 15, 14, 14, 14, 14]); day.def.freeze = { row: 3, col: 1 };
  day.put('A1', t.dailyTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.dailySub, S.subtitle).merge('A2:H2').height(1, 30);
  headerRow(day, 2, 0, [t.colDate, t.colSales, t.colQtyTotal, t.colAmount, ...modes], 36);
  for (let k = 0; k < 31; k += 1) {
    const r = 4 + k;
    day.put(`A${r}`, `=IF(MONTH(${m0}+${k})=MONTH(${m0}),${m0}+${k},"")`, S.calc(o.region.date, 'center'));
    day.put(`B${r}`, `=IF(A${r}="","",COUNTIFS(${Lg('A')},A${r},${Lg('G')},">0"))`, S.calc('0', 'center'));
    day.put(`C${r}`, `=IF(A${r}="","",SUMIFS(${Lg('C')},${Lg('A')},A${r}))`, S.calc('0.##', 'center'));
    day.put(`D${r}`, `=IF(A${r}="","",SUMIFS(${Lg('G')},${Lg('A')},A${r}))`, { ...S.calc(money), bold: true });
    ['E', 'F', 'G', 'H'].forEach((c) => day.put(`${c}${r}`, `=IF($A${r}="","",SUMIFS(${Lg('G')},${Lg('A')},$A${r},${Lg('E')},${c}$3))`, S.calc(money)));
  }
  day.put('A35', t.totals, { ...S.label, bold: true });
  ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach((c) => day.put(`${c}35`, `=SUM(${c}4:${c}34)`, { ...S.calc(c === 'B' ? '0' : c === 'C' ? '0.##' : money, c === 'B' || c === 'C' ? 'center' : 'right'), bold: true }));
  const Dy = (col: string) => `${q(t.sheetDaily)}!$${col}$4:$${col}$34`;

  const sold = new SheetBuilder(t.sheetSold, C.greenBar); sold.widths([30, 12, 15, 12]); sold.def.freeze = { row: 3, col: 1 };
  sold.put('A1', t.soldTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.soldSub, S.subtitle).merge('A2:D2').height(1, 30);
  headerRow(sold, 2, 0, [t.colItem, t.colQtyTotal, t.colAmount, t.colShare], 36);
  const inMonth = `${Lg('A')},">="&${m0},${Lg('A')},"<="&EOMONTH(${m0},0)`;
  for (let r = first; r <= last; r += 1) {
    sold.put(`A${r}`, `=IF(${q(t.sheetItems)}!A${r}="","",${q(t.sheetItems)}!A${r})`, S.calc());
    sold.put(`B${r}`, `=IF(A${r}="","",SUMIFS(${Lg('C')},${Lg('B')},A${r},${inMonth}))`, S.calc('0.##', 'center'));
    sold.put(`C${r}`, `=IF(A${r}="","",SUMIFS(${Lg('G')},${Lg('B')},A${r},${inMonth}))`, { ...S.calc(money), bold: true });
    sold.put(`D${r}`, `=IF(OR(A${r}="",${q(t.sheetDaily)}!$D$35=0),"",C${r}/${q(t.sheetDaily)}!$D$35)`, S.calc('0.0%', 'center'));
  }

  const u = new SheetBuilder(t.sheetSummary, C.greenBar); u.widths([34, 18, 4, 16, 12]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const kpis: [string, string, string][] = [[t.kpiTotal, `=${q(t.sheetDaily)}!D35`, money], [t.kpiSales, `=${q(t.sheetDaily)}!B35`, '0'], [t.kpiDays, `=COUNTIF(${Dy('D')},">0")`, '0'], [t.kpiAverage, `=IF(B5=0,"",B3/B5)`, money], [t.kpiBest, `=IF(B3=0,"",MAX(${Dy('D')}))`, money], [t.kpiBestDay, `=IF(B3=0,"",INDEX(${Dy('A')},MATCH(MAX(${Dy('D')}),${Dy('D')},0)))`, o.region.date]];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  headerRow(u, 9, 0, [t.colMode, t.colAmount], 30);
  modes.forEach((m, i) => u.put([0, 10 + i], m, S.calc()).put([1, 10 + i], `=${q(t.sheetDaily)}!${['E', 'F', 'G', 'H'][i]}35`, S.calc(money)));
  u.chart({ kind: 'pie', title: t.chartMode, cats: `${q(t.sheetSummary)}!$A$11:$A$${10 + modes.length}`, series: [{ name: t.colAmount, vals: `${q(t.sheetSummary)}!$B$11:$B$${10 + modes.length}`, color: C.orange }], at: { col: 3, row: 1, cols: 6, rows: 15 } });
  u.chart({ kind: 'col', title: t.chartDaily, cats: `${q(t.sheetDaily)}!$A$4:$A$34`, series: [{ name: t.colAmount, vals: `${q(t.sheetDaily)}!$D$4:$D$34`, color: C.orange }], at: { col: 0, row: 17, cols: 9, rows: 16 } });
  book.sheets = [guide.def, settings.def, items.def, log.def, day.def, sold.def, u.def];
  return book;
}
