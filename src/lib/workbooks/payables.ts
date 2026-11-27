/** Supplier payment tracker workbook: bills with a due date worked out from the credit days you type, what has been paid, what is overdue or due soon, and totals for each supplier. */
import { SheetBuilder, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { listSheet, settingsSheet, statusRules } from './kit';
import { parseAmount } from './dates';
import { moneyFormat, type Region } from './region';
import T from '../../locales/packs/workbooks.more.text.en.json';

const t = T.payables.sheet;
export interface PayablesOptions { business: string; rows: Record<string, string>[]; spare: number; logRows: number; creditDays: number; soonDays: number; sample: boolean; region: Region; hinglish: boolean }

export function buildPayables(o: PayablesOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), N = T.common, cap = Math.min(200, Math.max(1, o.rows.length + o.spare)), first = 4, last = 3 + cap, bFirst = 4, bLast = 3 + o.logRows, sFirst = 4, sLast = 3 + cap;
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetSuppliers, t.sheetBills, t.sheetTotals, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });
  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.asOf, '=TODAY()', o.region.date], [t.creditDays, o.creditDays], [t.soonDays, o.soonDays]], t.settingsHelp);
  const asOf = S0(1), defaultDays = S0(2), soon = S0(3);

  const suppliers = listSheet(t.sheetSuppliers, t.suppliersTitle, t.suppliersSub, [{ head: t.colSupplier, width: 28 }, { head: t.colPhone, width: 16 }, { head: t.colDays, width: 14, fmt: '0', align: 'center' }, { head: t.colNote, width: 32 }],
    o.rows.map((r) => [r.name, r.phone, parseAmount(r.days ?? '') ?? undefined, r.note]), cap);
  suppliers.validate({ range: `C${first}:C${last}`, kind: 'whole', min: 0, max: 365 });

  const today = todaySerial(now), Su = (col: string) => `${q(t.sheetSuppliers)}!$${col}$${first}:$${col}$${last}`;
  const sample = o.sample ? T.payables.sample.bills.map((b) => [today - b.ago, o.rows[b.supplier]?.name, b.no, b.amount, b.days ?? undefined, undefined, b.paid ?? undefined, b.paidAgo === undefined ? undefined : today - b.paidAgo]) : [];
  const bills = listSheet(t.sheetBills, t.billsTitle, t.billsSub, [{ head: t.colBillDate, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colSupplier, width: 28 }, { head: t.colBillNo, width: 13 }, { head: t.colAmount, width: 14, fmt: money }, { head: t.colDaysBill, width: 12, fmt: '0', align: 'center' }, { head: t.colDue, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colPaid, width: 14, fmt: money }, { head: t.colPaidDate, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colBalance, width: 14, fmt: money }, { head: t.colLeft, width: 11, fmt: '0', align: 'center' }, { head: t.colStatus, width: 13 }], sample, o.logRows);
  for (let r = bFirst; r <= bLast; r += 1) {
    const lookup = `IFERROR(IF(INDEX(${Su('C')},MATCH(B${r},${Su('A')},0))="",${defaultDays},INDEX(${Su('C')},MATCH(B${r},${Su('A')},0))),${defaultDays})`;
    bills.put(`F${r}`, `=IF(OR(A${r}="",B${r}=""),"",A${r}+IF(E${r}<>"",E${r},${lookup}))`, S.calc(o.region.date, 'center'));
    bills.put(`I${r}`, `=IF(D${r}="","",D${r}-IF(G${r}="",0,G${r}))`, { ...S.calc(money), bold: true });
    bills.put(`J${r}`, `=IF(OR(F${r}="",I${r}=""),"",IF(I${r}<=0,"",F${r}-${asOf}))`, S.calc('0', 'center'));
    bills.put(`K${r}`, `=IF(I${r}="","",IF(I${r}<=0,"${t.statusPaid}",IF(F${r}="","${t.statusOpen}",IF(F${r}<${asOf},"${t.statusOverdue}",IF(F${r}-${asOf}<=${soon},"${t.statusSoon}","${t.statusNotDue}")))))`, S.calc(undefined, 'center'));
  }
  bills.validate({ range: `B${bFirst}:B${bLast}`, kind: 'list', listRef: `${q(t.sheetSuppliers)}!$A$${first}:$A$${last}`, title: t.colSupplier, prompt: t.supplierHelp });
  bills.validate({ range: `D${bFirst}:D${bLast}`, kind: 'decimal', min: 0, title: t.colAmount, prompt: t.amountHelp });
  bills.validate({ range: `E${bFirst}:E${bLast}`, kind: 'whole', min: 0, max: 365, title: t.colDaysBill, prompt: t.daysHelp });
  bills.validate({ range: `G${bFirst}:G${bLast}`, kind: 'decimal', min: 0, title: t.colPaid, prompt: t.paidHelp });
  bills.def.filter = `A3:K${bLast}`;
  statusRules(bills, `K${bFirst}:K${bLast}`, `$K${bFirst}`, { good: t.statusPaid, warn: t.statusSoon, bad: t.statusOverdue });
  bills.rule({ range: `J${bFirst}:J${bLast}`, formula: `AND(ISNUMBER($J${bFirst}),$J${bFirst}<0)`, color: C.redText, bold: true });

  const Bl = (col: string) => `${q(t.sheetBills)}!$${col}$${bFirst}:$${col}$${bLast}`;
  const tt = new SheetBuilder(t.sheetTotals, C.greenBar); tt.widths([28, 10, 14, 14, 14, 14, 14]); tt.def.freeze = { row: 3, col: 1 }; tt.def.landscape = true;
  tt.put('A1', t.totalsTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.totalsSub, S.subtitle).merge('A2:G2').height(1, 30);
  headerRow(tt, 2, 0, [t.colSupplier, t.colOpenBills, t.colBilled, t.colPaid, t.colBalance, t.colOverdue, t.colSoon], 36);
  for (let i = 0; i < cap; i += 1) {
    const r = sFirst + i, su = `${q(t.sheetSuppliers)}!A${first + i}`;
    tt.put(`A${r}`, `=IF(${su}="","",${su})`, S.calc());
    tt.put(`B${r}`, `=IF($A${r}="","",COUNTIFS(${Bl('B')},$A${r},${Bl('I')},">0"))`, S.calc('0', 'center'));
    tt.put(`C${r}`, `=IF($A${r}="","",SUMIFS(${Bl('D')},${Bl('B')},$A${r}))`, S.calc(money));
    tt.put(`D${r}`, `=IF($A${r}="","",SUMIFS(${Bl('G')},${Bl('B')},$A${r}))`, S.calc(money));
    tt.put(`E${r}`, `=IF($A${r}="","",C${r}-D${r})`, { ...S.calc(money), bold: true });
    tt.put(`F${r}`, `=IF($A${r}="","",SUMIFS(${Bl('I')},${Bl('B')},$A${r},${Bl('K')},"${t.statusOverdue}"))`, S.calc(money));
    tt.put(`G${r}`, `=IF($A${r}="","",SUMIFS(${Bl('I')},${Bl('B')},$A${r},${Bl('K')},"${t.statusSoon}"))`, S.calc(money));
  }
  tt.put(`A${sLast + 1}`, N.totals, { bold: true, h: 'right' });
  ['B', 'C', 'D', 'E', 'F', 'G'].forEach((col) => tt.put(`${col}${sLast + 1}`, `=SUM(${col}${sFirst}:${col}${sLast})`, { ...S.calc(col === 'B' ? '0' : money, col === 'B' ? 'center' : undefined), bold: true }));
  tt.rule({ range: `F${sFirst}:F${sLast}`, formula: `AND(ISNUMBER($F${sFirst}),$F${sFirst}>0)`, fill: C.red, color: C.redText, bold: true });
  tt.rule({ range: `G${sFirst}:G${sLast}`, formula: `AND(ISNUMBER($G${sFirst}),$G${sFirst}>0)`, fill: C.amber, color: C.amberText, bold: true });

  const u = new SheetBuilder(t.sheetSummary, C.orange); u.widths([32, 18, 4, 12, 12, 12, 12, 12, 12]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const owe = (status: string) => `SUMIFS(${Bl('I')},${Bl('K')},"${status}")`;
  const kpis: [string, string, string?][] = [[t.kpiPayable, `=SUMIF(${Bl('I')},">0")`, money], [t.kpiOverdue, `=${owe(t.statusOverdue)}`, money], [t.kpiSoon, `=${owe(t.statusSoon)}`, money], [t.kpiOverdueBills, `=COUNTIF(${Bl('K')},"${t.statusOverdue}")`, '0'], [t.kpiSoonBills, `=COUNTIF(${Bl('K')},"${t.statusSoon}")`, '0']];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  u.put('A10', t.statusOverdue, { size: 8, color: C.muted }).put('B10', '=B4', { ...S.calc(money), size: 8 }).put('A11', t.statusSoon, { size: 8, color: C.muted }).put('B11', '=B5', { ...S.calc(money), size: 8 }).put('A12', t.statusNotDue, { size: 8, color: C.muted }).put('B12', `=${owe(t.statusNotDue)}+${owe(t.statusOpen)}`, { ...S.calc(money), size: 8 });
  u.chart({ kind: 'pie', title: t.chartStatus, cats: `${q(t.sheetSummary)}!$A$10:$A$12`, series: [{ name: t.chartStatus, vals: `${q(t.sheetSummary)}!$B$10:$B$12` }], at: { col: 3, row: 1, cols: 6, rows: 14 } });
  const n = Math.min(cap, Math.max(4, Math.min(12, o.rows.length)));
  u.chart({ kind: 'col', title: t.chartSuppliers, cats: `${q(t.sheetTotals)}!$A$${sFirst}:$A$${sFirst + n - 1}`, series: [{ name: t.colBalance, vals: `${q(t.sheetTotals)}!$E$${sFirst}:$E$${sFirst + n - 1}`, color: C.orange }], at: { col: 0, row: 15, cols: 9, rows: 16 } });

  book.sheets = [guide.def, settings.def, suppliers.def, bills.def, tt.def, u.def];
  return book;
}
