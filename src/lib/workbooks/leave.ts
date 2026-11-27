/** Leave tracker workbook: each person's yearly leave, every leave taken or asked for, and what is left by type, with flags for low and over-used balances. */
import { SheetBuilder, serial, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { listSheet, settingsSheet, statusRules } from './kit';
import { type Region } from './region';
import T from '../../locales/packs/workbooks.more3.text.en.json';

const t = T.leave.sheet;
export interface LeaveOptions { business: string; rows: Record<string, string>[]; spare: number; logRows: number; warnDays: number; sample: boolean; region: Region; hinglish: boolean }

export function buildLeave(o: LeaveOptions, now = new Date()): Book {
  const N = T.common, cap = Math.min(300, Math.max(1, o.rows.length + o.spare)), first = 4, last = 3 + cap, lFirst = 4, lLast = 3 + o.logRows, today = todaySerial(now);
  const types = t.types as string[], [stApproved, stPending, stRejected] = t.statuses as [string, string, string];
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetEmployees, t.sheetLog, t.sheetBalances, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });
  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.yearStart, serial(now.getFullYear(), 1, 1), o.region.date], [t.asOf, '=TODAY()', o.region.date], [t.warnDays, o.warnDays]], t.settingsHelp);
  const start = S0(1), asOf = S0(2), warn = S0(3);

  const emp = listSheet(t.sheetEmployees, t.employeesTitle, t.employeesSub, [{ head: t.colEmployee, width: 28 }, { head: t.colDept, width: 20 }, { head: t.colEntitled, width: 16, fmt: '0.0', align: 'center' }], o.rows.map((r) => [r.name, r.dept, r.days === '' || r.days === undefined ? undefined : Number(r.days)]), cap);
  emp.validate({ range: `C${first}:C${last}`, kind: 'decimal', min: 0, max: 366 });
  const Em = (col: string) => `${q(t.sheetEmployees)}!$${col}$${first}:$${col}$${last}`;

  const sample = o.sample ? T.leave.sample.log.map((l) => [today + l.from, today + l.from + l.days - 1, o.rows[l.emp % Math.max(1, o.rows.length)]?.name, types[l.type], (t.statuses as string[])[l.status], l.reason]) : [];
  const log = listSheet(t.sheetLog, t.logTitle, t.logSub, [{ head: t.colFrom, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colTo, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colEmployee, width: 26 }, { head: t.colType, width: 14 }, { head: t.colStatus, width: 13 }, { head: t.colReason, width: 30 }, { head: t.colDays, width: 9, align: 'center' }], sample, o.logRows);
  for (let r = lFirst; r <= lLast; r += 1) log.put(`G${r}`, `=IF(OR(A${r}="",B${r}=""),"",B${r}-A${r}+1)`, S.calc('0.0', 'center'));
  log.validate({ range: `A${lFirst}:B${lLast}`, kind: 'date', min: 36526 });
  log.validate({ range: `C${lFirst}:C${lLast}`, kind: 'list', listRef: Em('A'), soft: true, title: t.colEmployee, prompt: t.employeeHelp });
  log.validate({ range: `D${lFirst}:D${lLast}`, kind: 'list', list: types, title: t.colType, prompt: t.typeHelp });
  log.validate({ range: `E${lFirst}:E${lLast}`, kind: 'list', list: t.statuses, title: t.colStatus, prompt: t.statusHelp });
  log.def.filter = `A3:G${lLast}`;
  statusRules(log, `E${lFirst}:E${lLast}`, `$E${lFirst}`, { good: stApproved, warn: stPending, bad: stRejected });
  const Lg = (col: string) => `${q(t.sheetLog)}!$${col}$${lFirst}:$${col}$${lLast}`;
  const inYear = `${Lg('A')},">="&${start},${Lg('A')},"<="&${start}+365`;

  const bal = new SheetBuilder(t.sheetBalances, C.greenBar); bal.widths([28, 18, 12, 10, 10, 10, 10, 10, 11, 11, 11, 12]); bal.def.freeze = { row: 3, col: 1 };
  bal.put('A1', t.balancesTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.balancesSub, S.subtitle).merge('A2:L2').height(1, 30);
  headerRow(bal, 2, 0, [t.colEmployee, t.colDept, t.colEntitled, ...types, t.colUsed, t.colPending, t.colLeft, t.colFlag], 40);
  const cols = ['D', 'E', 'F', 'G', 'H'];
  for (let r = first; r <= last; r += 1) {
    bal.put(`A${r}`, `=IF(${q(t.sheetEmployees)}!A${r}="","",${q(t.sheetEmployees)}!A${r})`, S.calc());
    bal.put(`B${r}`, `=IF(A${r}="","",IF(${q(t.sheetEmployees)}!B${r}="","",${q(t.sheetEmployees)}!B${r}))`, S.calc());
    bal.put(`C${r}`, `=IF(A${r}="","",IF(${q(t.sheetEmployees)}!C${r}="",0,${q(t.sheetEmployees)}!C${r}))`, S.calc('0.0', 'center'));
    cols.forEach((c) => bal.put(`${c}${r}`, `=IF($A${r}="","",SUMIFS(${Lg('G')},${Lg('C')},$A${r},${Lg('D')},${c}$3,${Lg('E')},"${stApproved}",${inYear}))`, S.calc('0.0', 'center')));
    bal.put(`I${r}`, `=IF(A${r}="","",SUM(D${r}:G${r}))`, { ...S.calc('0.0', 'center'), bold: true });
    bal.put(`J${r}`, `=IF(A${r}="","",SUMIFS(${Lg('G')},${Lg('C')},$A${r},${Lg('E')},"${stPending}"))`, S.calc('0.0', 'center'));
    bal.put(`K${r}`, `=IF(A${r}="","",C${r}-I${r})`, { ...S.calc('0.0', 'center'), bold: true });
    bal.put(`L${r}`, `=IF(A${r}="","",IF(K${r}<0,"${t.over}",IF(K${r}<=${warn},"${t.low}","")))`, S.calc(undefined, 'center'));
  }
  bal.def.filter = `A3:L${last}`;
  statusRules(bal, `L${first}:L${last}`, `$L${first}`, { warn: t.low, bad: t.over });
  const Ba = (col: string) => `${q(t.sheetBalances)}!$${col}$${first}:$${col}$${last}`;

  const u = new SheetBuilder(t.sheetSummary, C.greenBar); u.widths([34, 16, 4, 16, 12]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const kpis: [string, string, string][] = [[t.kpiPeople, `=COUNTA(${Em('A')})`, '0'], [t.kpiUsed, `=SUMIFS(${Lg('G')},${Lg('E')},"${stApproved}",${inYear})`, '0.0'], [t.kpiPending, `=COUNTIF(${Lg('E')},"${stPending}")`, '0'], [t.kpiToday, `=COUNTIFS(${Lg('A')},"<="&${asOf},${Lg('B')},">="&${asOf},${Lg('E')},"${stApproved}")`, '0'], [t.kpiOver, `=COUNTIF(${Ba('L')},"${t.over}")`, '0'], [t.kpiLow, `=COUNTIF(${Ba('L')},"${t.low}")`, '0']];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  headerRow(u, 9, 0, [t.colType, t.colDays], 30);
  types.forEach((ty, i) => u.put([0, 10 + i], ty, S.calc()).put([1, 10 + i], `=SUMIFS(${Lg('G')},${Lg('D')},A${11 + i},${Lg('E')},"${stApproved}",${inYear})`, S.calc('0.0', 'center')));
  u.chart({ kind: 'col', title: t.chartType, cats: `${q(t.sheetSummary)}!$A$11:$A$${10 + types.length}`, series: [{ name: t.colDays, vals: `${q(t.sheetSummary)}!$B$11:$B$${10 + types.length}`, color: C.orange }], at: { col: 3, row: 1, cols: 6, rows: 16 } });
  book.sheets = [guide.def, settings.def, emp.def, log.def, bal.def, u.def];
  return book;
}
