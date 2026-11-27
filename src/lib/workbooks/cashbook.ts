/** Daily cash book workbook: money in and money out by day, category and payment mode (cash, bank, UPI), with a monthly profit and loss, balances for each mode and a year view. */
import { SheetBuilder, serial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { listSheet, settingsSheet } from './kit';
import { moneyFormat, type Region } from './region';
import T from '../../locales/packs/workbooks.more.text.en.json';

const t = T.cashbook.sheet;
export interface CashbookOptions { business: string; rows: Record<string, string>[]; spare: number; logRows: number; modes: { name: string; opening: number | null }[]; sample: boolean; region: Region; hinglish: boolean }
const IN_ROWS = 10, OUT_ROWS = 20;

/** The list rows hold a kind column: income or expense. */
export function buildCashbook(o: CashbookOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), N = T.common, monthStart = serial(now.getFullYear(), now.getMonth() + 1, 1), lFirst = 4, lLast = 3 + o.logRows;
  const incomeNames = o.rows.filter((r) => r.kind !== 'expense' && r.name).map((r) => r.name), expenseNames = o.rows.filter((r) => r.kind === 'expense' && r.name).map((r) => r.name);
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetLists, t.sheetBook, t.sheetMonth, t.sheetYear].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });
  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.month, monthStart, 'mmmm yyyy']], t.settingsHelp);

  // Lists: income types, expense types, payment modes with the balance at the start.
  const modes = o.modes.length ? o.modes : [{ name: '', opening: null }];
  const lists = new SheetBuilder(t.sheetLists, C.orange); lists.widths([30, 30, 24, 18]); lists.def.freeze = { row: 3, col: 0 };
  lists.put('A1', t.listsTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.listsSub, S.subtitle).merge('A2:D2').height(1, 30);
  headerRow(lists, 2, 0, [t.listIncome, t.listExpense, t.listModes, t.listOpening], 32);
  for (let i = 0; i < OUT_ROWS; i += 1) {
    lists.put([0, 3 + i], i < IN_ROWS ? incomeNames[i] : undefined, i < IN_ROWS ? S.input() : { fill: C.weekend, border: 'all', borderColor: 'E2E8F0' });
    lists.put([1, 3 + i], expenseNames[i], S.input());
    lists.put([2, 3 + i], i < 4 ? modes[i]?.name : undefined, i < 4 ? S.input() : { fill: C.weekend, border: 'all', borderColor: 'E2E8F0' });
    lists.put([3, 3 + i], i < 4 ? modes[i]?.opening ?? undefined : undefined, i < 4 ? S.input(money) : { fill: C.weekend, border: 'all', borderColor: 'E2E8F0' });
  }
  lists.validate({ range: 'D4:D7', kind: 'decimal' });
  const Li = `${q(t.sheetLists)}!$A$4:$A$${3 + IN_ROWS}`, Le = `${q(t.sheetLists)}!$B$4:$B$${3 + OUT_ROWS}`, Lm = `${q(t.sheetLists)}!$C$4:$C$7`;

  // The cash book: one row for each thing that happened.
  const sample = o.sample ? T.cashbook.sample.entries.map((e) => [monthStart + e.day - 1, e.note, modes[e.mode]?.name, e.kind === 'in' ? e.amount : undefined, e.kind === 'in' ? incomeNames[e.cat] : undefined, e.kind === 'out' ? e.amount : undefined, e.kind === 'out' ? expenseNames[e.cat] : undefined]) : [];
  const book1 = listSheet(t.sheetBook, t.bookTitle, t.bookSub, [{ head: t.colDate, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colDetails, width: 30 }, { head: t.colMode, width: 14 }, { head: t.colIn, width: 14, fmt: money }, { head: t.colInType, width: 20 }, { head: t.colOut, width: 14, fmt: money }, { head: t.colOutType, width: 22 }, { head: t.colCheck, width: 24 }], sample, o.logRows);
  for (let r = lFirst; r <= lLast; r += 1) book1.put(`H${r}`, `=IF(AND(OR(D${r}<>"",F${r}<>""),OR(A${r}="",C${r}="")),"${t.fixRow}",IF(AND(D${r}<>"",E${r}=""),"${t.addType}",IF(AND(F${r}<>"",G${r}=""),"${t.addType}","")))`, { ...S.calc(), color: C.redText, bold: true });
  book1.validate({ range: `C${lFirst}:C${lLast}`, kind: 'list', listRef: Lm, title: t.colMode, prompt: t.modeHelp });
  book1.validate({ range: `E${lFirst}:E${lLast}`, kind: 'list', listRef: Li, title: t.colInType, prompt: t.typeHelp });
  book1.validate({ range: `G${lFirst}:G${lLast}`, kind: 'list', listRef: Le, title: t.colOutType, prompt: t.typeHelp });
  book1.validate({ range: `D${lFirst}:D${lLast}`, kind: 'decimal', min: 0, title: t.colIn, prompt: t.amountHelp });
  book1.validate({ range: `F${lFirst}:F${lLast}`, kind: 'decimal', min: 0, title: t.colOut, prompt: t.amountHelp });
  book1.def.filter = `A3:H${lLast}`;
  const B = (col: string) => `${q(t.sheetBook)}!$${col}$${lFirst}:$${col}$${lLast}`;
  const month = S0(1), monthEnd = `EOMONTH(${month},0)`, inMonth = `${B('A')},">="&${month},${B('A')},"<="&${monthEnd}`;

  const mo = new SheetBuilder(t.sheetMonth, C.greenBar); mo.widths([30, 16, 11, 4, 12, 13, 13, 13, 13]); mo.def.landscape = true;
  mo.put('A1', `=${S0(0)}&" - "&TEXT(${month},"mmmm yyyy")`, { ...S.title, size: 16 }).height(0, 28);
  const kpi: [string, string][] = [[t.kpiIn, `=SUMIFS(${B('D')},${inMonth})`], [t.kpiOut, `=SUMIFS(${B('F')},${inMonth})`], [t.kpiProfit, '=B3-B4']];
  kpi.forEach(([name, f], i) => mo.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(money, 'right'), bold: true, size: i === 2 ? 12 : 11 }));
  mo.rule({ range: 'B5', formula: 'B5<0', fill: C.red, color: C.redText, bold: true });
  mo.rule({ range: 'B5', formula: 'B5>=0', fill: C.green, color: C.greenText, bold: true });
  mo.put('A7', t.modeBalances, S.section).put('B7', undefined, S.section);
  for (let i = 0; i < 4; i += 1) {
    const r = 8 + i, name = `${q(t.sheetLists)}!$C$${4 + i}`;
    mo.put(`A${r}`, `=IF(${name}="","",${name})`, S.calc());
    mo.put(`B${r}`, `=IF(A${r}="","",IF(${q(t.sheetLists)}!$D$${4 + i}="",0,${q(t.sheetLists)}!$D$${4 + i})+SUMIFS(${B('D')},${B('C')},A${r},${B('A')},"<="&${monthEnd})-SUMIFS(${B('F')},${B('C')},A${r},${B('A')},"<="&${monthEnd}))`, { ...S.calc(money), bold: true });
  }
  mo.put('A12', t.totalBalance, { bold: true, h: 'right' }).put('B12', '=SUM(B8:B11)', { ...S.calc(money), bold: true });
  mo.put('A14', t.pnlIncome, S.section).put('B14', t.colAmount, { ...S.section, h: 'right' }).put('C14', t.colShare, { ...S.section, h: 'right' });
  for (let i = 0; i < IN_ROWS; i += 1) {
    const r = 15 + i, name = `${q(t.sheetLists)}!$A$${4 + i}`;
    mo.put(`A${r}`, `=IF(${name}="","",${name})`, S.calc());
    mo.put(`B${r}`, `=IF(A${r}="","",SUMIFS(${B('D')},${B('E')},A${r},${inMonth}))`, S.calc(money));
    mo.put(`C${r}`, `=IF(OR(A${r}="",$B$3=0),"",B${r}/$B$3)`, S.calc('0%', 'right'));
  }
  const eStart = 15 + IN_ROWS + 1;
  mo.put(`A${eStart - 1}`, t.pnlExpense, S.section).put(`B${eStart - 1}`, t.colAmount, { ...S.section, h: 'right' }).put(`C${eStart - 1}`, t.colShare, { ...S.section, h: 'right' });
  for (let i = 0; i < OUT_ROWS; i += 1) {
    const r = eStart + i, name = `${q(t.sheetLists)}!$B$${4 + i}`;
    mo.put(`A${r}`, `=IF(${name}="","",${name})`, S.calc());
    mo.put(`B${r}`, `=IF(A${r}="","",SUMIFS(${B('F')},${B('G')},A${r},${inMonth}))`, S.calc(money));
    mo.put(`C${r}`, `=IF(OR(A${r}="",$B$4=0),"",B${r}/$B$4)`, S.calc('0%', 'right'));
  }
  // Day by day for the chart: day number, money in, money out.
  headerRow(mo, 6, 4, [t.colDay, t.colIn, t.colOut], 22);
  for (let d = 1; d <= 31; d += 1) {
    const r = 7 + d, date = `DATE(YEAR(${month}),MONTH(${month}),${d})`;
    mo.put(`E${r}`, `=IF(${d}>DAY(${monthEnd}),"",${d})`, S.calc('0', 'center'));
    mo.put(`F${r}`, `=IF(E${r}="","",SUMIFS(${B('D')},${B('A')},${date}))`, S.calc(money));
    mo.put(`G${r}`, `=IF(E${r}="","",SUMIFS(${B('F')},${B('A')},${date}))`, S.calc(money));
  }
  mo.chart({ kind: 'col', title: t.chartDays, cats: `${q(t.sheetMonth)}!$E$8:$E$38`, series: [{ name: t.colIn, vals: `${q(t.sheetMonth)}!$F$8:$F$38`, color: C.greenBar }, { name: t.colOut, vals: `${q(t.sheetMonth)}!$G$8:$G$38`, color: C.redBar }], at: { col: 7, row: 1, cols: 9, rows: 16 } });

  const yr = new SheetBuilder(t.sheetYear, C.orange); yr.widths([14, 16, 16, 16, 4]);
  yr.put('A1', `=${S0(0)}&" - "&YEAR(${month})`, { ...S.title, size: 16 }).height(0, 28);
  headerRow(yr, 2, 0, [t.colMonth, t.colIn, t.colOut, t.kpiProfit], 28);
  for (let m = 1; m <= 12; m += 1) {
    const r = 3 + m, from = `DATE(YEAR(${month}),${m},1)`, rng = `${B('A')},">="&${from},${B('A')},"<="&EOMONTH(${from},0)`;
    yr.put(`A${r}`, `=TEXT(${from},"mmm")`, S.calc()).put(`B${r}`, `=SUMIFS(${B('D')},${rng})`, S.calc(money)).put(`C${r}`, `=SUMIFS(${B('F')},${rng})`, S.calc(money)).put(`D${r}`, `=B${r}-C${r}`, { ...S.calc(money), bold: true });
  }
  yr.put('A16', N.totals, { bold: true, h: 'right' });
  ['B', 'C', 'D'].forEach((col) => yr.put(`${col}16`, `=SUM(${col}4:${col}15)`, { ...S.calc(money), bold: true }));
  yr.rule({ range: 'D4:D16', formula: 'AND(ISNUMBER(D4),D4<0)', color: C.redText, bold: true });
  yr.chart({ kind: 'col', title: t.chartYear, cats: `${q(t.sheetYear)}!$A$4:$A$15`, series: [{ name: t.colIn, vals: `${q(t.sheetYear)}!$B$4:$B$15`, color: C.greenBar }, { name: t.colOut, vals: `${q(t.sheetYear)}!$C$4:$C$15`, color: C.redBar }], at: { col: 5, row: 1, cols: 8, rows: 16 } });

  book.sheets = [guide.def, settings.def, lists.def, book1.def, mo.def, yr.def];
  return book;
}
