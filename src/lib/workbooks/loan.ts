/** Loan and EMI tracker workbook: every loan with its EMI, interest, payments made, balance and next due date, a full repayment schedule for any loan, and a summary. */
import { SheetBuilder, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { listSheet, settingsSheet, statusRules } from './kit';
import { moneyFormat, type Region } from './region';
import { parseAmount, parseDate } from './dates';
import T from '../../locales/packs/workbooks.more3.text.en.json';

const t = T.loan.sheet;
export interface LoanOptions { business: string; rows: Record<string, string>[]; spare: number; soonDays: number; sample: boolean; region: Region; hinglish: boolean }

export function buildLoan(o: LoanOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), N = T.common, cap = Math.min(60, Math.max(1, o.rows.length + o.spare)), first = 4, last = 3 + cap, today = todaySerial(now), order = o.region.date.startsWith('mm') ? 'mdy' : 'dmy';
  const [stRun, stSoon, stDone] = t.statuses as [string, string, string];
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetLoans, t.sheetSchedule, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });
  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.asOf, '=TODAY()', o.region.date], [t.soonDays, o.soonDays]], t.settingsHelp);
  const asOf = S0(1), soon = S0(2);

  const num = (s: string | undefined) => (s === undefined || s.trim() === '' ? undefined : (parseAmount(s) ?? undefined));
  const data = o.rows.map((r, i) => {
    const sampleFirst = o.sample ? today - (T.loan.sample.paidMonths[i % T.loan.sample.paidMonths.length]! * 30) : undefined;
    return [r.name, num(r.amount), num(r.rate), num(r.months), parseDate(r.first ?? '', order) ?? sampleFirst, r.note];
  });
  const loans = listSheet(t.sheetLoans, t.loansTitle, t.loansSub, [{ head: t.colLoan, width: 26 }, { head: t.colAmount, width: 15, fmt: money, align: 'right' }, { head: t.colRate, width: 11, fmt: '0.00', align: 'center' }, { head: t.colMonths, width: 9, fmt: '0', align: 'center' }, { head: t.colFirst, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colNote, width: 20 }], data, cap);
  const heads = [t.colEmi, t.colInterest, t.colPayable, t.colPaid, t.colBalance, t.colNext, t.colLast, t.colStatus];
  headerRow(loans, 2, 6, heads, 36);
  loans.widths([26, 15, 11, 9, 13, 20, 14, 15, 15, 9, 16, 13, 13, 12]);
  for (let r = first; r <= last; r += 1) {
    const i = `(C${r}/1200)`, ok = `OR(B${r}="",C${r}="",D${r}="")`;
    loans.put(`G${r}`, `=IF(${ok},"",ROUND(IF(C${r}=0,B${r}/D${r},B${r}*${i}*(1+${i})^D${r}/((1+${i})^D${r}-1)),2))`, { ...S.calc(money), bold: true });
    loans.put(`H${r}`, `=IF(G${r}="","",ROUND(G${r}*D${r}-B${r},2))`, S.calc(money));
    loans.put(`I${r}`, `=IF(G${r}="","",ROUND(G${r}*D${r},2))`, S.calc(money));
    loans.put(`J${r}`, `=IF(OR(G${r}="",E${r}=""),"",MAX(0,MIN(D${r},(YEAR(${asOf})-YEAR(E${r}))*12+MONTH(${asOf})-MONTH(E${r})+IF(DAY(${asOf})>=DAY(E${r}),1,0))))`, S.calc('0', 'center'));
    loans.put(`K${r}`, `=IF(J${r}="","",IF(J${r}>=D${r},0,IF(C${r}=0,B${r}-G${r}*J${r},ROUND(B${r}*(1+${i})^J${r}-G${r}*((1+${i})^J${r}-1)/${i},2))))`, { ...S.calc(money), bold: true });
    loans.put(`L${r}`, `=IF(J${r}="","",IF(J${r}>=D${r},"",DATE(YEAR(E${r}),MONTH(E${r})+J${r},DAY(E${r}))))`, S.calc(o.region.date, 'center'));
    loans.put(`M${r}`, `=IF(OR(G${r}="",E${r}=""),"",DATE(YEAR(E${r}),MONTH(E${r})+D${r}-1,DAY(E${r})))`, S.calc(o.region.date, 'center'));
    loans.put(`N${r}`, `=IF(J${r}="","",IF(J${r}>=D${r},"${stDone}",IF(L${r}-${asOf}<=${soon},"${stSoon}","${stRun}")))`, S.calc(undefined, 'center'));
  }
  loans.validate({ range: `B${first}:B${last}`, kind: 'decimal', min: 0 });
  loans.validate({ range: `C${first}:C${last}`, kind: 'decimal', min: 0, max: 100, title: t.colRate, prompt: t.rateHelp });
  loans.validate({ range: `D${first}:D${last}`, kind: 'whole', min: 1, max: 360, title: t.colMonths, prompt: t.monthsHelp });
  loans.validate({ range: `E${first}:E${last}`, kind: 'date', min: 36526, title: t.colFirst, prompt: t.firstHelp });
  loans.def.filter = `A3:N${last}`;
  statusRules(loans, `N${first}:N${last}`, `$N${first}`, { good: stDone, warn: stSoon });
  const Lo = (col: string) => `${q(t.sheetLoans)}!$${col}$${first}:$${col}$${last}`;

  const sc = new SheetBuilder(t.sheetSchedule, C.greenBar); sc.widths([30, 16, 16, 14, 14, 14, 16, 10]); sc.def.freeze = { row: 9, col: 1 };
  sc.put('A1', t.scheduleTitle, { ...S.title, size: 16 }).height(0, 28);
  sc.put('A2', t.pick, S.label).put('B2', data[0]?.[0] ?? '', { ...S.input(), bold: true }).merge('B2:C2');
  sc.validate({ range: 'B2', kind: 'list', listRef: Lo('A'), title: t.pick, prompt: t.pickHelp });
  const at = (col: string) => `INDEX(${Lo(col)},MATCH($B$2,${Lo('A')},0))`;
  const facts: [string, string, string | undefined][] = [[t.colAmount, `=IFERROR(${at('B')},"")`, money], [t.colRate, `=IFERROR(${at('C')},"")`, '0.00'], [t.colMonths, `=IFERROR(${at('D')},"")`, '0'], [t.colEmi, `=IFERROR(${at('G')},"")`, money], [t.colFirst, `=IFERROR(${at('E')},"")`, o.region.date]];
  facts.forEach(([name, f, fmt], i) => sc.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  headerRow(sc, 8, 0, [t.colNo, t.colDate, t.colOpening, t.colEmi, t.colInterest, t.colPrincipal, t.colClosing, t.colMark], 32);
  for (let k = 1; k <= 360; k += 1) {
    const r = 9 + k;
    sc.put(`A${r}`, `=IF(AND(ISNUMBER($B$5),${k}<=$B$5),${k},"")`, S.calc('0', 'center'));
    sc.put(`B${r}`, `=IF(A${r}="","",DATE(YEAR($B$7),MONTH($B$7)+A${r}-1,DAY($B$7)))`, S.calc(o.region.date, 'center'));
    sc.put(`C${r}`, k === 1 ? `=IF(A${r}="","",$B$3)` : `=IF(A${r}="","",G${r - 1})`, S.calc(money));
    sc.put(`D${r}`, `=IF(A${r}="","",IF(A${r}=$B$5,C${r}+E${r},$B$6))`, S.calc(money));
    sc.put(`E${r}`, `=IF(A${r}="","",ROUND(C${r}*$B$4/1200,2))`, S.calc(money));
    sc.put(`F${r}`, `=IF(A${r}="","",ROUND(D${r}-E${r},2))`, S.calc(money));
    sc.put(`G${r}`, `=IF(A${r}="","",ROUND(C${r}-F${r},2))`, { ...S.calc(money), bold: true });
    sc.put(`H${r}`, `=IF(A${r}="","",IF(B${r}<=${asOf},"${t.markPaid}",""))`, S.calc(undefined, 'center'));
  }
  statusRules(sc, 'H10:H369', '$H10', { good: t.markPaid });

  const u = new SheetBuilder(t.sheetSummary, C.greenBar); u.widths([34, 18, 4, 16, 12]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const kpis: [string, string, string][] = [[t.kpiRunning, `=COUNTIF(${Lo('N')},"${stRun}")+COUNTIF(${Lo('N')},"${stSoon}")`, '0'], [t.kpiEmi, `=SUMIF(${Lo('N')},"${stRun}",${Lo('G')})+SUMIF(${Lo('N')},"${stSoon}",${Lo('G')})`, money], [t.kpiBalance, `=SUM(${Lo('K')})`, money], [t.kpiInterest, `=SUM(${Lo('H')})`, money], [t.kpiSoon, `=COUNTIF(${Lo('N')},"${stSoon}")`, '0'], [t.kpiClosed, `=COUNTIF(${Lo('N')},"${stDone}")`, '0']];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  headerRow(u, 9, 0, [t.colLoan, t.colBalance], 30);
  for (let i = 0; i < 8; i += 1) u.put([0, 10 + i], `=IF(${q(t.sheetLoans)}!A${first + i}="","",${q(t.sheetLoans)}!A${first + i})`, S.calc()).put([1, 10 + i], `=IF(A${11 + i}="","",${q(t.sheetLoans)}!K${first + i})`, S.calc(money));
  u.chart({ kind: 'bar', title: t.chartBalance, cats: `${q(t.sheetSummary)}!$A$11:$A$18`, series: [{ name: t.colBalance, vals: `${q(t.sheetSummary)}!$B$11:$B$18`, color: C.orange }], at: { col: 3, row: 1, cols: 6, rows: 16 } });
  book.sheets = [guide.def, settings.def, loans.def, sc.def, u.def];
  return book;
}
