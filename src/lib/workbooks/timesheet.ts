/** Timesheet workbook: a log of start and end times, hours worked with overtime over a daily limit you set, and totals and pay for any period. */
import { SheetBuilder, todaySerial, fromSerial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { listSheet, settingsSheet } from './kit';
import { parseAmount } from './dates';
import { moneyFormat, numberFormat, type Region } from './region';
import T from '../../locales/packs/workbooks.more.text.en.json';

const t = T.timesheet.sheet;
export interface TimesheetOptions { business: string; rows: Record<string, string>[]; spare: number; logRows: number; normalHours: number; multiplier: number; sample: boolean; region: Region; hinglish: boolean }

/** "09:30" as a fraction of a day, which is how Excel stores a time. */
const clock = (text: string): number => { const [h = '0', m = '0'] = text.split(':'); return (Number(h) * 60 + Number(m)) / 1440; };

export function buildTimesheet(o: TimesheetOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), hours = numberFormat(o.region, 2), N = T.common, cap = Math.min(200, Math.max(1, o.rows.length + o.spare));
  const first = 4, last = 3 + cap, lFirst = 4, lLast = 3 + o.logRows, tFirst = 7, tLast = 6 + cap;
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const today = todaySerial(now), from = today - 13;
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetPeople, t.sheetLog, t.sheetTotals].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });

  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.from, from, o.region.date], [t.to, today, o.region.date], [t.normal, o.normalHours], [t.multiplier, o.multiplier]], t.settingsHelp);
  const people = listSheet(t.sheetPeople, t.peopleTitle, t.peopleSub, [{ head: t.colName, width: 28 }, { head: t.colRole, width: 22 }, { head: t.colRate, width: 16, fmt: money }],
    o.rows.map((r) => [r.name, r.role, parseAmount(r.rate ?? '') ?? undefined]), cap);
  people.validate({ range: `C${first}:C${last}`, kind: 'decimal', min: 0 });

  // Sample shifts: for every weekday in the period listed in `days` (1 is Monday).
  const sample: (string | number | undefined)[][] = [];
  if (o.sample) for (let day = from; day <= today; day += 1) {
    const weekday = fromSerial(day).getUTCDay();
    T.timesheet.sample.shifts.forEach((s) => { if (s.days.includes(weekday) && o.rows[s.person]) sample.push([day, o.rows[s.person]!.name, clock(s.start), clock(s.end), s.brk]); });
  }
  const log = listSheet(t.sheetLog, t.logTitle, t.logSub, [{ head: t.colDate, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colPerson, width: 26 }, { head: t.colStart, width: 10, fmt: 'hh:mm', align: 'center' }, { head: t.colEnd, width: 10, fmt: 'hh:mm', align: 'center' }, { head: t.colBreak, width: 12, fmt: '0', align: 'center' }, { head: t.colHours, width: 11, fmt: hours }, { head: t.colRegular, width: 11, fmt: hours }, { head: t.colOvertime, width: 11, fmt: hours }, { head: t.colNote, width: 28 }], sample, o.logRows);
  const norm = S0(3);
  for (let r = lFirst; r <= lLast; r += 1) {
    log.put(`F${r}`, `=IF(OR(C${r}="",D${r}=""),"",MAX(0,ROUND(MOD(D${r}-C${r},1)*24-IF(E${r}="",0,E${r})/60,2)))`, { ...S.calc(hours), bold: true });
    log.put(`G${r}`, `=IF(F${r}="","",MIN(F${r},${norm}))`, S.calc(hours));
    log.put(`H${r}`, `=IF(F${r}="","",MAX(0,F${r}-${norm}))`, S.calc(hours));
  }
  log.validate({ range: `B${lFirst}:B${lLast}`, kind: 'list', listRef: `${q(t.sheetPeople)}!$A$${first}:$A$${last}`, title: t.colPerson, prompt: t.personHelp });
  log.validate({ range: `C${lFirst}:D${lLast}`, kind: 'decimal', min: 0, max: 1, title: t.colStart, prompt: t.timeHelp, error: t.timeError });
  log.validate({ range: `E${lFirst}:E${lLast}`, kind: 'decimal', min: 0, max: 600, title: t.colBreak, prompt: t.breakHelp });
  log.def.filter = `A3:I${lLast}`;
  log.rule({ range: `H${lFirst}:H${lLast}`, formula: `AND(ISNUMBER($H${lFirst}),$H${lFirst}>0)`, fill: C.orangeSoft, bold: true });

  const L = (col: string) => `${q(t.sheetLog)}!$${col}$${lFirst}:$${col}$${lLast}`, P = (col: string, r: number) => `${q(t.sheetPeople)}!${col}${r}`;
  const tt = new SheetBuilder(t.sheetTotals, C.greenBar); tt.widths([28, 10, 12, 12, 12, 13, 14, 14, 15]); tt.def.landscape = true; tt.def.freeze = { row: 6, col: 1 };
  tt.put('A1', `=${S0(0)}`, { ...S.title, size: 16 }).height(0, 28).put('A2', `="${t.periodLabel} "&TEXT(${S0(1)},"${o.region.date}")&" - "&TEXT(${S0(2)},"${o.region.date}")`, { bold: true, color: C.muted });
  tt.put('A3', t.totalsSub, S.subtitle).merge('A3:I3').height(2, 30);
  headerRow(tt, 5, 0, [t.colPerson, t.colDays, t.colRegular, t.colOvertime, t.colTotalHours, t.colRate, t.colRegularPay, t.colOvertimePay, t.colTotalPay], 36);
  const within = (extra: string) => `${L('B')},$A{r},${L('A')},">="&${S0(1)},${L('A')},"<="&${S0(2)}${extra}`;
  for (let i = 0; i < cap; i += 1) {
    const r = tFirst + i, pr = first + i, crit = within('').replace('{r}', String(r));
    tt.put(`A${r}`, `=IF(${P('A', pr)}="","",${P('A', pr)})`, S.calc());
    tt.put(`B${r}`, `=IF($A${r}="","",COUNTIFS(${crit},${L('F')},">0"))`, S.calc('0', 'center'));
    tt.put(`C${r}`, `=IF($A${r}="","",SUMIFS(${L('G')},${crit}))`, S.calc(hours));
    tt.put(`D${r}`, `=IF($A${r}="","",SUMIFS(${L('H')},${crit}))`, S.calc(hours));
    tt.put(`E${r}`, `=IF($A${r}="","",C${r}+D${r})`, { ...S.calc(hours), bold: true });
    tt.put(`F${r}`, `=IF($A${r}="","",IF(${P('C', pr)}="",0,${P('C', pr)}))`, S.calc(money));
    tt.put(`G${r}`, `=IF($A${r}="","",ROUND(C${r}*F${r},2))`, S.calc(money));
    tt.put(`H${r}`, `=IF($A${r}="","",ROUND(D${r}*F${r}*${S0(4)},2))`, S.calc(money));
    tt.put(`I${r}`, `=IF($A${r}="","",G${r}+H${r})`, { ...S.calc(money), bold: true });
  }
  const tr = tLast + 1;
  tt.put(`A${tr}`, N.totals, { bold: true, h: 'right' });
  [['B', '0'], ['C', hours], ['D', hours], ['E', hours], ['G', money], ['H', money], ['I', money]].forEach(([col, fmt]) => tt.put(`${col}${tr}`, `=SUM(${col}${tFirst}:${col}${tLast})`, { ...S.calc(fmt, col === 'B' ? 'center' : undefined), bold: true }));
  tt.rule({ range: `D${tFirst}:D${tLast}`, formula: `AND(ISNUMBER($D${tFirst}),$D${tFirst}>0)`, fill: C.orangeSoft, bold: true });
  const n = Math.min(cap, Math.max(4, Math.min(12, o.rows.length)));
  tt.chart({ kind: 'col', title: t.chartHours, cats: `${q(t.sheetTotals)}!$A$${tFirst}:$A$${tFirst + n - 1}`, series: [{ name: t.colRegular, vals: `${q(t.sheetTotals)}!$C$${tFirst}:$C$${tFirst + n - 1}`, color: C.greenBar }, { name: t.colOvertime, vals: `${q(t.sheetTotals)}!$D$${tFirst}:$D$${tFirst + n - 1}`, color: C.orange }], at: { col: 0, row: tr + 1, cols: 9, rows: 16 } });

  book.sheets = [guide.def, settings.def, people.def, log.def, tt.def];
  return book;
}
