/** Monthly delivery bill workbook for milk, tiffin, newspaper, water cans and any other regular supply. Each customer starts with the usual quantity filled in, so only the days that differ are changed. */
import { SheetBuilder, colName, serial, type Book } from '../xlsx/model';
import { C, S, headerRow, labels, q, startHere } from './common';
import { daysIn } from './dates';
import { moneyFormat, type Region } from './region';

const t = labels.billing;
export interface BillingCustomer { name: string; phone: string; rate: number | null; qty: number | null; opening: number | null; address: string }
export interface BillingOptions { business: string; product: string; unit: string; customers: BillingCustomer[]; year: number; month: number; prefill: boolean; spareRows: number; message: string; sample: boolean; region: Region; hinglish: boolean }
export const SAMPLE_CUSTOMERS: BillingCustomer[] = t.sampleCustomers.map((c) => ({ ...c }));

/** Sample days that differ from the usual quantity, and sample payments, so the colours show up in a sample file. */
const SAMPLE_DAYS = [{ customer: 0, day: 5, qty: 0 }, { customer: 1, day: 12, qty: 3 }, { customer: 1, day: 13, qty: 0 }, { customer: 2, day: 20, qty: 2 }, { customer: 4, day: 8, qty: 1 }];
const SAMPLE_PAID: (number | undefined)[] = [1450, 1000, 2250, undefined, 3000];
const DAY0 = 2, DAYS = 31;                                  // day columns C to AG
export function buildBilling(o: BillingOptions): Book {
  const money = moneyFormat(o.region), cap = o.customers.length + o.spareRows, settings = labels.common.settingsName, customers = labels.common.customersName;
  const entry = t.sheetEntry, bills = t.sheetBills, remind = t.sheetRemind, summary = t.sheetSummary;
  const days = daysIn(o.year, o.month), efirst = 5, elast = efirst + cap - 1, cfirst = 4;
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: t.legendInput, calc: t.legendCalc, sheets: labels.common.sheets, credit: '' }, sheets: [{ name: settings, about: t.aboutSettings }, { name: customers, about: t.aboutCustomers }, { name: entry, about: t.aboutEntry }, { name: bills, about: t.aboutBills }, { name: remind, about: t.aboutRemind }, { name: summary, about: t.aboutSummary }], region: o.region });

  const s = new SheetBuilder(settings, C.orange); s.widths([30, 50]);
  s.put('A1', t.settingsTitle, { ...S.title, size: 16 }).height(0, 28);
  const rows: [string, string | number | undefined, string?][] = [[t.business, o.business], [t.product, o.product], [t.unit, o.unit], [t.month, serial(o.year, o.month, 1), 'mmmm yyyy'], [t.currencyWord, o.region.word], [t.countryCode, o.region.code], [t.message, o.message]];
  rows.forEach(([name, value, fmt], i) => { s.put([0, 2 + i], name, S.label).put([1, 2 + i], value, { ...S.input(fmt), wrap: true, v: 'top' }); });
  s.height(8, 64).put('A11', t.messageHelp, S.note).merge('A11:B11').height(10, 44);
  const M = (row: number) => `${q(settings)}!$B$${row}`;           // 3 business, 4 product, 5 unit, 6 month, 7 word, 8 code, 9 message

  const c = new SheetBuilder(customers, C.orange); c.widths([28, 16, 13, 12, 14, 36]); c.def.freeze = { row: 3, col: 1 };
  c.put('A1', t.customersTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.customersSub, S.subtitle).merge('A2:F2').height(1, 30);
  headerRow(c, 2, 0, [t.colName, t.colPhone, t.colRate, t.colUsual, t.colOpening, t.colAddress], 36);
  for (let i = 0; i < cap; i += 1) {
    const x = o.customers[i], r = cfirst + i;
    c.put(`A${r}`, x?.name, S.input()).put(`B${r}`, x?.phone, S.input()).put(`C${r}`, x?.rate ?? undefined, S.input(money)).put(`D${r}`, x?.qty ?? undefined, S.input('0.##', 'center')).put(`E${r}`, x?.opening ?? undefined, S.input(money)).put(`F${r}`, x?.address, S.input());
  }
  c.validate({ range: `C${cfirst}:E${cfirst + cap - 1}`, kind: 'decimal', min: 0 });

  const e = new SheetBuilder(entry, C.greenBar); e.def.landscape = true; e.def.freeze = { row: 4, col: 2 }; e.def.printTitles = '$3:$4'; e.def.zoom = 90;
  const total = DAY0 + DAYS, TQ = colName(total), RT = colName(total + 1), AM = colName(total + 2), OP = colName(total + 3), PD = colName(total + 4), BL = colName(total + 5), ST = colName(total + 6);
  e.widths([24, 8]); for (let d = 0; d < DAYS; d += 1) e.def.widths[DAY0 + d] = 4; e.widths([9, 11, 13, 13, 13, 13, 11], total);
  e.put('A1', `=${M(3)}&" - "&${M(4)}&" - "&TEXT(${M(6)},"mmmm yyyy")`, { ...S.title, size: 16 }).height(0, 28);
  e.put('A2', t.tip, S.subtitle).merge(`A2:${colName(DAY0 + 20)}2`).height(1, 20);
  headerRow(e, 3, 0, [t.colName, t.colUsual], 34);
  for (let d = 1; d <= DAYS; d += 1) {
    const col = colName(DAY0 + d - 1), real = d <= days, dow = (new Date(Date.UTC(o.year, o.month - 1, d)).getUTCDay() + 6) % 7;
    e.put(`${col}4`, real ? serial(o.year, o.month, d) : undefined, { ...S.head, numFmt: 'd', size: 9 });
    e.put(`${col}3`, real ? labels.common.weekdayInitials[dow] : undefined, { size: 8, color: C.muted, h: 'center' });
  }
  headerRow(e, 3, total, [t.colTotal, t.colRate, t.colAmount, t.colOpening, t.colPaid, t.colBalance, t.colStatus], 34);
  const d0 = colName(DAY0), dN = colName(DAY0 + DAYS - 1);
  for (let i = 0; i < cap; i += 1) {
    const r = efirst + i, cr = cfirst + i, x = o.customers[i];
    e.put(`A${r}`, `=IF(${q(customers)}!A${cr}="","",${q(customers)}!A${cr})`, S.calc());
    e.put(`B${r}`, `=IF($A${r}="","",IF(${q(customers)}!D${cr}="",0,${q(customers)}!D${cr}))`, S.calc('0.##', 'center'));
    for (let d = 1; d <= DAYS; d += 1) {
      const col = DAY0 + d - 1;
      if (d > days) { e.put([col, r - 1], undefined, { fill: C.weekend, border: 'all', borderColor: 'E2E8F0' }); continue; }
      const odd = o.sample ? SAMPLE_DAYS.find((x) => x.customer === i && x.day === d) : undefined;
      e.put([col, r - 1], odd ? odd.qty : o.prefill && x && x.qty ? x.qty : undefined, { ...S.cell('0.##', 'center'), input: true, size: 9 });
    }
    e.put(`${TQ}${r}`, `=IF($A${r}="","",SUM(${d0}${r}:${dN}${r}))`, S.calc('0.##', 'center'));
    e.put(`${RT}${r}`, `=IF($A${r}="","",IF(${q(customers)}!C${cr}="",0,${q(customers)}!C${cr}))`, S.calc(money));
    e.put(`${AM}${r}`, `=IF($A${r}="","",ROUND(${TQ}${r}*${RT}${r},2))`, S.calc(money));
    e.put(`${OP}${r}`, `=IF($A${r}="","",IF(${q(customers)}!E${cr}="",0,${q(customers)}!E${cr}))`, S.calc(money));
    e.put(`${PD}${r}`, o.sample ? SAMPLE_PAID[i] : undefined, S.input(money));
    e.put(`${BL}${r}`, `=IF($A${r}="","",${OP}${r}+${AM}${r}-IF(${PD}${r}="",0,${PD}${r}))`, { ...S.calc(money), bold: true });
    e.put(`${ST}${r}`, `=IF($A${r}="","",IF(${BL}${r}<=0,"${t.statusPaid}",IF(IF(${PD}${r}="",0,${PD}${r})>0,"${t.statusPart}","${t.statusPending}")))`, S.calc(undefined, 'center'));
  }
  const tr = elast + 1;
  e.put(`A${tr}`, t.totals, { bold: true, h: 'right' });
  for (let d = 0; d < DAYS; d += 1) { const col = colName(DAY0 + d); e.put(`${col}${tr}`, `=SUM(${col}${efirst}:${col}${elast})`, { ...S.calc('0.#', 'center'), size: 8 }); }
  [[TQ, '0.##'], [AM, money], [OP, money], [PD, money], [BL, money]].forEach(([col, fmt]) => e.put(`${col}${tr}`, `=SUM(${col}${efirst}:${col}${elast})`, { ...S.calc(fmt), bold: true }));
  const area = `${d0}${efirst}:${dN}${elast}`;
  e.rule({ range: `${d0}${efirst}:${dN}${elast}`, formula: `${d0}$4=""`, fill: C.weekend, stop: true });
  e.rule({ range: area, formula: `AND(ISNUMBER(${d0}${efirst}),${d0}${efirst}=0)`, fill: C.red, color: C.redText, bold: true, stop: true });
  e.rule({ range: area, formula: `AND(ISNUMBER(${d0}${efirst}),$B${efirst}<>"",${d0}${efirst}<>$B${efirst})`, fill: C.orangeSoft, bold: true });
  const stat = `${ST}${efirst}:${ST}${elast}`;
  e.rule({ range: stat, formula: `$${ST}${efirst}="${t.statusPaid}"`, fill: C.green, color: C.greenText, bold: true });
  e.rule({ range: stat, formula: `$${ST}${efirst}="${t.statusPending}"`, fill: C.red, color: C.redText, bold: true });
  e.rule({ range: stat, formula: `$${ST}${efirst}="${t.statusPart}"`, fill: C.amber, color: C.amberText, bold: true });
  e.validate({ range: area, kind: 'decimal', min: 0, title: t.cellTitle, prompt: t.cellHelp, error: t.cellError });
  e.validate({ range: `${PD}${efirst}:${PD}${elast}`, kind: 'decimal', min: 0, title: t.colPaid, prompt: t.paidHelp });

  const b = new SheetBuilder(bills, C.orange); b.widths([13, 11, 3, 13, 11]); b.def.hiddenCols = [6, 7]; b.widths([6, 6], 6);
  const idx = '$G$1', E = (col: string) => `${q(entry)}!$${col}$${efirst}:$${col}$${elast}`;
  b.put('G1', `=IF(B3="","",IFERROR(MATCH(B3,${q(entry)}!$A$${efirst}:$A$${elast},0),""))`, { size: 8, color: C.muted });
  b.put('A1', `=${M(3)}`, { ...S.title, size: 16 }).merge('A1:E1').height(0, 28);
  b.put('A2', `="${t.billFor} "&TEXT(${M(6)},"mmmm yyyy")`, { bold: true, color: C.muted }).merge('A2:E2');
  b.put('A3', t.customer, S.label).put('B3', o.customers[0]?.name, { ...S.input(), bold: true }).merge('B3:E3').height(2, 22);
  b.put('A4', t.colPhone, S.label).put('B4', `=IF(${idx}="","",IFERROR(INDEX(${q(customers)}!$B$${cfirst}:$B$${cfirst + cap - 1},${idx})&"",""))`, S.calc()).merge('B4:E4');
  b.put('A5', t.addressShort, S.label).put('B5', `=IF(${idx}="","",IFERROR(INDEX(${q(customers)}!$F$${cfirst}:$F$${cfirst + cap - 1},${idx})&"",""))`, { ...S.calc(), wrap: true, v: 'top' }).merge('B5:E6').height(4, 18).height(5, 18);
  b.validate({ range: 'B3', kind: 'list', listRef: `${q(customers)}!$A$${cfirst}:$A$${cfirst + cap - 1}`, title: t.customer, prompt: t.billHelp });
  headerRow(b, 7, 0, [t.billDate, t.billQty], 22); headerRow(b, 7, 3, [t.billDate, t.billQty], 22);
  const dateRow = `${q(entry)}!$${d0}$4:$${dN}$4`, qtyArea = `${q(entry)}!$${d0}$${efirst}:$${dN}$${elast}`;
  for (let i = 0; i < 16; i += 1) {
    [[0, 1 + i], [3, 17 + i]].forEach(([col, day]) => {
      if (day! > 31) { b.put([col!, 8 + i], undefined, S.cell()).put([col! + 1, 8 + i], undefined, S.cell()); return; }
      const dc = colName(col!), qc = colName(col! + 1), r = 9 + i;
      b.put(`${dc}${r}`, `=IF(${idx}="","",IF(INDEX(${dateRow},1,${day})=0,"",INDEX(${dateRow},1,${day})))`, S.calc(o.region.date, 'center'));
      b.put(`${qc}${r}`, `=IF(OR(${idx}="",${dc}${r}=""),"",INDEX(${qtyArea},${idx},${day}))`, S.calc('0.##', 'center'));
    });
  }
  const rowsOut: [string, string, string?][] = [[`${t.totalUnits}`, `=IF(${idx}="","",INDEX(${E(TQ)},${idx}))`, '0.##'], [t.colRate, `=IF(${idx}="","",INDEX(${E(RT)},${idx}))`, money], [t.colAmount, `=IF(${idx}="","",INDEX(${E(AM)},${idx}))`, money], [t.colOpening, `=IF(${idx}="","",INDEX(${E(OP)},${idx}))`, money], [t.colPaid, `=IF(${idx}="","",IF(INDEX(${E(PD)},${idx})="",0,INDEX(${E(PD)},${idx})))`, money], [t.colBalance, `=IF(${idx}="","",INDEX(${E(BL)},${idx}))`, money]];
  rowsOut.forEach(([name, f, fmt], i) => { const r = 26 + i; b.put(`A${r}`, name, i === 5 ? { ...S.label, size: 12 } : S.label).merge(`A${r}:B${r}`).put(`D${r}`, f, { ...S.calc(fmt, 'right'), bold: i === 5, size: i === 5 ? 12 : 11 }).merge(`D${r}:E${r}`); });
  b.put('A33', t.thanks, { ...S.input(), wrap: true, v: 'top' }).merge('A33:E34');

  const rm = new SheetBuilder(remind, C.orange); rm.widths([26, 16, 14, 12, 18, 3, 3, 3, 3]); rm.def.hiddenCols = [5, 6, 7, 8]; rm.def.freeze = { row: 4, col: 0 };
  rm.put('A1', t.remindTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.remindSub, S.subtitle).merge('A2:E2').height(1, 44);
  headerRow(rm, 3, 0, [t.colName, t.colPhone, t.colBalance, t.colStatus, t.colLink], 28);
  for (let i = 0; i < cap; i += 1) {
    const r = 5 + i, er = efirst + i, cr = cfirst + i;
    const phone = `${q(customers)}!B${cr}`, clean = `SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(${phone}," ",""),"-",""),"+",""),"(",""),")","")`;
    rm.put(`A${r}`, `=${q(entry)}!A${er}`, S.calc()).put(`B${r}`, `=IF(A${r}="","",${phone}&"")`, S.calc()).put(`C${r}`, `=${q(entry)}!${BL}${er}`, S.calc(money)).put(`D${r}`, `=${q(entry)}!${ST}${er}`, S.calc(undefined, 'center'));
    rm.put(`F${r}`, `=IF(OR(A${r}="",B${r}=""),"",IF(LEFT(${clean},1)="0",MID(${clean},2,20),${clean}))`, { size: 8, color: C.muted });
    rm.put(`G${r}`, `=IF(F${r}="","",IF(LEN(F${r})<=10,${M(8)}&F${r},F${r}))`, { size: 8, color: C.muted });
    const text = `SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(${M(9)},"{name}",A${r}),"{amount}",IF(${M(7)}="","",${M(7)}&" ")&TEXT(C${r},"0.00")),"{month}",TEXT(${M(6)},"mmmm yyyy")),"{business}",${M(3)}),"{product}",${M(4)})`;
    rm.put(`H${r}`, `=SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(${text},"%","%25")," ","%20"),"&","%26"),"#","%23"),"+","%2B")`, { size: 8, color: C.muted });
    rm.put(`E${r}`, `=IF(OR(G${r}="",C${r}="",D${r}="${t.statusPaid}"),"",IF(C${r}<=0,"",HYPERLINK("https://wa.me/"&G${r}&"?text="&H${r},"${t.sendReminder}")))`, { ...S.calc(undefined, 'center'), color: C.ink, underline: true, bold: true });
  }
  rm.rule({ range: `D5:D${4 + cap}`, formula: `$D5="${t.statusPending}"`, fill: C.red, color: C.redText, bold: true });
  rm.rule({ range: `D5:D${4 + cap}`, formula: `$D5="${t.statusPaid}"`, fill: C.green, color: C.greenText, bold: true });
  rm.rule({ range: `D5:D${4 + cap}`, formula: `$D5="${t.statusPart}"`, fill: C.amber, color: C.amberText, bold: true });

  const u = new SheetBuilder(summary, C.orange); u.widths([26, 16, 16, 11, 11, 11, 11, 11, 11]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const pos = `${q(entry)}!$${BL}$${efirst}:$${BL}$${elast}`;
  const kpis: [string, string, string?][] = [[t.kpiCustomers, `=COUNTIF(${E('A')},"?*")`, '0'], [t.kpiUnits, `=SUM(${E(TQ)})`, '0.##'], [t.kpiBilled, `=SUM(${E(AM)})`, money], [t.kpiCollected, `=SUM(${E(PD)})`, money], [t.kpiPending, `=SUMIF(${pos},">0")`, money], [t.kpiPaidCount, `=COUNTIF(${E(ST)},"${t.statusPaid}")`, '0'], [t.kpiPendingCount, `=COUNTIF(${E(ST)},"${t.statusPending}")+COUNTIF(${E(ST)},"${t.statusPart}")`, '0']];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  u.put('A11', t.chartLabelCollected, { size: 8, color: C.muted }).put('B11', `=B6`, { ...S.calc(money), size: 8 }).put('A12', t.chartLabelPending, { size: 8, color: C.muted }).put('B12', `=B7`, { ...S.calc(money), size: 8 });
  u.chart({ kind: 'pie', title: t.chartPie, cats: `${q(summary)}!$A$11:$A$12`, series: [{ name: t.chartPie, vals: `${q(summary)}!$B$11:$B$12` }], at: { col: 3, row: 1, cols: 6, rows: 14 } });
  const n = Math.max(1, o.customers.length);
  u.chart({ kind: 'col', title: t.chartBars, cats: `${q(entry)}!$A$${efirst}:$A$${efirst + n - 1}`, series: [{ name: t.colAmount, vals: `${q(entry)}!$${AM}$${efirst}:$${AM}$${efirst + n - 1}`, color: C.orange }], at: { col: 0, row: 14, cols: 9, rows: 16 } });

  book.sheets = [guide.def, s.def, c.def, e.def, b.def, rm.def, u.def];
  return book;
}
