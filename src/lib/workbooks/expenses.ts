/** Expense claim workbook: a list of expenses with category, receipt and approval status, a limit check for each category, and totals by category and status. */
import { SheetBuilder, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { listSheet, settingsSheet, statusRules } from './kit';
import { parseAmount } from './dates';
import { moneyFormat, type Region } from './region';
import T from '../../locales/packs/workbooks.more2.text.en.json';

const t = T.expenses.sheet;
export interface ExpensesOptions { business: string; claimant: string; rows: Record<string, string>[]; spare: number; logRows: number; sample: boolean; region: Region; hinglish: boolean }

export function buildExpenses(o: ExpensesOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), N = T.common, cap = Math.min(40, Math.max(1, o.rows.length + o.spare)), first = 4, last = 3 + cap, lFirst = 4, lLast = 3 + o.logRows, today = todaySerial(now);
  const [stPending, stApproved, stRejected, stPaid] = t.statuses as [string, string, string, string];
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetCategories, t.sheetClaims, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });
  const { sheet: settings } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.claimant, o.claimant], [t.period, o.sample ? t.samplePeriod : '']], t.settingsHelp);

  const cats = listSheet(t.sheetCategories, t.categoriesTitle, t.categoriesSub, [{ head: t.colCategory, width: 30 }, { head: t.colLimit, width: 18, fmt: money }], o.rows.map((r) => [r.name, parseAmount(r.limit ?? '') ?? undefined]), cap);
  cats.validate({ range: `B${first}:B${last}`, kind: 'decimal', min: 0 });
  const Ca = (col: string) => `${q(t.sheetCategories)}!$${col}$${first}:$${col}$${last}`;

  const names = o.rows.map((r) => r.name);
  const sample = o.sample ? T.expenses.sample.claims.map((c) => [today - c.ago, c.what, names[c.cat % Math.max(1, names.length)], c.amount, c.receipt, c.status]) : [];
  const claims = listSheet(t.sheetClaims, t.claimsTitle, t.claimsSub, [{ head: t.colDate, width: 12, fmt: o.region.date, align: 'center' }, { head: t.colWhat, width: 32 }, { head: t.colCategory, width: 20 }, { head: t.colAmount, width: 14, fmt: money }, { head: t.colReceipt, width: 10, align: 'center' }, { head: t.colStatus, width: 13, align: 'center' }, { head: t.colLimit, width: 13, fmt: money }, { head: t.colCheck, width: 18 }], sample, o.logRows);
  for (let r = lFirst; r <= lLast; r += 1) {
    claims.put(`G${r}`, `=IF(OR(C${r}="",D${r}=""),"",IFERROR(IF(INDEX(${Ca('B')},MATCH(C${r},${Ca('A')},0))="","",INDEX(${Ca('B')},MATCH(C${r},${Ca('A')},0))),""))`, S.calc(money));
    claims.put(`H${r}`, `=IF(D${r}="","",IF(AND(G${r}<>"",D${r}>G${r}),"${t.overLimit}",IF(E${r}="${t.no}","${t.noReceipt}",IF(OR(A${r}="",C${r}=""),"${t.fixRow}",""))))`, { ...S.calc(), color: C.redText, bold: true });
  }
  claims.validate({ range: `C${lFirst}:C${lLast}`, kind: 'list', listRef: Ca('A'), title: t.colCategory, prompt: t.categoryHelp });
  claims.validate({ range: `D${lFirst}:D${lLast}`, kind: 'decimal', min: 0, title: t.colAmount, prompt: t.amountHelp });
  claims.validate({ range: `E${lFirst}:E${lLast}`, kind: 'list', list: [t.yes, t.no], title: t.colReceipt });
  claims.validate({ range: `F${lFirst}:F${lLast}`, kind: 'list', list: t.statuses, title: t.colStatus, prompt: t.statusHelp });
  claims.def.filter = `A3:H${lLast}`;
  statusRules(claims, `F${lFirst}:F${lLast}`, `$F${lFirst}`, { good: stPaid, warn: stPending, bad: stRejected });
  claims.rule({ range: `F${lFirst}:F${lLast}`, formula: `$F${lFirst}="${stApproved}"`, fill: C.green, color: C.greenText });
  claims.rule({ range: `D${lFirst}:D${lLast}`, formula: `AND($G${lFirst}<>"",$D${lFirst}>$G${lFirst})`, color: C.redText, bold: true });

  const Cl = (col: string) => `${q(t.sheetClaims)}!$${col}$${lFirst}:$${col}$${lLast}`;
  const u = new SheetBuilder(t.sheetSummary, C.greenBar); u.widths([30, 15, 15, 15, 15, 15]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const claimant = `${q(t.sheetSettings)}!$B$4`, period = `${q(t.sheetSettings)}!$B$5`;
  u.put('A2', `=${q(t.sheetSettings)}!$B$3&" - "&IF(${claimant}="","",${claimant}&" ")&IF(${period}="","",${period})`, S.subtitle).merge('A2:F2');
  const kpis: [string, string, string][] = [[t.kpiClaimed, `=SUM(${Cl('D')})`, money], [t.kpiApproved, `=SUMIF(${Cl('F')},"${stApproved}",${Cl('D')})`, money], [t.kpiPaid, `=SUMIF(${Cl('F')},"${stPaid}",${Cl('D')})`, money], [t.kpiToPay, `=B5`, money], [t.kpiPending, `=SUMIF(${Cl('F')},"${stPending}",${Cl('D')})`, money], [t.kpiRejected, `=SUMIF(${Cl('F')},"${stRejected}",${Cl('D')})`, money], [t.kpiFlags, `=COUNTIF(${Cl('H')},"${t.overLimit}")+COUNTIF(${Cl('H')},"${t.noReceipt}")+COUNTIF(${Cl('H')},"${t.fixRow}")`, '0']];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 3 + i], name, S.label).put([1, 3 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  headerRow(u, 11, 0, [t.colCategory, t.colClaimed, t.colApprovedPaid, t.colPending, t.colRejected, t.colLimit], 34);
  for (let i = 0; i < cap; i += 1) {
    const r = 13 + i, c = `${q(t.sheetCategories)}!A${first + i}`;
    u.put(`A${r}`, `=IF(${c}="","",${c})`, S.calc());
    u.put(`B${r}`, `=IF($A${r}="","",SUMIF(${Cl('C')},$A${r},${Cl('D')}))`, S.calc(money));
    u.put(`C${r}`, `=IF($A${r}="","",SUMIFS(${Cl('D')},${Cl('C')},$A${r},${Cl('F')},"${stApproved}")+SUMIFS(${Cl('D')},${Cl('C')},$A${r},${Cl('F')},"${stPaid}"))`, S.calc(money));
    u.put(`D${r}`, `=IF($A${r}="","",SUMIFS(${Cl('D')},${Cl('C')},$A${r},${Cl('F')},"${stPending}"))`, S.calc(money));
    u.put(`E${r}`, `=IF($A${r}="","",SUMIFS(${Cl('D')},${Cl('C')},$A${r},${Cl('F')},"${stRejected}"))`, S.calc(money));
    u.put(`F${r}`, `=IF($A${r}="","",IF(${q(t.sheetCategories)}!B${first + i}="","",${q(t.sheetCategories)}!B${first + i}))`, S.calc(money));
  }
  const n = Math.max(2, Math.min(cap, Math.max(1, o.rows.length)));
  u.chart({ kind: 'bar', title: t.chartCategory, cats: `${q(t.sheetSummary)}!$A$13:$A$${12 + n}`, series: [{ name: t.colClaimed, vals: `${q(t.sheetSummary)}!$B$13:$B$${12 + n}`, color: C.orange }], at: { col: 7, row: 2, cols: 6, rows: 16 } });
  book.sheets = [guide.def, settings.def, cats.def, claims.def, u.def];
  return book;
}
