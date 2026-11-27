/** Marks and rank workbook: marks for each student in up to six subjects, with total, percentage, pass or fail, grade, rank, and class averages for every subject. */
import { SheetBuilder, colName, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { settingsSheet, statusRules } from './kit';
import type { Region } from './region';
import T from '../../locales/packs/workbooks.more2.text.en.json';

const t = T.gradebook.sheet;
export interface GradebookOptions { title: string; rows: Record<string, string>[]; subjects: string[]; maxMarks: number; passPercent: number; spare: number; sample: boolean; region: Region; hinglish: boolean }

export function buildGradebook(o: GradebookOptions): Book {
  const N = T.common, subjects = o.subjects.length ? o.subjects.slice(0, 6) : [t.defaultSubject], n = subjects.length, cap = Math.min(200, Math.max(1, o.rows.length + o.spare)), first = 4, last = 3 + cap;
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetMarks, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });
  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.name, o.title], [t.max, o.maxMarks], [t.pass, o.passPercent]], t.settingsHelp);
  const max = S0(1), pass = S0(2);
  // The grade scale sits under the settings: lowest percentage first, one grade for each step.
  settings.put('A8', t.gradeTitle, S.section).put('B8', undefined, S.section);
  settings.put('A9', t.gradeFrom, S.head).put('B9', t.gradeName, S.head);
  T.gradebook.grades.forEach(([from, name], i) => { settings.put([0, 9 + i], from, S.input('0')); settings.put([1, 9 + i], name, S.input()); });
  const gFrom = `${q(t.sheetSettings)}!$A$10:$A$${9 + T.gradebook.grades.length}`, gName = `${q(t.sheetSettings)}!$B$10:$B$${9 + T.gradebook.grades.length}`;
  settings.validate({ range: `A10:A${9 + T.gradebook.grades.length}`, kind: 'decimal', min: 0, max: 100 });

  const m0 = 2, cTot = colName(m0 + n), cPct = colName(m0 + n + 1), cRes = colName(m0 + n + 2), cGrade = colName(m0 + n + 3), cRank = colName(m0 + n + 4), firstS = colName(m0), lastS = colName(m0 + n - 1);
  const marks = new SheetBuilder(t.sheetMarks, C.orange); marks.def.freeze = { row: 3, col: 2 }; marks.def.landscape = true;
  marks.widths([9, 26]); for (let i = 0; i < n; i += 1) marks.def.widths[m0 + i] = 11; marks.widths([10, 10, 10, 8, 7], m0 + n);
  marks.put('A1', `=${q(t.sheetSettings)}!$B$3`, { ...S.title, size: 16 }).height(0, 28).put('A2', t.marksSub, S.subtitle).merge(`A2:${cRank}2`).height(1, 30);
  headerRow(marks, 2, 0, [t.colRoll, t.colName], 36); headerRow(marks, 2, m0, subjects, 36); headerRow(marks, 2, m0 + n, [t.colTotal, t.colPercent, t.colResult, t.colGrade, t.colRank], 36);
  for (let i = 0; i < cap; i += 1) {
    const r = first + i, row = o.rows[i], sm = o.sample ? T.gradebook.sample.marks[i % T.gradebook.sample.marks.length]! : [];
    marks.put(`A${r}`, row?.roll, S.input(undefined, 'center')); marks.put(`B${r}`, row?.name, S.input());
    for (let k = 0; k < n; k += 1) marks.put([m0 + k, r - 1], row?.name && o.sample ? Math.round(((sm[k % sm.length] as number) / 100) * o.maxMarks) : undefined, S.input('0.##', 'center'));
    marks.put(`${cTot}${r}`, `=IF(COUNT(${firstS}${r}:${lastS}${r})=0,"",SUM(${firstS}${r}:${lastS}${r}))`, { ...S.calc('0.##', 'center'), bold: true });
    marks.put(`${cPct}${r}`, `=IF(${cTot}${r}="","",ROUND(${cTot}${r}/(${max}*COUNT(${firstS}${r}:${lastS}${r}))*100,1))`, S.calc('0.0', 'center'));
    marks.put(`${cRes}${r}`, `=IF(${cTot}${r}="","",IF(MIN(${firstS}${r}:${lastS}${r})<${max}*${pass}/100,"${t.fail}","${t.passed}"))`, S.calc(undefined, 'center'));
    marks.put(`${cGrade}${r}`, `=IF(${cPct}${r}="","",INDEX(${gName},MATCH(${cPct}${r},${gFrom},1)))`, { ...S.calc(undefined, 'center'), bold: true });
    marks.put(`${cRank}${r}`, `=IF(${cTot}${r}="","",COUNTIF(${cTot}$${first}:${cTot}$${last},">"&${cTot}${r})+1)`, { ...S.calc('0', 'center'), bold: true });
  }
  marks.validate({ range: `${firstS}${first}:${lastS}${last}`, kind: 'decimal', min: 0, title: t.colMarks, prompt: t.marksHelp });
  marks.def.filter = `A3:${cRank}${last}`;
  statusRules(marks, `${cRes}${first}:${cRes}${last}`, `$${cRes}${first}`, { good: t.passed, bad: t.fail });
  marks.rule({ range: `${firstS}${first}:${lastS}${last}`, formula: `AND(ISNUMBER(${firstS}${first}),${firstS}${first}<${max}*${pass}/100)`, color: C.redText, bold: true });

  const Ms = (col: string) => `${q(t.sheetMarks)}!$${col}$${first}:$${col}$${last}`;
  const u = new SheetBuilder(t.sheetSummary, C.greenBar); u.widths([30, 14, 14, 14, 14]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const kpis: [string, string, string][] = [[t.kpiStudents, `=COUNT(${Ms(cTot)})`, '0'], [t.kpiPassed, `=COUNTIF(${Ms(cRes)},"${t.passed}")`, '0'], [t.kpiPassRate, `=IF(B3=0,"",B4/B3)`, '0%'], [t.kpiAverage, `=IF(B3=0,"",AVERAGE(${Ms(cPct)}))`, '0.0'], [t.kpiTopper, `=IFERROR(INDEX(${Ms('B')},MATCH(1,${Ms(cRank)},0)),"")`, '@']];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  headerRow(u, 8, 0, [t.colSubject, t.colAverage, t.colHighest, t.colPassed, t.colTaken], 34);
  subjects.forEach((_s, i) => {
    const col = colName(m0 + i), r = 10 + i;
    u.put(`A${r}`, `=${q(t.sheetMarks)}!${col}3`, S.calc());
    u.put(`B${r}`, `=IF(COUNT(${Ms(col)})=0,"",AVERAGE(${Ms(col)}))`, S.calc('0.0'));
    u.put(`C${r}`, `=IF(COUNT(${Ms(col)})=0,"",MAX(${Ms(col)}))`, S.calc('0.##'));
    u.put(`D${r}`, `=COUNTIF(${Ms(col)},">="&${max}*${pass}/100)`, S.calc('0', 'center'));
    u.put(`E${r}`, `=COUNT(${Ms(col)})`, S.calc('0', 'center'));
  });
  u.chart({ kind: 'col', title: t.chartSubject, cats: `${q(t.sheetSummary)}!$A$10:$A$${9 + n}`, series: [{ name: t.colAverage, vals: `${q(t.sheetSummary)}!$B$10:$B$${9 + n}`, color: C.orange }], at: { col: 6, row: 1, cols: 6, rows: 15 } });
  book.sheets = [guide.def, settings.def, marks.def, u.def];
  return book;
}
