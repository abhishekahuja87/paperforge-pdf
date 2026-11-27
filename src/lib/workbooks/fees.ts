/** Monthly fees and rent tracker workbook: a grid of what each person paid each month, what is still due, a list of who owes with a WhatsApp reminder, a printable receipt and a summary. */
import { SheetBuilder, colName, serial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { fillTemplate, linkText, listSheet, settingsSheet, statusRules, whatsappNumber } from './kit';
import { parseAmount } from './dates';
import { moneyFormat, type Region } from './region';
import T from '../../locales/packs/workbooks.more.text.en.json';

const t = T.fees.sheet;
export interface FeesOptions { business: string; item: string; rows: Record<string, string>[]; spare: number; message: string; sample: boolean; region: Region; hinglish: boolean }
const M0 = 3, MONTHS = 12;                                   // month columns D to O

export function buildFees(o: FeesOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), N = T.common, cap = Math.min(300, Math.max(1, o.rows.length + o.spare)), first = 4, last = 3 + cap, tFirst = 6, tLast = 5 + cap;
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const start = serial(now.getFullYear(), now.getMonth() + 1 - 5, 1);
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetPeople, t.sheetTracker, t.sheetPending, t.sheetReceipt, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });

  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.startMonth, start, 'mmmm yyyy'], [t.asOf, '=TODAY()', o.region.date], [t.item, o.item], [t.word, o.region.word], [t.code, o.region.code], [t.message, o.message]], t.settingsHelp);
  settings.height(8, 64);
  const business = S0(0), startMonth = S0(1), asOf = S0(2), item = S0(3), word = S0(4), code = S0(5), msg = S0(6);

  const people = listSheet(t.sheetPeople, t.peopleTitle, t.peopleSub, [{ head: t.colName, width: 28 }, { head: t.colPhone, width: 16 }, { head: t.colGroup, width: 18 }, { head: t.colMonthly, width: 15, fmt: money }, { head: t.colOpening, width: 16, fmt: money }],
    o.rows.map((r) => [r.name, r.phone, r.group, parseAmount(r.monthly ?? '') ?? undefined, parseAmount(r.opening ?? '') ?? undefined]), cap);
  people.validate({ range: `D${first}:E${last}`, kind: 'decimal', min: 0 });

  const P = (col: string, r: number) => `${q(t.sheetPeople)}!${col}${r}`;
  const mFirst = colName(M0), mLast = colName(M0 + MONTHS - 1), cDue = colName(M0 + MONTHS), cPaid = colName(M0 + MONTHS + 1), cBal = colName(M0 + MONTHS + 2), cStat = colName(M0 + MONTHS + 3), cRank = colName(M0 + MONTHS + 4);
  const tr = new SheetBuilder(t.sheetTracker, C.greenBar); tr.def.landscape = true; tr.def.freeze = { row: 5, col: 1 }; tr.def.printTitles = '$5:$5'; tr.def.zoom = 90; tr.def.filter = `A5:${cStat}${tLast}`;
  tr.widths([26, 14, 11]); for (let m = 0; m < MONTHS; m += 1) tr.def.widths[M0 + m] = 9; tr.widths([12, 12, 12, 11, 4], M0 + MONTHS); tr.def.hiddenCols = [M0 + MONTHS + 4];
  tr.put('A1', `=${business}&" - "&${item}`, { ...S.title, size: 16 }).height(0, 28).put('A2', t.trackerSub, S.subtitle).merge(`A2:${mLast}2`).height(1, 30);
  tr.put('A3', t.asOfLabel, S.label).put('B3', `=${asOf}`, S.calc(o.region.date, 'center')).put('C3', t.monthsDue, { ...S.label, h: 'right' });
  tr.put('D3', `=MAX(0,MIN(${MONTHS},(YEAR($B$3)-YEAR(${mFirst}5))*12+MONTH($B$3)-MONTH(${mFirst}5)+1))`, S.calc('0', 'center'));
  headerRow(tr, 4, 0, [t.colName, t.colGroup, t.colMonthly], 36);
  for (let m = 0; m < MONTHS; m += 1) tr.put([M0 + m, 4], m === 0 ? `=${startMonth}` : `=DATE(YEAR(${colName(M0 + m - 1)}5),MONTH(${colName(M0 + m - 1)}5)+1,1)`, { ...S.head, numFmt: 'mmm yy' });
  headerRow(tr, 4, M0 + MONTHS, [t.colDue, t.colPaid, t.colBalance, t.colStatus], 36);
  const sampleOf = (i: number): (number | null)[] => (o.sample ? T.fees.sample.paid[i] ?? [] : []);
  for (let i = 0; i < cap; i += 1) {
    const r = tFirst + i, pr = first + i, paid = sampleOf(i);
    tr.put(`A${r}`, `=IF(${P('A', pr)}="","",${P('A', pr)})`, S.calc());
    tr.put(`B${r}`, `=IF($A${r}="","",${P('C', pr)}&"")`, S.calc());
    tr.put(`C${r}`, `=IF($A${r}="","",IF(${P('D', pr)}="",0,${P('D', pr)}))`, S.calc(money));
    for (let m = 0; m < MONTHS; m += 1) tr.put([M0 + m, r - 1], paid[m] ?? undefined, { ...S.cell(money), input: true, size: 9 });
    tr.put(`${cDue}${r}`, `=IF($A${r}="","",ROUND(IF(${P('E', pr)}="",0,${P('E', pr)})+C${r}*$D$3,2))`, S.calc(money));
    tr.put(`${cPaid}${r}`, `=IF($A${r}="","",SUM(${mFirst}${r}:${mLast}${r}))`, S.calc(money));
    tr.put(`${cBal}${r}`, `=IF($A${r}="","",${cDue}${r}-${cPaid}${r})`, { ...S.calc(money), bold: true });
    tr.put(`${cStat}${r}`, `=IF($A${r}="","",IF(${cBal}${r}<=0,"${t.statusClear}",IF(${cPaid}${r}=0,"${t.statusUnpaid}","${t.statusPart}")))`, S.calc(undefined, 'center'));
    tr.put(`${cRank}${r}`, `=IF($A${r}="","",IF(${cBal}${r}>0,COUNTIF(${cBal}$${tFirst}:${cBal}${r},">0"),""))`, { size: 8, color: C.muted });
  }
  const sum = tLast + 1, expectedRow = tLast + 2;
  tr.put(`A${sum}`, t.collected, { bold: true, h: 'right' }).merge(`A${sum}:C${sum}`);
  tr.put(`A${expectedRow}`, t.expected, { bold: true, h: 'right' }).merge(`A${expectedRow}:C${expectedRow}`);
  for (let m = 0; m < MONTHS; m += 1) {
    const col = colName(M0 + m);
    tr.put(`${col}${sum}`, `=SUM(${col}${tFirst}:${col}${tLast})`, { ...S.calc(money), size: 9, bold: true });
    tr.put(`${col}${expectedRow}`, `=IF(${col}$5<=$B$3,SUM($C${tFirst}:$C${tLast}),0)`, { ...S.calc(money), size: 9 });
  }
  [cDue, cPaid, cBal].forEach((col) => tr.put(`${col}${sum}`, `=SUM(${col}${tFirst}:${col}${tLast})`, { ...S.calc(money), bold: true }));
  const grid = `${mFirst}${tFirst}:${mLast}${tLast}`;
  tr.rule({ range: grid, formula: `AND($A${tFirst}<>"",${mFirst}$5>$B$3)`, fill: C.weekend, stop: true });
  tr.rule({ range: grid, formula: `AND($A${tFirst}<>"",ISNUMBER(${mFirst}${tFirst}),$C${tFirst}>0,${mFirst}${tFirst}>=$C${tFirst})`, fill: C.green, color: C.greenText, stop: true });
  tr.rule({ range: grid, formula: `AND($A${tFirst}<>"",ISNUMBER(${mFirst}${tFirst}),${mFirst}${tFirst}>0,${mFirst}${tFirst}<$C${tFirst})`, fill: C.amber, color: C.amberText, stop: true });
  tr.rule({ range: grid, formula: `AND($A${tFirst}<>"",$C${tFirst}>0,${mFirst}$5<=$B$3,OR(${mFirst}${tFirst}="",${mFirst}${tFirst}=0))`, fill: C.red, color: C.redText });
  statusRules(tr, `${cStat}${tFirst}:${cStat}${tLast}`, `$${cStat}${tFirst}`, { good: t.statusClear, warn: t.statusPart, bad: t.statusUnpaid });
  tr.validate({ range: grid, kind: 'decimal', min: 0, title: t.cellTitle, prompt: t.cellHelp, error: t.cellError });

  const TR = (col: string) => `${q(t.sheetTracker)}!$${col}$${tFirst}:$${col}$${tLast}`;
  const pend = new SheetBuilder(t.sheetPending, C.orange); pend.widths([6, 28, 16, 14, 18, 4, 4]); pend.def.hiddenCols = [5, 6]; pend.def.freeze = { row: 3, col: 0 };
  pend.put('A1', t.pendingTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.pendingSub, S.subtitle).merge('A2:E2').height(1, 30);
  headerRow(pend, 2, 0, [N.number, t.colName, t.colGroup, t.colBalance, t.colReminder], 30);
  for (let i = 0; i < cap; i += 1) {
    const r = 4 + i, at = `MATCH($A${r},${TR(cRank)},0)`, phone = `IFERROR(INDEX(${q(t.sheetPeople)}!$B$${first}:$B$${last},${at}),"")`;
    pend.put(`A${r}`, i + 1, S.calc(undefined, 'center'));
    pend.put(`B${r}`, `=IFERROR(INDEX(${TR('A')},${at}),"")`, S.calc());
    pend.put(`C${r}`, `=IF($B${r}="","",INDEX(${TR('B')},${at}))`, S.calc());
    pend.put(`D${r}`, `=IF($B${r}="","",INDEX(${TR(cBal)},${at}))`, { ...S.calc(money), bold: true });
    pend.put(`F${r}`, `=IF($B${r}="","",${whatsappNumber(`${phone}&""`, code)})`, { size: 8, color: C.muted });
    const text = fillTemplate(msg, [['{name}', `$B${r}`], ['{amount}', `IF(${word}="","",${word}&" ")&TEXT($D${r},"0.00")`], ['{business}', business], ['{item}', item]]);
    pend.put(`G${r}`, `=IF($B${r}="","",${linkText(text)})`, { size: 8, color: C.muted });
    pend.put(`E${r}`, `=IF(OR($B${r}="",$F${r}=""),"",HYPERLINK("https://wa.me/"&$F${r}&"?text="&$G${r},"${t.sendReminder}"))`, { ...S.calc(undefined, 'center'), color: C.ink, underline: true, bold: true });
  }

  const rc = new SheetBuilder(t.sheetReceipt, C.orange); rc.widths([22, 30, 4, 4]);
  rc.put('A1', `=${business}`, { ...S.title, size: 16 }).merge('A1:B1').height(0, 28).put('A2', t.receiptTitle, { bold: true, color: C.muted }).merge('A2:B2');
  rc.put('A3', t.receiptNo, S.label).put('B3', 1, { ...S.input('0', 'left') });
  rc.put('A4', t.receiptDate, S.label).put('B4', `=${asOf}`, S.input(o.region.date, 'left'));
  rc.put('A5', t.receiptFrom, S.label).put('B5', o.rows[0]?.name, { ...S.input(), bold: true });
  rc.put('A6', t.receiptFor, S.label).put('B6', o.sample ? serial(now.getFullYear(), now.getMonth() + 1 - 1, 1) : start, S.input('mmmm yyyy', 'left'));
  const who = `MATCH($B$5,${TR('A')},0)`, which = `MATCH($B$6,${q(t.sheetTracker)}!$${mFirst}$5:$${mLast}$5,0)`;
  rc.put('A7', t.receiptAmount, { ...S.label, size: 12 }).put('B7', `=IFERROR(INDEX(${q(t.sheetTracker)}!$${mFirst}$${tFirst}:$${mLast}$${tLast},${who},${which}),"")`, { ...S.calc(money, 'left'), bold: true, size: 12 });
  rc.put('A8', t.receiptBalance, S.label).put('B8', `=IFERROR(INDEX(${TR(cBal)},${who}),"")`, S.calc(money, 'left'));
  rc.put('A10', t.receiptNote, { ...S.input(), wrap: true, v: 'top' }).merge('A10:B11').height(9, 20).height(10, 20);
  rc.validate({ range: 'B5', kind: 'list', listRef: `${q(t.sheetPeople)}!$A$${first}:$A$${last}`, title: t.colName, prompt: t.receiptPick });
  rc.validate({ range: 'B6', kind: 'list', listRef: `${q(t.sheetTracker)}!$${mFirst}$5:$${mLast}$5`, title: t.receiptFor, prompt: t.receiptMonth });

  const u = new SheetBuilder(t.sheetSummary, C.orange); u.widths([30, 18, 16, 12, 12, 12, 12, 12]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const kpis: [string, string, string?][] = [[t.kpiPeople, `=COUNTIF(${TR('A')},"?*")`, '0'], [t.kpiExpected, `=SUM(${TR(cDue)})`, money], [t.kpiCollected, `=SUM(${TR(cPaid)})`, money], [t.kpiOutstanding, `=SUMIF(${TR(cBal)},">0")`, money], [t.kpiOwing, `=COUNTIF(${TR(cBal)},">0")`, '0']];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  headerRow(u, 9, 0, [t.colMonth, t.collected, t.expected], 22);
  for (let m = 0; m < MONTHS; m += 1) {
    const col = colName(M0 + m);
    u.put(`A${11 + m}`, `=TEXT(${q(t.sheetTracker)}!${col}5,"mmm yy")`, S.calc()).put(`B${11 + m}`, `=${q(t.sheetTracker)}!${col}${sum}`, S.calc(money)).put(`C${11 + m}`, `=${q(t.sheetTracker)}!${col}${expectedRow}`, S.calc(money));
  }
  u.chart({ kind: 'col', title: t.chartMonths, cats: `${q(t.sheetSummary)}!$A$11:$A$22`, series: [{ name: t.collected, vals: `${q(t.sheetSummary)}!$B$11:$B$22`, color: C.greenBar }, { name: t.expected, vals: `${q(t.sheetSummary)}!$C$11:$C$22`, color: C.orangeSoft }], at: { col: 3, row: 1, cols: 7, rows: 20 } });

  book.sheets = [guide.def, settings.def, people.def, tr.def, pend.def, rc.def, u.def];
  return book;
}
