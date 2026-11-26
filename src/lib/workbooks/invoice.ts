/** Invoice workbook: a printable invoice that fills prices and addresses from your lists, adds up to three taxes you define, and a log that tracks who has paid. */
import { SheetBuilder, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, labels, q, startHere } from './common';
import { moneyFormat, type Region } from './region';

const t = labels.invoice;
export interface InvoiceItem { name: string; description: string; price: number | null }
export interface InvoiceCustomer { name: string; address: string; phone: string }
export interface TaxLine { label: string; rate: number | null }
export interface InvoiceOptions {
  seller: { name: string; address: string; contact: string; taxId: string }; title: string; invoiceNo: string; taxes: TaxLine[]; items: InvoiceItem[]; customers: InvoiceCustomer[];
  lines: number; discountColumn: boolean; roundOff: boolean; notes: string; sample: boolean; region: Region; hinglish: boolean;
}
export const SAMPLE_ITEMS: InvoiceItem[] = t.sampleItems.map((s) => ({ name: s.name, description: s.description, price: s.price }));
export const SAMPLE_CUSTOMERS: InvoiceCustomer[] = t.sampleCustomers.map((c) => ({ ...c }));
const CAP = 200;

export function buildInvoice(o: InvoiceOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), items = labels.common.itemsName, customers = labels.common.customersName, log = t.sheetLog, inv = t.sheetInvoice;
  const first = 14, last = first + o.lines - 1, itemLast = 3 + CAP;
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: t.legendInput, calc: t.legendCalc, sheets: labels.common.sheets, credit: '' }, sheets: [{ name: inv, about: t.aboutInvoice }, { name: items, about: t.aboutItems }, { name: customers, about: t.aboutCustomers }, { name: log, about: t.aboutLog }], region: o.region });

  const b = new SheetBuilder(inv, C.orange); b.widths([5, 38, 9, 14, 10, 17]); if (!o.discountColumn) b.def.hiddenCols = [4];
  b.put('A1', o.seller.name, { ...S.title, input: true }).merge('A1:D1').height(0, 32).put('E1', o.title, { bold: true, size: 20, color: C.orange, h: 'right', input: true }).merge('E1:F1');
  b.put('A2', o.seller.address, { wrap: true, v: 'top', input: true, color: C.muted }).merge('A2:D3').height(1, 17).height(2, 17);
  b.put('E2', t.invoiceNo, { ...S.label, h: 'right' }).put('F2', o.invoiceNo, { ...S.input(undefined, 'center'), bold: true });
  b.put('E3', t.date, { ...S.label, h: 'right' }).put('F3', todaySerial(now), S.input(o.region.date, 'center'));
  b.put('A4', o.seller.contact, { input: true, color: C.muted }).merge('A4:D4').put('E4', t.dueDate, { ...S.label, h: 'right' }).put('F4', todaySerial(now) + 15, S.input(o.region.date, 'center'));
  b.put('A5', o.seller.taxId, { input: true, color: C.muted }).merge('A5:D5').height(5, 8);
  b.put('A7', t.billTo, S.section).merge('A7:F7');
  b.put('A8', o.sample ? o.customers[0]?.name : undefined, { ...S.input(), bold: true, size: 12 }).merge('A8:D8').height(7, 22);
  b.put('A9', `=IF(A8="","",IFERROR(INDEX(${q(customers)}!$B$4:$B$${itemLast},MATCH(A8,${q(customers)}!$A$4:$A$${itemLast},0))&"",""))`, { ...S.calc(), wrap: true, v: 'top' }).merge('A9:D10').height(8, 18).height(9, 18);
  b.put('A11', `=IF(A8="","",IFERROR(INDEX(${q(customers)}!$C$4:$C$${itemLast},MATCH(A8,${q(customers)}!$A$4:$A$${itemLast},0))&"",""))`, S.calc()).merge('A11:D11');
  b.height(11, 8);
  headerRow(b, 12, 0, [t.colNo, t.colItem, t.colQty, t.colRate, t.colDiscount, t.colAmount], 24);
  for (let i = 0; i < o.lines; i += 1) {
    const r = first + i, demo = o.sample ? t.sampleLines[i] : undefined;
    b.put(`A${r}`, i + 1, { color: C.muted, h: 'center', border: 'all' });
    b.put(`B${r}`, demo?.item, S.input()).put(`C${r}`, demo?.qty, S.input('0.##', 'center'));
    b.put(`D${r}`, `=IF(B${r}="","",IFERROR(INDEX(${q(items)}!$C$4:$C$${itemLast},MATCH(B${r},${q(items)}!$A$4:$A$${itemLast},0)),""))`, S.input(money));
    b.put(`E${r}`, undefined, S.input('0%', 'center'));
    b.put(`F${r}`, `=IF(OR(B${r}="",C${r}="",D${r}=""),"",ROUND(C${r}*D${r}*(1-IF(E${r}="",0,E${r})),2))`, S.calc(money));
  }
  const rs = last + 1;                    // subtotal row
  const label = { bold: true, h: 'right' as const };
  b.put(`B${rs}`, t.subtotal, label).put(`F${rs}`, `=SUM(F${first}:F${last})`, S.calc(money));
  Array.from({ length: 3 }, (_, i) => o.taxes[i] ?? { label: '', rate: null }).forEach((tax, i) => {
    const r = rs + 1 + i;
    b.put(`B${r}`, tax.label, { ...S.input(), h: 'right', bold: true }).put(`C${r}`, tax.rate ?? undefined, S.input('0.##%', 'center')).put(`F${r}`, `=IF(OR(C${r}="",B${r}=""),"",ROUND($F$${rs}*C${r},2))`, S.calc(money));
  });
  const other = rs + 4, round = rs + 5, total = rs + 6, paid = rs + 7, due = rs + 8;
  b.put(`B${other}`, t.other, label).put(`F${other}`, undefined, S.input(money));
  b.put(`B${round}`, t.roundOff, label).put(`C${round}`, o.roundOff ? t.yes : t.no, { ...S.input(undefined, 'center') }).put(`F${round}`, `=IF(C${round}="${t.yes}",ROUND(F${rs}+SUM(F${rs + 1}:F${other}),0)-(F${rs}+SUM(F${rs + 1}:F${other})),"")`, S.calc(money));
  b.put(`B${total}`, t.total, { bold: true, h: 'right', size: 12 }).put(`F${total}`, `=F${rs}+SUM(F${rs + 1}:F${round})`, { ...S.calc(money), bold: true, size: 12, fill: C.soft });
  b.put(`B${paid}`, t.paid, label).put(`F${paid}`, undefined, S.input(money));
  b.put(`B${due}`, t.due, { bold: true, h: 'right', size: 12 }).put(`F${due}`, `=F${total}-IF(F${paid}="",0,F${paid})`, { ...S.calc(money), bold: true, size: 12 }).put(`C${due}`, `=IF(F${total}=0,"",IF(F${due}<=0,"${t.statusPaid}","${t.statusDue}"))`, { bold: true, h: 'center' });
  b.validate({ range: `C${round}`, kind: 'list', list: [t.yes, t.no], title: t.roundOff, prompt: t.roundHelp });
  b.put(`A${due + 2}`, t.notes, S.section).merge(`A${due + 2}:F${due + 2}`);
  b.put(`A${due + 3}`, o.notes, { wrap: true, v: 'top', input: true, fill: C.input, border: 'all' }).merge(`A${due + 3}:F${due + 3}`).height(due + 2, 64);
  b.rule({ range: `C${due}`, formula: `C${due}="${t.statusPaid}"`, fill: C.green, color: C.greenText });
  b.rule({ range: `C${due}`, formula: `C${due}="${t.statusDue}"`, fill: C.red, color: C.redText });
  b.validate({ range: `B${first}:B${last}`, kind: 'list', listRef: `${q(items)}!$A$4:$A$${itemLast}`, soft: true, title: t.colItem, prompt: t.itemHelp });
  b.validate({ range: 'A8', kind: 'list', listRef: `${q(customers)}!$A$4:$A$${itemLast}`, soft: true, title: t.billTo, prompt: t.customerHelp });
  b.validate({ range: `C${first}:C${last}`, kind: 'decimal', min: 0, title: t.colQty, prompt: t.qtyHelp });
  b.validate({ range: `E${first}:E${last}`, kind: 'decimal', min: 0, max: 1, title: t.colDiscount, prompt: t.discountHelp, error: t.discountError });
  b.def.printTitles = undefined;

  const it = new SheetBuilder(items, C.orange); it.widths([34, 40, 14]); it.def.freeze = { row: 3, col: 0 };
  it.put('A1', t.itemsTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.itemsSub, S.subtitle).merge('A2:C2').height(1, 28);
  headerRow(it, 2, 0, [t.colItem, t.colDescription, t.colPrice], 24);
  for (let i = 0; i < CAP; i += 1) { const x = o.items[i]; it.put(`A${4 + i}`, x?.name, S.input()).put(`B${4 + i}`, x?.description, S.input()).put(`C${4 + i}`, x?.price ?? undefined, S.input(money)); }
  it.validate({ range: `C4:C${itemLast}`, kind: 'decimal', min: 0 });

  const cu = new SheetBuilder(customers, C.orange); cu.widths([30, 44, 18]); cu.def.freeze = { row: 3, col: 0 };
  cu.put('A1', t.customersTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.customersSub, S.subtitle).merge('A2:C2').height(1, 28);
  headerRow(cu, 2, 0, [t.colCustomer, t.colAddress, t.colPhone], 24);
  for (let i = 0; i < CAP; i += 1) { const x = o.customers[i]; cu.put(`A${4 + i}`, x?.name, S.input()).put(`B${4 + i}`, x?.address, S.input()).put(`C${4 + i}`, x?.phone, S.input()); }

  const lg = new SheetBuilder(log, C.orange); lg.widths([14, 12, 28, 15, 15, 15, 12, 12]); lg.def.freeze = { row: 6, col: 0 };
  const lf = 7, ll = lf + CAP - 1;
  lg.put('A1', t.logTitle, { ...S.title, size: 16 }).height(0, 28);
  [[t.billed, `=SUM(D${lf}:D${ll})`], [t.collected, `=SUM(E${lf}:E${ll})`], [t.outstanding, `=SUM(F${lf}:F${ll})`], [t.overdue, `=SUMIF(H${lf}:H${ll},"${t.statusOverdue}",F${lf}:F${ll})`]].forEach(([name, f], i) => {
    lg.put([i, 2], name, { ...S.label, size: 9, h: 'center', color: C.muted }).put([i, 3], f, { ...S.calc(money), bold: true, size: 12, h: 'center' });
  });
  lg.height(3, 22);
  headerRow(lg, 5, 0, [t.colInvoiceNo, t.colDate, t.colCustomer, t.colAmount, t.colPaid, t.colBalance, t.colDue, t.colStatus], 26);
  for (let i = 0; i < CAP; i += 1) {
    const r = lf + i, d = o.sample ? t.sampleLog[i] : undefined;
    lg.put(`A${r}`, d?.no, S.input()).put(`B${r}`, d ? todaySerial(now) - d.ago : undefined, S.input(o.region.date, 'center')).put(`C${r}`, d?.customer, S.input()).put(`D${r}`, d?.amount, S.input(money)).put(`E${r}`, d?.paid, S.input(money));
    lg.put(`F${r}`, `=IF(D${r}="","",D${r}-IF(E${r}="",0,E${r}))`, S.calc(money));
    lg.put(`G${r}`, d ? todaySerial(now) - d.ago + 15 : undefined, S.input(o.region.date, 'center'));
    lg.put(`H${r}`, `=IF(D${r}="","",IF(F${r}<=0,"${t.statusPaid}",IF(AND(G${r}<>"",G${r}<TODAY()),"${t.statusOverdue}",IF(IF(E${r}="",0,E${r})>0,"${t.statusPart}","${t.statusUnpaid}"))))`, S.calc(undefined, 'center'));
  }
  const st = `H${lf}:H${ll}`;
  lg.rule({ range: st, formula: `$H${lf}="${t.statusPaid}"`, fill: C.green, color: C.greenText, bold: true });
  lg.rule({ range: st, formula: `$H${lf}="${t.statusOverdue}"`, fill: C.red, color: C.redText, bold: true });
  lg.rule({ range: st, formula: `$H${lf}="${t.statusPart}"`, fill: C.amber, color: C.amberText, bold: true });
  lg.validate({ range: `B${lf}:B${ll}`, kind: 'date', min: 36526 }); lg.validate({ range: `G${lf}:G${ll}`, kind: 'date', min: 36526 });
  lg.validate({ range: `D${lf}:E${ll}`, kind: 'decimal', min: 0 });
  lg.chart({ kind: 'pie', title: t.chartTitle, cats: `${q(log)}!$B$3:$C$3`, series: [{ name: t.chartTitle, vals: `${q(log)}!$B$4:$C$4` }], at: { col: 9, row: 1, cols: 5, rows: 14 } });

  book.sheets = [guide.def, b.def, it.def, cu.def, lg.def];
  return book;
}
