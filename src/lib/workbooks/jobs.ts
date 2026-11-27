/** Job and order tracker workbook: every job with the customer, amount, advance, balance, due date and status, flags for overdue and due-soon jobs, and totals. */
import { SheetBuilder, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { listSheet, settingsSheet, statusRules } from './kit';
import { moneyFormat, type Region } from './region';
import T from '../../locales/packs/workbooks.more2.text.en.json';

const t = T.jobs.sheet;
export interface JobsOptions { business: string; rows: Record<string, string>[]; spare: number; logRows: number; soonDays: number; sample: boolean; region: Region; hinglish: boolean }

export function buildJobs(o: JobsOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), N = T.common, cap = Math.min(300, Math.max(1, o.rows.length + o.spare)), first = 4, last = 3 + cap, jFirst = 4, jLast = 3 + o.logRows, today = todaySerial(now);
  const [stNew, stWork, stReady, stDone, stCancel] = t.statuses as [string, string, string, string, string];
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetCustomers, t.sheetJobs, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });
  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.asOf, '=TODAY()', o.region.date], [t.soonDays, o.soonDays]], t.settingsHelp);
  const asOf = S0(1), soon = S0(2);

  const customers = listSheet(t.sheetCustomers, t.customersTitle, t.customersSub, [{ head: t.colCustomer, width: 28 }, { head: t.colPhone, width: 16 }, { head: t.colNote, width: 30 }], o.rows.map((r) => [r.name, r.phone, r.note]), cap);
  const Cu = `${q(t.sheetCustomers)}!$A$${first}:$A$${last}`;

  const sample = o.sample ? T.jobs.sample.jobs.map((j) => [j.no, today - j.ago, o.rows[j.customer % Math.max(1, o.rows.length)]?.name, j.what, j.amount, j.advance, today + j.due, j.status]) : [];
  const jobs = listSheet(t.sheetJobs, t.jobsTitle, t.jobsSub, [{ head: t.colNo, width: 9 }, { head: t.colReceived, width: 12, fmt: o.region.date, align: 'center' }, { head: t.colCustomer, width: 24 }, { head: t.colWhat, width: 30 }, { head: t.colAmount, width: 13, fmt: money }, { head: t.colAdvance, width: 13, fmt: money }, { head: t.colDue, width: 12, fmt: o.region.date, align: 'center' }, { head: t.colStatus, width: 13, align: 'center' }, { head: t.colBalance, width: 13, fmt: money }, { head: t.colLeft, width: 10, fmt: '0', align: 'center' }, { head: t.colFlag, width: 13, align: 'center' }, { head: t.colPayment, width: 12, align: 'center' }], sample, o.logRows);
  for (let r = jFirst; r <= jLast; r += 1) {
    const live = `AND(H${r}<>"${stDone}",H${r}<>"${stCancel}")`;
    jobs.put(`I${r}`, `=IF(E${r}="","",E${r}-IF(F${r}="",0,F${r}))`, { ...S.calc(money), bold: true });
    jobs.put(`J${r}`, `=IF(OR(G${r}="",H${r}="",NOT(${live})),"",G${r}-${asOf})`, S.calc('0', 'center'));
    jobs.put(`K${r}`, `=IF(OR(C${r}="",G${r}="",NOT(${live})),"",IF(G${r}<${asOf},"${t.overdue}",IF(G${r}-${asOf}<=${soon},"${t.dueSoon}","")))`, S.calc(undefined, 'center'));
    jobs.put(`L${r}`, `=IF(OR(E${r}="",H${r}="${stCancel}"),"",IF(I${r}<=0,"${t.paid}",IF(F${r}>0,"${t.part}","${t.unpaid}")))`, S.calc(undefined, 'center'));
  }
  jobs.validate({ range: `C${jFirst}:C${jLast}`, kind: 'list', listRef: Cu, soft: true, title: t.colCustomer, prompt: t.customerHelp });
  jobs.validate({ range: `E${jFirst}:F${jLast}`, kind: 'decimal', min: 0 });
  jobs.validate({ range: `H${jFirst}:H${jLast}`, kind: 'list', list: t.statuses, title: t.colStatus, prompt: t.statusHelp });
  jobs.def.filter = `A3:L${jLast}`;
  statusRules(jobs, `K${jFirst}:K${jLast}`, `$K${jFirst}`, { warn: t.dueSoon, bad: t.overdue });
  statusRules(jobs, `H${jFirst}:H${jLast}`, `$H${jFirst}`, { good: stReady });
  statusRules(jobs, `L${jFirst}:L${jLast}`, `$L${jFirst}`, { good: t.paid, bad: t.unpaid });

  const Jo = (col: string) => `${q(t.sheetJobs)}!$${col}$${jFirst}:$${col}$${jLast}`;
  const u = new SheetBuilder(t.sheetSummary, C.greenBar); u.widths([32, 16, 4, 16, 12]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const live3 = [stNew, stWork, stReady];
  const countOpen = live3.map((s) => `COUNTIF(${Jo('H')},"${s}")`).join('+');
  const owed = [stNew, stWork, stReady, stDone].map((s) => `SUMIFS(${Jo('I')},${Jo('H')},"${s}",${Jo('I')},">0")`).join('+');
  const kpis: [string, string, string][] = [[t.kpiOpen, `=${countOpen}`, '0'], [t.kpiOverdue, `=COUNTIF(${Jo('K')},"${t.overdue}")`, '0'], [t.kpiSoon, `=COUNTIF(${Jo('K')},"${t.dueSoon}")`, '0'], [t.kpiReady, `=COUNTIF(${Jo('H')},"${stReady}")`, '0'], [t.kpiBalance, `=${owed}`, money], [t.kpiAdvance, `=SUM(${Jo('F')})`, money]];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  headerRow(u, 9, 0, [t.colStatus, t.colCount], 30);
  t.statuses.forEach((s, i) => u.put([0, 10 + i], s, S.calc()).put([1, 10 + i], `=COUNTIF(${Jo('H')},A${11 + i})`, S.calc('0', 'center')));
  u.chart({ kind: 'col', title: t.chartStatus, cats: `${q(t.sheetSummary)}!$A$11:$A$15`, series: [{ name: t.colCount, vals: `${q(t.sheetSummary)}!$B$11:$B$15`, color: C.orange }], at: { col: 3, row: 1, cols: 6, rows: 16 } });
  book.sheets = [guide.def, settings.def, customers.def, jobs.def, u.def];
  return book;
}
