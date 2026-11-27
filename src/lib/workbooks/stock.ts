/** Stock register workbook: items, a log of stock coming in and going out, what is left, and an order list for items that have run low. */
import { SheetBuilder, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { listSheet, settingsSheet, statusRules } from './kit';
import { parseAmount } from './dates';
import { moneyFormat, numberFormat, type Region } from './region';
import T from '../../locales/packs/workbooks.more.text.en.json';

const t = T.stock.sheet;
export interface StockOptions { business: string; rows: Record<string, string>[]; spare: number; logRows: number; orderMultiple: number; sample: boolean; region: Region; hinglish: boolean }

export function buildStock(o: StockOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), qty = numberFormat(o.region, 2), N = T.common;
  const cap = Math.min(300, Math.max(1, o.rows.length + o.spare)), first = 4, last = 3 + cap, logFirst = 4, logLast = 3 + o.logRows, sFirst = 5, sLast = 4 + cap;
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: T.common.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetItems, t.sheetLog, t.sheetStock, t.sheetOrder, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });

  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.multiple, o.orderMultiple]], t.settingsHelp);
  const items = listSheet(t.sheetItems, t.itemsTitle, t.itemsSub, [{ head: t.colItem, width: 30 }, { head: t.colUnit, width: 11 }, { head: t.colOpening, width: 13, fmt: qty }, { head: t.colReorder, width: 13, fmt: qty }, { head: t.colCost, width: 13, fmt: money }, { head: t.colPrice, width: 13, fmt: money }],
    o.rows.map((r) => [r.name, r.unit, parseAmount(r.opening ?? '') ?? undefined, parseAmount(r.reorder ?? '') ?? undefined, parseAmount(r.cost ?? '') ?? undefined, parseAmount(r.price ?? '') ?? undefined]), cap);
  items.validate({ range: `C${first}:F${last}`, kind: 'decimal', min: 0 });

  // Sample movements: [days ago, item number, in or out, quantity, note].
  const today = todaySerial(now);
  const log = listSheet(t.sheetLog, t.logTitle, t.logSub, [{ head: t.colDate, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colItem, width: 30 }, { head: t.colType, width: 10, align: 'center' }, { head: t.colQty, width: 12, fmt: qty }, { head: t.colNote, width: 34 }],
    o.sample ? T.stock.sample.moves.map((m) => [today - m.ago, o.rows[m.item]?.name, m.kind === 'in' ? t.typeIn : t.typeOut, m.qty, m.note]).filter((r) => r[1]) : [], o.logRows);
  log.validate({ range: `B${logFirst}:B${logLast}`, kind: 'list', listRef: `${q(t.sheetItems)}!$A$${first}:$A$${last}`, title: t.colItem, prompt: t.itemHelp });
  log.validate({ range: `C${logFirst}:C${logLast}`, kind: 'list', list: [t.typeIn, t.typeOut], title: t.colType, prompt: t.typeHelp });
  log.validate({ range: `D${logFirst}:D${logLast}`, kind: 'decimal', min: 0, title: t.colQty, prompt: t.qtyHelp });
  log.validate({ range: `A${logFirst}:A${logLast}`, kind: 'date', min: 36526, title: t.colDate, prompt: t.dateHelp, soft: true });
  log.def.filter = `A3:E${logLast}`;
  log.rule({ range: `C${logFirst}:C${logLast}`, formula: `$C${logFirst}="${t.typeOut}"`, fill: C.red, color: C.redText });
  log.rule({ range: `C${logFirst}:C${logLast}`, formula: `$C${logFirst}="${t.typeIn}"`, fill: C.green, color: C.greenText });

  const L = (col: string) => `${q(t.sheetLog)}!$${col}$${logFirst}:$${col}$${logLast}`, I = (col: string, r: number) => `${q(t.sheetItems)}!${col}${r}`;
  const st = new SheetBuilder(t.sheetStock, C.greenBar); st.widths([30, 11, 12, 12, 12, 13, 13, 15, 15, 15, 5]); st.def.hiddenCols = [10]; st.def.freeze = { row: 4, col: 1 }; st.def.filter = `A4:J${sLast}`;
  st.put('A1', t.stockTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.stockSub, S.subtitle).merge('A2:J2').height(1, 30);
  headerRow(st, 3, 0, [t.colItem, t.colUnit, t.colOpening, t.colIn, t.colOut, t.colLeft, t.colReorder, t.colStatus, t.colValueCost, t.colValuePrice], 36);
  for (let i = 0; i < cap; i += 1) {
    const r = sFirst + i, ir = first + i;
    st.put(`A${r}`, `=IF(${I('A', ir)}="","",${I('A', ir)})`, S.calc());
    st.put(`B${r}`, `=IF($A${r}="","",${I('B', ir)}&"")`, S.calc());
    st.put(`C${r}`, `=IF($A${r}="","",IF(${I('C', ir)}="",0,${I('C', ir)}))`, S.calc(qty));
    st.put(`D${r}`, `=IF($A${r}="","",SUMIFS(${L('D')},${L('B')},$A${r},${L('C')},"${t.typeIn}"))`, S.calc(qty));
    st.put(`E${r}`, `=IF($A${r}="","",SUMIFS(${L('D')},${L('B')},$A${r},${L('C')},"${t.typeOut}"))`, S.calc(qty));
    st.put(`F${r}`, `=IF($A${r}="","",C${r}+D${r}-E${r})`, { ...S.calc(qty), bold: true });
    st.put(`G${r}`, `=IF($A${r}="","",IF(${I('D', ir)}="",0,${I('D', ir)}))`, S.calc(qty));
    st.put(`H${r}`, `=IF($A${r}="","",IF(F${r}<=0,"${t.statusOut}",IF(F${r}<=G${r},"${t.statusOrder}","${t.statusOk}")))`, S.calc(undefined, 'center'));
    st.put(`I${r}`, `=IF($A${r}="","",ROUND(F${r}*IF(${I('E', ir)}="",0,${I('E', ir)}),2))`, S.calc(money));
    st.put(`J${r}`, `=IF($A${r}="","",ROUND(F${r}*IF(${I('F', ir)}="",0,${I('F', ir)}),2))`, S.calc(money));
    st.put(`K${r}`, `=IF(OR(H${r}="${t.statusOut}",H${r}="${t.statusOrder}"),COUNTIF(H$${sFirst}:H${r},"${t.statusOut}")+COUNTIF(H$${sFirst}:H${r},"${t.statusOrder}"),"")`, { size: 8, color: C.muted });
  }
  st.put(`A${sLast + 1}`, N.totals, { bold: true, h: 'right' }).put(`I${sLast + 1}`, `=SUM(I${sFirst}:I${sLast})`, { ...S.calc(money), bold: true }).put(`J${sLast + 1}`, `=SUM(J${sFirst}:J${sLast})`, { ...S.calc(money), bold: true });
  statusRules(st, `H${sFirst}:H${sLast}`, `$H${sFirst}`, { good: t.statusOk, warn: t.statusOrder, bad: t.statusOut });
  st.rule({ range: `F${sFirst}:F${sLast}`, formula: `AND($A${sFirst}<>"",$F${sFirst}<=0)`, color: C.redText, bold: true });

  const ord = new SheetBuilder(t.sheetOrder, C.orange); ord.widths([6, 30, 11, 12, 13, 15, 15]); ord.def.freeze = { row: 3, col: 0 };
  ord.put('A1', t.orderTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.orderSub, S.subtitle).merge('A2:G2').height(1, 30);
  headerRow(ord, 2, 0, [N.number, t.colItem, t.colUnit, t.colLeft, t.colReorder, t.colSuggested, t.colEstimate], 36);
  const SK = (col: string) => `${q(t.sheetStock)}!$${col}$${sFirst}:$${col}$${sLast}`;
  for (let i = 0; i < cap; i += 1) {
    const r = 4 + i, pos = `MATCH($A${r},${SK('K')},0)`;
    ord.put(`A${r}`, i + 1, S.calc(undefined, 'center'));
    ord.put(`B${r}`, `=IFERROR(INDEX(${SK('A')},${pos}),"")`, S.calc());
    ord.put(`C${r}`, `=IF($B${r}="","",INDEX(${SK('B')},${pos}))`, S.calc());
    ord.put(`D${r}`, `=IF($B${r}="","",INDEX(${SK('F')},${pos}))`, S.calc(qty));
    ord.put(`E${r}`, `=IF($B${r}="","",INDEX(${SK('G')},${pos}))`, S.calc(qty));
    ord.put(`F${r}`, `=IF($B${r}="","",ROUNDUP(MAX(0,E${r}*${S0(1)}-D${r}),0))`, { ...S.calc(qty), bold: true });
    ord.put(`G${r}`, `=IF($B${r}="","",ROUND(F${r}*IF(INDEX(${q(t.sheetItems)}!$E$${first}:$E$${last},${pos})="",0,INDEX(${q(t.sheetItems)}!$E$${first}:$E$${last},${pos})),2))`, S.calc(money));
  }
  ord.put(`F${cap + 4}`, N.totals, { bold: true, h: 'right' }).put(`G${cap + 4}`, `=SUM(G4:G${cap + 3})`, { ...S.calc(money), bold: true });

  const u = new SheetBuilder(t.sheetSummary, C.orange); u.widths([30, 18, 4, 12, 12, 12, 12, 12, 12]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const kpis: [string, string, string?][] = [[t.kpiItems, `=COUNTIF(${SK('A')},"?*")`, '0'], [t.kpiOut, `=COUNTIF(${SK('H')},"${t.statusOut}")`, '0'], [t.kpiOrder, `=COUNTIF(${SK('H')},"${t.statusOrder}")`, '0'], [t.kpiValueCost, `=SUM(${SK('I')})`, money], [t.kpiValuePrice, `=SUM(${SK('J')})`, money], [t.kpiRestock, `=SUM(${q(t.sheetOrder)}!$G$4:$G$${cap + 3})`, money]];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  u.put('A10', t.statusOk, { size: 8, color: C.muted }).put('B10', `=COUNTIF(${SK('H')},"${t.statusOk}")`, { ...S.calc('0'), size: 8 }).put('A11', t.statusOrder, { size: 8, color: C.muted }).put('B11', '=B5', { ...S.calc('0'), size: 8 }).put('A12', t.statusOut, { size: 8, color: C.muted }).put('B12', '=B4', { ...S.calc('0'), size: 8 });
  u.chart({ kind: 'pie', title: t.chartStatus, cats: `${q(t.sheetSummary)}!$A$10:$A$12`, series: [{ name: t.chartStatus, vals: `${q(t.sheetSummary)}!$B$10:$B$12` }], at: { col: 3, row: 1, cols: 6, rows: 14 } });
  const n = Math.min(cap, Math.max(5, Math.min(12, o.rows.length)));
  u.chart({ kind: 'col', title: t.chartLeft, cats: `${q(t.sheetStock)}!$A$${sFirst}:$A$${sFirst + n - 1}`, series: [{ name: t.colLeft, vals: `${q(t.sheetStock)}!$F$${sFirst}:$F$${sFirst + n - 1}`, color: C.orange }], at: { col: 0, row: 15, cols: 9, rows: 16 } });

  book.sheets = [guide.def, settings.def, items.def, log.def, st.def, ord.def, u.def];
  return book;
}
