/** Project timeline (Gantt chart) workbook: a task list with a timeline that colours itself from the dates and the percent done. */
import { SheetBuilder, colName, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, labels, q, startHere } from './common';
import type { Region } from './region';

const t = labels.gantt;
export interface GanttTask { task: string; owner: string; start: number | null; end: number | null; done: number }
export interface GanttOptions { project: string; tasks: GanttTask[]; spareRows: number; columns: number; unit: 'days' | 'weeks'; startDate: number | null; region: Region; hinglish: boolean }

export interface GanttSpec { task: string; owner: string; from: number; days: number; done: number }
/** Sample tasks placed around today (two weeks back from this Monday), so a sample always looks alive. */
export function sampleGantt(specs: GanttSpec[], now = new Date()): GanttTask[] {
  const monday = todaySerial(now) - ((now.getDay() + 6) % 7) - 14;
  return specs.map((x) => ({ task: x.task, owner: x.owner, start: monday + x.from, end: monday + x.from + x.days - 1, done: x.done }));
}

export function buildGantt(o: GanttOptions, now = new Date()): Book {
  const count = Math.max(o.tasks.length + o.spareRows, 10), cols = o.columns, TL = 8;
  const first = 8, last = first + count - 1;                      // 1-based task rows
  const lastCol = colName(TL + cols - 1), plan = t.sheetPlan, owners = t.sheetOwners;
  const owner = [...new Set(o.tasks.map((x) => x.owner.trim()).filter(Boolean))].slice(0, 30);
  const known = o.tasks.filter((x) => x.start !== null);
  const weekday = (n: number) => (new Date(Date.UTC(1899, 11, 30) + n * 86400000).getUTCDay() + 6) % 7; // 0 = Monday
  const startDate = o.startDate ?? (known.length ? Math.min(...known.map((x) => x.start!)) : todaySerial(now));
  const timelineStart = o.unit === 'weeks' ? startDate - weekday(startDate) : startDate;

  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: o.project || t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: t.legendInput, calc: t.legendCalc, sheets: labels.common.sheets, credit: '' }, sheets: [{ name: plan, about: t.aboutPlan }, { name: owners, about: t.aboutOwners }], region: o.region });

  const p = new SheetBuilder(plan, C.orange); const d = p.def;
  d.landscape = true; d.freeze = { row: 7, col: 2 }; d.printTitles = '$6:$7'; d.zoom = 90;
  p.widths([4, 30, 14, 11.5, 11.5, 6.5, 7.5, 12.5]); for (let i = 0; i < cols; i += 1) p.def.widths[TL + i] = 4.4;
  p.put('A1', o.project || t.title, { ...S.title, size: 16 }).height(0, 28);
  p.put('A2', t.subtitle, S.subtitle).merge(`A2:H2`).height(1, 28);
  p.put('B3', t.startsOn, { ...S.label, h: 'right' }).put('C3', o.startDate === null && !known.length ? timelineStart : timelineStart, S.input(o.region.date));
  p.put('D3', t.eachColumn, { ...S.label, h: 'right' }).merge('D3:E3').put('F3', o.unit === 'weeks' ? t.weeks : t.days, { ...S.input(), h: 'center' }).merge('F3:G3');
  p.put('H3', `=IF($F$3="${t.weeks}",7,1)`, { ...S.calc(`0" ${t.perColumn}"`, 'center'), size: 9 }).height(2, 22);
  p.put('A4', `="${t.tasks}: "&COUNTA(B${first}:B${last})&"   ${t.done}: "&COUNTIF(H${first}:H${last},"${t.statusDone}")&"   ${t.inProgress}: "&COUNTIF(H${first}:H${last},"${t.statusProgress}")&"   ${t.overdue}: "&COUNTIF(H${first}:H${last},"${t.statusOverdue}")&"   ${t.complete}: "&TEXT(IFERROR(SUM(G${first}:G${last})/COUNTA(B${first}:B${last}),0),"0%")`, { bold: true, color: C.ink, fill: C.soft, v: 'center' }).merge('A4:H4').height(3, 24);
  p.height(4, 6);
  headerRow(p, 6, 0, [t.colNo, t.colTask, t.colOwner, t.colStart, t.colEnd, t.colDays, t.colDone, t.colStatus], 24);
  for (let i = 0; i < cols; i += 1) {
    const c = colName(TL + i), prev = colName(TL + i - 1);
    p.put(`${c}7`, i === 0 ? '=$C$3' : `=${prev}7+$H$3`, { ...S.head, numFmt: 'd', size: 9, border: undefined });
    p.put(`${c}6`, i === 0 ? `=TEXT(${c}7,"mmm")` : `=IF(MONTH(${c}7)<>MONTH(${prev}7),TEXT(${c}7,"mmm"),"")`, { bold: true, size: 9, color: C.orange, h: 'left' });
  }
  for (let i = 0; i < count; i += 1) {
    const r = first + i, task = o.tasks[i];
    p.put(`A${r}`, i + 1, { color: C.muted, h: 'center', border: 'all' });
    p.put(`B${r}`, task?.task, S.input()).put(`C${r}`, task?.owner, S.input()).put(`D${r}`, task?.start ?? undefined, S.input(o.region.date, 'center')).put(`E${r}`, task?.end ?? undefined, S.input(o.region.date, 'center'));
    p.put(`F${r}`, `=IF(OR(D${r}="",E${r}=""),"",E${r}-D${r}+1)`, S.calc('0', 'center')).put(`G${r}`, task ? task.done : undefined, S.input('0%', 'center'));
    p.put(`H${r}`, `=IF(OR(D${r}="",E${r}=""),"",IF(G${r}>=1,"${t.statusDone}",IF(E${r}<TODAY(),"${t.statusOverdue}",IF(D${r}<=TODAY(),"${t.statusProgress}","${t.statusNot}"))))`, S.calc(undefined, 'center'));
    for (let k = 0; k < cols; k += 1) p.put([TL + k, r - 1], undefined, { border: 'all', borderColor: 'E2E8F0' });
  }
  const area = `${colName(TL)}${first}:${lastCol}${last}`, a = colName(TL);
  const bar = `AND($D${first}<>"",$E${first}<>"",${a}$7<=$E${first},${a}$7+$H$3-1>=$D${first})`;
  p.rule({ range: area, formula: `AND(${bar},$G${first}>0,${a}$7<=$D${first}+ROUND($F${first}*$G${first},0)-1)`, fill: C.greenBar, stop: true });
  p.rule({ range: area, formula: `AND(${bar},$H${first}="${t.statusOverdue}")`, fill: C.redBar, stop: true });
  p.rule({ range: area, formula: bar, fill: C.orangeSoft, stop: true });
  p.rule({ range: area, formula: `AND(${a}$7<=TODAY(),${a}$7+$H$3>TODAY())`, fill: 'FEF08A', stop: true });
  p.rule({ range: area, formula: `AND($H$3=1,WEEKDAY(${a}$7,2)>5)`, fill: C.calc });
  const status = `H${first}:H${last}`;
  p.rule({ range: status, formula: `$H${first}="${t.statusDone}"`, fill: C.green, color: C.greenText, bold: true });
  p.rule({ range: status, formula: `$H${first}="${t.statusOverdue}"`, fill: C.red, color: C.redText, bold: true });
  p.rule({ range: status, formula: `$H${first}="${t.statusProgress}"`, fill: C.amber, color: C.amberText, bold: true });
  p.rule({ range: `E${first}:E${last}`, formula: `AND(D${first}<>"",E${first}<>"",E${first}<D${first})`, fill: C.red, color: C.redText });
  p.validate({ range: 'F3', kind: 'list', list: [t.days, t.weeks], title: t.eachColumn, prompt: t.unitHelp });
  p.validate({ range: `D${first}:E${last}`, kind: 'date', min: 36526, title: t.colStart, prompt: t.dateHelp, error: t.dateError });
  p.validate({ range: `G${first}:G${last}`, kind: 'decimal', min: 0, max: 1, title: t.colDone, prompt: t.doneHelp, error: t.doneError });
  p.validate({ range: `C${first}:C${last}`, kind: 'list', listRef: `${q(owners)}!$A$5:$A$34`, soft: true, title: t.colOwner, prompt: t.ownerHelp });
  p.validate({ range: 'C3', kind: 'date', min: 36526 });

  const w = new SheetBuilder(owners, C.orange);
  w.widths([22, 9, 9, 12, 10, 12]);
  w.put('A1', t.ownersTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.ownersSub, S.subtitle).merge('A2:F2').height(1, 28);
  headerRow(w, 3, 0, [t.colOwner, t.tasks, t.done, t.inProgress, t.overdue, t.complete], 28);
  for (let i = 0; i < 30; i += 1) {
    const r = 5 + i, nm = owner[i]; const pr = (col: string) => `${q(plan)}!$${col}$${first}:$${col}$${last}`;
    w.put(`A${r}`, nm, S.input());
    w.put(`B${r}`, `=IF(A${r}="","",COUNTIF(${pr('C')},A${r}))`, S.calc('0', 'center'));
    w.put(`C${r}`, `=IF(A${r}="","",COUNTIFS(${pr('C')},A${r},${pr('H')},"${t.statusDone}"))`, S.calc('0', 'center'));
    w.put(`D${r}`, `=IF(A${r}="","",COUNTIFS(${pr('C')},A${r},${pr('H')},"${t.statusProgress}"))`, S.calc('0', 'center'));
    w.put(`E${r}`, `=IF(A${r}="","",COUNTIFS(${pr('C')},A${r},${pr('H')},"${t.statusOverdue}"))`, S.calc('0', 'center'));
    w.put(`F${r}`, `=IF(OR(A${r}="",B${r}=0),"",SUMIF(${pr('C')},A${r},${pr('G')})/B${r})`, S.calc('0%', 'center'));
  }
  w.rule({ range: 'E5:E34', formula: 'AND(ISNUMBER(E5),E5>0)', fill: C.red, color: C.redText, bold: true });
  if (owner.length) w.chart({ kind: 'col', title: t.chartTitle, cats: `${q(owners)}!$A$5:$A$${4 + owner.length}`, series: [{ name: t.tasks, vals: `${q(owners)}!$B$5:$B$${4 + owner.length}`, color: C.orange }], at: { col: 7, row: 2, cols: 8, rows: 16 } });
  w.def.freeze = { row: 4, col: 0 };

  book.sheets = [guide.def, p.def, w.def];
  return book;
}

/** How wide the timeline should be for these tasks: days for short projects, weeks for long ones. */
export function suggestTimeline(tasks: GanttTask[], unit: 'auto' | 'days' | 'weeks'): { unit: 'days' | 'weeks'; columns: number } {
  const dated = tasks.filter((x) => x.start !== null && x.end !== null);
  if (!dated.length) return { unit: unit === 'days' ? 'days' : 'weeks', columns: 26 };
  const first = Math.min(...dated.map((x) => x.start!)), last = Math.max(...dated.map((x) => x.end!)), span = Math.max(1, last - first + 1);
  const use = unit === 'auto' ? (span > 75 ? 'weeks' : 'days') : unit, step = use === 'weeks' ? 7 : 1;
  return { unit: use, columns: Math.max(20, Math.min(use === 'weeks' ? 78 : 100, Math.ceil(span / step) + 4)) };
}
