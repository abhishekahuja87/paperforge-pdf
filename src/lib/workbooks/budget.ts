/** Monthly budget planner workbook: planned amounts for income and spending, the real amounts for each of 12 months, what is left over, and how far each line is from plan. */
import { SheetBuilder, colName, serial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { settingsSheet } from './kit';
import { parseAmount } from './dates';
import { moneyFormat, type Region } from './region';
import T from '../../locales/packs/workbooks.more.text.en.json';

const t = T.budget.sheet;
export interface BudgetOptions { title: string; rows: Record<string, string>[]; spareIncome: number; spareSpend: number; sample: boolean; region: Region; hinglish: boolean }
const M0 = 2, MONTHS = 12, FACTORS = [1, 1.15, 0.9, 1.25, 1.05, 0.85];

export function buildBudget(o: BudgetOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), N = T.common;
  const income = o.rows.filter((r) => r.kind !== 'expense' && r.name), spend = o.rows.filter((r) => r.kind === 'expense' && r.name);
  const inCap = Math.max(3, income.length + o.spareIncome), outCap = Math.max(8, spend.length + o.spareSpend);
  const inFirst = 7, inLast = inFirst + inCap - 1, inTotal = inLast + 1, outHead = inTotal + 2, outFirst = outHead + 1, outLast = outFirst + outCap - 1, outTotal = outLast + 1, left = outTotal + 2;
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const start = serial(now.getFullYear(), now.getMonth() + 1 - 5, 1);
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetBudget, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });
  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.name, o.title], [t.startMonth, start, 'mmmm yyyy'], [t.asOf, '=TODAY()', o.region.date]], t.settingsHelp);

  const cMonth = (m: number) => colName(M0 + m), mFirst = cMonth(0), mLast = cMonth(MONTHS - 1), cAct = colName(M0 + MONTHS), cPlan = colName(M0 + MONTHS + 1), cDiff = colName(M0 + MONTHS + 2);
  const b = new SheetBuilder(t.sheetBudget, C.greenBar); b.def.landscape = true; b.def.freeze = { row: 5, col: 1 }; b.def.printTitles = '$5:$5'; b.def.zoom = 90;
  b.widths([28, 13]); for (let m = 0; m < MONTHS; m += 1) b.def.widths[M0 + m] = 10; b.widths([13, 13, 14], M0 + MONTHS);
  b.put('A1', `=${S0(0)}`, { ...S.title, size: 16 }).height(0, 28).put('A2', t.budgetSub, S.subtitle).merge(`A2:${mLast}2`).height(1, 30);
  b.put('A3', t.asOfLabel, S.label).put('B3', `=${S0(2)}`, S.calc(o.region.date, 'center')).put('C3', t.monthsSoFar, { ...S.label, h: 'right' }).merge('C3:D3');
  b.put('E3', `=MAX(0,MIN(${MONTHS},(YEAR($B$3)-YEAR(${mFirst}5))*12+MONTH($B$3)-MONTH(${mFirst}5)+1))`, S.calc('0', 'center'));
  headerRow(b, 4, 0, [t.colCategory, t.colPlanned], 36);
  for (let m = 0; m < MONTHS; m += 1) b.put([M0 + m, 4], m === 0 ? `=${S0(1)}` : `=DATE(YEAR(${cMonth(m - 1)}5),MONTH(${cMonth(m - 1)}5)+1,1)`, { ...S.head, numFmt: 'mmm yy' });
  headerRow(b, 4, M0 + MONTHS, [t.colActual, t.colPlannedSoFar, t.colDiff], 36);
  const section = (row: number, label: string) => { b.put(`A${row}`, label, S.section); for (let c = 1; c <= M0 + MONTHS + 2; c += 1) b.put([c, row - 1], undefined, S.section); };
  section(inFirst - 1, t.income); section(outHead, t.spending);
  const lines = (list: Record<string, string>[], firstRow: number, cap: number, kind: 'in' | 'out') => {
    for (let i = 0; i < cap; i += 1) {
      const r = firstRow + i, line = list[i];
      b.put(`A${r}`, line?.name, S.input()).put(`B${r}`, parseAmount(line?.planned ?? '') ?? undefined, S.input(money));
      for (let m = 0; m < MONTHS; m += 1) {
        const value = o.sample && line && m < 6 ? Math.round((parseAmount(line.planned ?? '') ?? 0) * (kind === 'in' && i === 0 ? 1 : FACTORS[(i + m) % FACTORS.length]!) / 10) * 10 : undefined;
        b.put([M0 + m, r - 1], value, { ...S.cell(money), input: true, size: 9 });
      }
      b.put(`${cAct}${r}`, `=IF($A${r}="","",SUM(${mFirst}${r}:${mLast}${r}))`, S.calc(money));
      b.put(`${cPlan}${r}`, `=IF($A${r}="","",IF($B${r}="",0,$B${r})*$E$3)`, S.calc(money));
      b.put(`${cDiff}${r}`, `=IF($A${r}="","",${kind === 'in' ? `${cAct}${r}-${cPlan}${r}` : `${cPlan}${r}-${cAct}${r}`})`, { ...S.calc(money), bold: true });
    }
  };
  lines(income, inFirst, inCap, 'in'); lines(spend, outFirst, outCap, 'out');
  const total = (row: number, label: string, from: number, to: number) => {
    b.put(`A${row}`, label, { bold: true, h: 'right' }).put(`B${row}`, `=SUM(B${from}:B${to})`, { ...S.calc(money), bold: true });
    for (let m = 0; m < MONTHS; m += 1) b.put([M0 + m, row - 1], `=SUM(${cMonth(m)}${from}:${cMonth(m)}${to})`, { ...S.calc(money), bold: true, size: 9 });
    [cAct, cPlan, cDiff].forEach((col) => b.put(`${col}${row}`, `=SUM(${col}${from}:${col}${to})`, { ...S.calc(money), bold: true }));
  };
  total(inTotal, t.totalIncome, inFirst, inLast); total(outTotal, t.totalSpending, outFirst, outLast);
  b.put(`A${left}`, t.leftOver, { bold: true, h: 'right', size: 12 }).put(`B${left}`, `=B${inTotal}-B${outTotal}`, { ...S.calc(money), bold: true });
  for (let m = 0; m < MONTHS; m += 1) b.put([M0 + m, left - 1], `=${cMonth(m)}${inTotal}-${cMonth(m)}${outTotal}`, { ...S.calc(money), bold: true, size: 9 });
  b.put(`${cAct}${left}`, `=${cAct}${inTotal}-${cAct}${outTotal}`, { ...S.calc(money), bold: true }).put(`${cPlan}${left}`, `=${cPlan}${inTotal}-${cPlan}${outTotal}`, { ...S.calc(money), bold: true }).put(`${cDiff}${left}`, `=${cAct}${left}-${cPlan}${left}`, { ...S.calc(money), bold: true });
  b.rule({ range: `${mFirst}${left}:${cAct}${left}`, formula: `AND(ISNUMBER(${mFirst}${left}),${mFirst}${left}<0)`, fill: C.red, color: C.redText, bold: true });
  b.rule({ range: `${cDiff}${inFirst}:${cDiff}${left}`, formula: `AND(ISNUMBER(${cDiff}${inFirst}),${cDiff}${inFirst}<0)`, fill: C.red, color: C.redText, bold: true });
  b.rule({ range: `${cDiff}${inFirst}:${cDiff}${left}`, formula: `AND(ISNUMBER(${cDiff}${inFirst}),${cDiff}${inFirst}>=0,$A${inFirst}<>"")`, fill: C.green, color: C.greenText, bold: true });
  b.rule({ range: `${mFirst}${outFirst}:${mLast}${outLast}`, formula: `AND(ISNUMBER(${mFirst}${outFirst}),$B${outFirst}<>"",${mFirst}${outFirst}>$B${outFirst})`, fill: C.amber, color: C.amberText });
  b.validate({ range: `B${inFirst}:${mLast}${outLast}`, kind: 'decimal', min: 0, title: t.cellTitle, prompt: t.cellHelp, error: t.cellError });
  // The validation also covers the label rows and totals, which are locked, so it only matters for the boxes people type in.

  const u = new SheetBuilder(t.sheetSummary, C.orange); u.widths([32, 18, 4, 12, 12, 12]);
  const Bud = (ref: string) => `${q(t.sheetBudget)}!${ref}`;
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const kpis: [string, string, string?][] = [[t.kpiPlanIncome, `=${Bud(`B${inTotal}`)}`], [t.kpiPlanSpend, `=${Bud(`B${outTotal}`)}`], [t.kpiPlanLeft, `=${Bud(`B${left}`)}`], [t.kpiActIncome, `=${Bud(`${cAct}${inTotal}`)}`], [t.kpiActSpend, `=${Bud(`${cAct}${outTotal}`)}`], [t.kpiActLeft, `=${Bud(`${cAct}${left}`)}`], [t.kpiRate, `=IF(B6=0,"",B8/B6)`, '0%']];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt ?? money, 'right'), bold: true }));
  headerRow(u, 10, 0, [t.colMonth, t.totalIncome, t.totalSpending], 22);
  for (let m = 0; m < MONTHS; m += 1) u.put(`A${12 + m}`, `=TEXT(${Bud(`${cMonth(m)}5`)},"mmm yy")`, S.calc()).put(`B${12 + m}`, `=${Bud(`${cMonth(m)}${inTotal}`)}`, S.calc(money)).put(`C${12 + m}`, `=${Bud(`${cMonth(m)}${outTotal}`)}`, S.calc(money));
  u.chart({ kind: 'col', title: t.chartMonths, cats: `${q(t.sheetSummary)}!$A$12:$A$23`, series: [{ name: t.totalIncome, vals: `${q(t.sheetSummary)}!$B$12:$B$23`, color: C.greenBar }, { name: t.totalSpending, vals: `${q(t.sheetSummary)}!$C$12:$C$23`, color: C.redBar }], at: { col: 3, row: 1, cols: 8, rows: 20 } });

  book.sheets = [guide.def, settings.def, b.def, u.def];
  return book;
}
