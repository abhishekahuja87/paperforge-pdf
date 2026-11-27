/** Vehicle log book workbook: trips and fuel for each vehicle with the distance, fuel, cost per km and kilometres per litre, and totals for each vehicle. */
import { SheetBuilder, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { listSheet, settingsSheet } from './kit';
import { moneyFormat, type Region } from './region';
import T from '../../locales/packs/workbooks.more2.text.en.json';

const t = T.vehicle.sheet;
export interface VehicleOptions { business: string; rows: Record<string, string>[]; spare: number; logRows: number; sample: boolean; region: Region; hinglish: boolean }

export function buildVehicle(o: VehicleOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), N = T.common, cap = Math.min(30, Math.max(1, o.rows.length + o.spare)), first = 4, last = 3 + cap, lFirst = 4, lLast = 3 + o.logRows, today = todaySerial(now);
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetVehicles, t.sheetLog, t.sheetTotals].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });
  const { sheet: settings } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business]], t.settingsHelp);

  const vehicles = listSheet(t.sheetVehicles, t.vehiclesTitle, t.vehiclesSub, [{ head: t.colVehicle, width: 28 }, { head: t.colReg, width: 18 }, { head: t.colNote, width: 30 }], o.rows.map((r) => [r.name, r.reg, r.note]), cap);
  const Ve = (col: string) => `${q(t.sheetVehicles)}!$${col}$${first}:$${col}$${last}`;

  const sample = o.sample ? T.vehicle.sample.trips.map((x) => [today - x.ago, o.rows[x.vehicle % Math.max(1, o.rows.length)]?.name, x.what, x.start, x.end, x.litres, x.fuel, x.other]) : [];
  const log = listSheet(t.sheetLog, t.logTitle, t.logSub, [{ head: t.colDate, width: 12, fmt: o.region.date, align: 'center' }, { head: t.colVehicle, width: 22 }, { head: t.colTrip, width: 26 }, { head: t.colStart, width: 11, fmt: '#,##0' }, { head: t.colEnd, width: 11, fmt: '#,##0' }, { head: t.colLitres, width: 10, fmt: '0.0' }, { head: t.colFuel, width: 12, fmt: money }, { head: t.colOther, width: 12, fmt: money }, { head: t.colKm, width: 9, fmt: '#,##0' }, { head: t.colTotal, width: 12, fmt: money }, { head: t.colPerKm, width: 10, fmt: '0.00' }, { head: t.colKmpl, width: 10, fmt: '0.0' }, { head: t.colCheck, width: 16 }], sample, o.logRows);
  for (let r = lFirst; r <= lLast; r += 1) {
    log.put(`I${r}`, `=IF(OR(D${r}="",E${r}="",E${r}<D${r}),"",E${r}-D${r})`, S.calc('#,##0'));
    log.put(`J${r}`, `=IF(AND(G${r}="",H${r}=""),"",IF(G${r}="",0,G${r})+IF(H${r}="",0,H${r}))`, { ...S.calc(money), bold: true });
    log.put(`K${r}`, `=IF(OR(I${r}="",J${r}=""),"",IF(I${r}>0,J${r}/I${r},""))`, S.calc('0.00'));
    log.put(`L${r}`, `=IF(OR(I${r}="",F${r}=""),"",IF(F${r}>0,I${r}/F${r},""))`, S.calc('0.0'));
    log.put(`M${r}`, `=IF(AND(D${r}<>"",E${r}<>"",E${r}<D${r}),"${t.badEnd}",IF(AND(B${r}="",OR(D${r}<>"",G${r}<>"")),"${t.pickVehicle}",""))`, { ...S.calc(), color: C.redText, bold: true });
  }
  log.validate({ range: `B${lFirst}:B${lLast}`, kind: 'list', listRef: Ve('A'), title: t.colVehicle, prompt: t.vehicleHelp });
  log.validate({ range: `D${lFirst}:H${lLast}`, kind: 'decimal', min: 0 });
  log.def.filter = `A3:M${lLast}`;

  const Lg = (col: string) => `${q(t.sheetLog)}!$${col}$${lFirst}:$${col}$${lLast}`;
  const tt = new SheetBuilder(t.sheetTotals, C.greenBar); tt.widths([26, 14, 12, 14, 14, 14, 12, 12]); tt.def.landscape = true;
  tt.put('A1', t.totalsTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.totalsSub, S.subtitle).merge('A2:H2').height(1, 30);
  headerRow(tt, 2, 0, [t.colVehicle, t.colKm, t.colLitres, t.colFuel, t.colOther, t.colTotal, t.colPerKm, t.colKmpl], 36);
  for (let i = 0; i < cap; i += 1) {
    const r = 4 + i, v = `${q(t.sheetVehicles)}!A${first + i}`;
    tt.put(`A${r}`, `=IF(${v}="","",${v})`, S.calc());
    tt.put(`B${r}`, `=IF($A${r}="","",SUMIF(${Lg('B')},$A${r},${Lg('I')}))`, S.calc('#,##0'));
    tt.put(`C${r}`, `=IF($A${r}="","",SUMIF(${Lg('B')},$A${r},${Lg('F')}))`, S.calc('0.0'));
    tt.put(`D${r}`, `=IF($A${r}="","",SUMIF(${Lg('B')},$A${r},${Lg('G')}))`, S.calc(money));
    tt.put(`E${r}`, `=IF($A${r}="","",SUMIF(${Lg('B')},$A${r},${Lg('H')}))`, S.calc(money));
    tt.put(`F${r}`, `=IF($A${r}="","",D${r}+E${r})`, { ...S.calc(money), bold: true });
    tt.put(`G${r}`, `=IF($A${r}="","",IF(B${r}>0,F${r}/B${r},""))`, S.calc('0.00'));
    tt.put(`H${r}`, `=IF($A${r}="","",IF(SUMIFS(${Lg('I')},${Lg('B')},$A${r},${Lg('F')},">0")>0,SUMIFS(${Lg('I')},${Lg('B')},$A${r},${Lg('F')},">0")/C${r},""))`, S.calc('0.0'));
  }
  tt.put(`A${last + 1}`, N.totals, { bold: true, h: 'right' });
  ['B', 'C', 'D', 'E', 'F'].forEach((col) => tt.put(`${col}${last + 1}`, `=SUM(${col}4:${col}${last})`, { ...S.calc(col === 'B' ? '#,##0' : col === 'C' ? '0.0' : money), bold: true }));
  const n = Math.max(2, Math.min(cap, Math.max(1, o.rows.length)));
  tt.chart({ kind: 'col', title: t.chartCost, cats: `${q(t.sheetTotals)}!$A$4:$A$${3 + n}`, series: [{ name: t.colTotal, vals: `${q(t.sheetTotals)}!$F$4:$F$${3 + n}`, color: C.orange }], at: { col: 9, row: 2, cols: 6, rows: 16 } });
  book.sheets = [guide.def, settings.def, vehicles.def, log.def, tt.def];
  return book;
}
