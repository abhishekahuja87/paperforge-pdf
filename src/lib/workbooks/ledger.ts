/** Credit ledger (udhaar khata) workbook: who owes what, a log of credit given and payments received, ageing, a printable statement and WhatsApp reminders. */
import { SheetBuilder, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { fillTemplate, linkText, listSheet, settingsSheet, statusRules, whatsappNumber } from './kit';
import { parseAmount } from './dates';
import { moneyFormat, type Region } from './region';
import T from '../../locales/packs/workbooks.more.text.en.json';

const t = T.ledger.sheet;
export interface LedgerOptions { business: string; rows: Record<string, string>[]; spare: number; logRows: number; period: number; message: string; sample: boolean; region: Region; hinglish: boolean }

export function buildLedger(o: LedgerOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), N = T.common, cap = Math.min(300, Math.max(1, o.rows.length + o.spare));
  const first = 4, last = 3 + cap, eFirst = 4, eLast = 3 + o.logRows, bFirst = 5, bLast = 4 + cap, SK = 40;
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetCustomers, t.sheetEntries, t.sheetBalances, t.sheetStatement, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });

  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.asOf, '=TODAY()', o.region.date], [t.period, o.period], [t.word, o.region.word], [t.code, o.region.code], [t.message, o.message]], t.settingsHelp);
  settings.height(7, 64);
  const business = S0(0), asOf = S0(1), period = S0(2), word = S0(3), code = S0(4), msg = S0(5);

  const customers = listSheet(t.sheetCustomers, t.customersTitle, t.customersSub, [{ head: t.colName, width: 28 }, { head: t.colPhone, width: 16 }, { head: t.colOpening, width: 15, fmt: money }, { head: t.colLimit, width: 15, fmt: money }, { head: t.colNote, width: 32 }],
    o.rows.map((r) => [r.name, r.phone, parseAmount(r.opening ?? '') ?? undefined, parseAmount(r.limit ?? '') ?? undefined, r.note]), cap);
  customers.validate({ range: `C${first}:D${last}`, kind: 'decimal', min: 0 });

  const today = todaySerial(now);
  const sample = o.sample ? T.ledger.sample.entries.map((e) => [today - e.ago, o.rows[e.customer]?.name, e.kind === 'credit' ? t.typeCredit : t.typePayment, e.amount, e.note]).filter((r) => r[1]) : [];
  const entries = listSheet(t.sheetEntries, t.entriesTitle, t.entriesSub, [{ head: t.colDate, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colCustomer, width: 28 }, { head: t.colType, width: 18 }, { head: t.colAmount, width: 14, fmt: money }, { head: t.colNote, width: 30 }, { head: t.colCheck, width: 26 }, { head: '', width: 4 }], sample, o.logRows);
  entries.def.hiddenCols = [6];
  const ST = q(t.sheetStatement);
  for (let r = eFirst; r <= eLast; r += 1) {
    entries.put(`F${r}`, `=IF(AND(D${r}<>"",OR(A${r}="",B${r}="",C${r}="")),"${t.fixRow}","")`, { ...S.calc(), color: C.redText, bold: true });
    entries.put(`G${r}`, `=IF(AND(B${r}<>"",B${r}=${ST}!$B$3),COUNTIF(B$${eFirst}:B${r},${ST}!$B$3),"")`, { size: 8, color: C.muted });
  }
  entries.validate({ range: `B${eFirst}:B${eLast}`, kind: 'list', listRef: `${q(t.sheetCustomers)}!$A$${first}:$A$${last}`, title: t.colCustomer, prompt: t.customerHelp });
  entries.validate({ range: `C${eFirst}:C${eLast}`, kind: 'list', list: [t.typeCredit, t.typePayment], title: t.colType, prompt: t.typeHelp });
  entries.validate({ range: `D${eFirst}:D${eLast}`, kind: 'decimal', min: 0, title: t.colAmount, prompt: t.amountHelp });
  entries.def.filter = `A3:F${eLast}`;
  entries.rule({ range: `C${eFirst}:C${eLast}`, formula: `$C${eFirst}="${t.typePayment}"`, fill: C.green, color: C.greenText });
  entries.rule({ range: `C${eFirst}:C${eLast}`, formula: `$C${eFirst}="${t.typeCredit}"`, fill: C.amber, color: C.amberText });

  const E = (col: string) => `${q(t.sheetEntries)}!$${col}$${eFirst}:$${col}$${eLast}`, Cu = (col: string, r: number) => `${q(t.sheetCustomers)}!${col}${r}`;
  const bal = new SheetBuilder(t.sheetBalances, C.greenBar); bal.widths([28, 15, 13, 13, 13, 14, 13, 12, 13, 13, 13, 12, 16, 4, 4, 4]); bal.def.hiddenCols = [13, 14, 15]; bal.def.freeze = { row: 4, col: 1 }; bal.def.landscape = true; bal.def.filter = `A4:M${bLast}`;
  bal.put('A1', t.balancesTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', `="${t.asOfLabel} "&TEXT(${asOf},"${o.region.date}")`, { bold: true, color: C.muted }).height(1, 20);
  headerRow(bal, 3, 0, [t.colCustomer, t.colPhone, t.colOpening, t.colGiven, t.colPaid, t.colBalance, t.colLimit, t.colLimitCheck], 36);
  [['I', 0], ['J', 1], ['K', 2]].forEach(([col, k]) => bal.put(`${col}4`, k === 0 ? `="0-"&${period}&" ${t.days}"` : k === 1 ? `=${period}+1&"-"&${period}*2&" ${t.days}"` : `="${t.older}"`, S.head));
  headerRow(bal, 3, 11, [t.colStatus, t.colReminder], 36);
  const credits = (from: string, to: string, r: number) => `SUMIFS(${E('D')},${E('B')},$A${r},${E('C')},"${t.typeCredit}",${E('A')},">"&(${asOf}-${from}),${E('A')},"<="&(${asOf}-${to}))`;
  for (let i = 0; i < cap; i += 1) {
    const r = bFirst + i, cr = first + i;
    bal.put(`A${r}`, `=IF(${Cu('A', cr)}="","",${Cu('A', cr)})`, S.calc());
    bal.put(`B${r}`, `=IF($A${r}="","",${Cu('B', cr)}&"")`, S.calc());
    bal.put(`C${r}`, `=IF($A${r}="","",IF(${Cu('C', cr)}="",0,${Cu('C', cr)}))`, S.calc(money));
    bal.put(`D${r}`, `=IF($A${r}="","",SUMIFS(${E('D')},${E('B')},$A${r},${E('C')},"${t.typeCredit}",${E('A')},"<="&${asOf}))`, S.calc(money));
    bal.put(`E${r}`, `=IF($A${r}="","",SUMIFS(${E('D')},${E('B')},$A${r},${E('C')},"${t.typePayment}",${E('A')},"<="&${asOf}))`, S.calc(money));
    bal.put(`F${r}`, `=IF($A${r}="","",C${r}+D${r}-E${r})`, { ...S.calc(money), bold: true });
    bal.put(`G${r}`, `=IF($A${r}="","",IF(${Cu('D', cr)}="","",${Cu('D', cr)}))`, S.calc(money));
    bal.put(`H${r}`, `=IF(OR($A${r}="",G${r}=""),"",IF(F${r}>G${r},"${t.overLimit}","${t.withinLimit}"))`, S.calc(undefined, 'center'));
    bal.put(`I${r}`, `=IF($A${r}="","",MIN(MAX(F${r},0),${credits(period, '0', r)}))`, S.calc(money));
    bal.put(`J${r}`, `=IF($A${r}="","",MIN(MAX(F${r},0)-I${r},${credits(`${period}*2`, period, r)}))`, S.calc(money));
    bal.put(`K${r}`, `=IF($A${r}="","",MAX(F${r},0)-I${r}-J${r})`, S.calc(money));
    bal.put(`L${r}`, `=IF($A${r}="","",IF(F${r}<=0,"${t.statusClear}",IF(J${r}+K${r}>0,"${t.statusOverdue}","${t.statusCurrent}")))`, S.calc(undefined, 'center'));
    bal.put(`N${r}`, `=${whatsappNumber(`$B${r}`, code)}`, { size: 8, color: C.muted });
    const text = fillTemplate(msg, [['{name}', `$A${r}`], ['{amount}', `IF(${word}="","",${word}&" ")&TEXT($F${r},"0.00")`], ['{business}', business]]);
    bal.put(`O${r}`, `=${linkText(text)}`, { size: 8, color: C.muted });
    bal.put(`M${r}`, `=IF(OR($N${r}="",$F${r}<=0),"",HYPERLINK("https://wa.me/"&$N${r}&"?text="&$O${r},"${t.sendReminder}"))`, { ...S.calc(undefined, 'center'), color: C.ink, underline: true, bold: true });
  }
  const tr = bLast + 1;
  bal.put(`A${tr}`, N.totals, { bold: true, h: 'right' });
  ['C', 'D', 'E', 'F', 'I', 'J', 'K'].forEach((col) => bal.put(`${col}${tr}`, `=SUM(${col}${bFirst}:${col}${bLast})`, { ...S.calc(money), bold: true }));
  statusRules(bal, `L${bFirst}:L${bLast}`, `$L${bFirst}`, { good: t.statusClear, warn: t.statusCurrent, bad: t.statusOverdue });
  bal.rule({ range: `H${bFirst}:H${bLast}`, formula: `$H${bFirst}="${t.overLimit}"`, fill: C.red, color: C.redText, bold: true });

  const B = (col: string) => `${q(t.sheetBalances)}!$${col}$${bFirst}:$${col}$${bLast}`;
  const st = new SheetBuilder(t.sheetStatement, C.orange); st.widths([14, 18, 14, 16, 34]); st.def.printTitles = '$7:$7';
  st.put('A1', `=${business}`, { ...S.title, size: 16 }).merge('A1:E1').height(0, 28).put('A2', t.statementTitle, { bold: true, color: C.muted }).merge('A2:E2');
  st.put('A3', t.colCustomer, S.label).put('B3', o.rows[0]?.name, { ...S.input(), bold: true }).merge('B3:E3').height(2, 22);
  st.validate({ range: 'B3', kind: 'list', listRef: `${q(t.sheetCustomers)}!$A$${first}:$A$${last}`, title: t.colCustomer, prompt: t.statementHelp });
  const pos = `MATCH($B$3,${B('A')},0)`;
  st.put('A4', t.colPhone, S.label).put('B4', `=IFERROR(INDEX(${B('B')},${pos}),"")`, S.calc()).merge('B4:C4');
  st.put('A5', t.asOfLabel, S.label).put('B5', `=${asOf}`, S.calc(o.region.date, 'left')).merge('B5:C5');
  st.put('D4', t.colOpening, { ...S.label, h: 'right' }).put('E4', `=IFERROR(INDEX(${B('C')},${pos}),"")`, S.calc(money, 'right'));
  st.put('D5', t.colBalance, { ...S.label, h: 'right', size: 12 }).put('E5', `=IFERROR(INDEX(${B('F')},${pos}),"")`, { ...S.calc(money, 'right'), bold: true, size: 12 });
  headerRow(st, 6, 0, [t.colDate, t.colType, t.colAmount, t.colRunning, t.colNote], 24);
  for (let k = 1; k <= SK; k += 1) {
    const r = 7 + k, at = `MATCH(${k},${E('G')},0)`;
    st.put(`A${r}`, `=IFERROR(INDEX(${E('A')},${at}),"")`, S.calc(o.region.date, 'center'));
    st.put(`B${r}`, `=IF(A${r}="","",INDEX(${E('C')},${at}))`, S.calc());
    st.put(`C${r}`, `=IF(A${r}="","",INDEX(${E('D')},${at}))`, S.calc(money));
    st.put(`D${r}`, `=IF(A${r}="","",${k === 1 ? '$E$4' : `IF(D${r - 1}="",$E$4,D${r - 1})`}+IF(B${r}="${t.typeCredit}",C${r},-C${r}))`, { ...S.calc(money), bold: true });
    st.put(`E${r}`, `=IF(A${r}="","",INDEX(${E('E')},${at})&"")`, S.calc());
  }
  st.put(`A${8 + SK}`, t.statementNote, S.note).merge(`A${8 + SK}:E${8 + SK}`).height(7 + SK, 30);

  const u = new SheetBuilder(t.sheetSummary, C.orange); u.widths([32, 18, 4, 12, 12, 12, 12, 12, 12]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const kpis: [string, string, string?][] = [[t.kpiCustomers, `=COUNTIF(${B('A')},"?*")`, '0'], [t.kpiOutstanding, `=SUMIF(${B('F')},">0")`, money], [t.kpiOverdue, `=SUM(${B('J')})+SUM(${B('K')})`, money], [t.kpiOverdueCount, `=COUNTIF(${B('L')},"${t.statusOverdue}")`, '0'], [t.kpiOverLimit, `=COUNTIF(${B('H')},"${t.overLimit}")`, '0'], [t.kpiMonth, `=SUMIFS(${E('D')},${E('C')},"${t.typePayment}",${E('A')},">="&DATE(YEAR(${asOf}),MONTH(${asOf}),1),${E('A')},"<="&${asOf})`, money]];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  [[t.bucketNew, 'I'], [t.bucketMid, 'J'], [t.older, 'K']].forEach(([label, col], i) => u.put(`A${10 + i}`, label, { size: 8, color: C.muted }).put(`B${10 + i}`, `=SUM(${B(col!)})`, { ...S.calc(money), size: 8 }));
  u.chart({ kind: 'pie', title: t.chartAgeing, cats: `${q(t.sheetSummary)}!$A$10:$A$12`, series: [{ name: t.chartAgeing, vals: `${q(t.sheetSummary)}!$B$10:$B$12` }], at: { col: 3, row: 1, cols: 6, rows: 14 } });
  const n = Math.min(cap, Math.max(5, Math.min(12, o.rows.length)));
  u.chart({ kind: 'col', title: t.chartBalances, cats: `${q(t.sheetBalances)}!$A$${bFirst}:$A$${bFirst + n - 1}`, series: [{ name: t.colBalance, vals: `${q(t.sheetBalances)}!$F$${bFirst}:$F$${bFirst + n - 1}`, color: C.orange }], at: { col: 0, row: 15, cols: 9, rows: 16 } });

  book.sheets = [guide.def, settings.def, customers.def, entries.def, bal.def, st.def, u.def];
  return book;
}
