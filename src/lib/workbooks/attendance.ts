/** Attendance and leave register workbook: one sheet for each month, week offs and holidays shade themselves, and a summary across months. */
import { SheetBuilder, colName, serial, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, labels, q, safeSheetName, startHere } from './common';
import { daysIn } from './dates';
import type { Region } from './region';

const t = labels.attendance;
export interface Person { name: string; id: string }
export interface Holiday { date: number; name: string }
export interface AttendanceOptions { org: string; people: Person[]; year: number; month: number; months: number; spareRows: number; weekOff: boolean[]; holidays: Holiday[]; minPercent: number; sample: boolean; region: Region; hinglish: boolean }

export const SAMPLE_PEOPLE: Person[] = t.samplePeople.map((n, i) => ({ name: n, id: `E${String(i + 1).padStart(3, '0')}` }));

const DAY0 = 3, DAYS = 31, SUM0 = DAY0 + DAYS;           // first day column D, summary starts after day 31
export function buildAttendance(o: AttendanceOptions, now = new Date()): Book {
  const rows = o.people.length + o.spareRows, first = 6, last = first + rows - 1;
  const settings = labels.common.settingsName, summaryName = t.sheetSummary;
  const month = (i: number) => { const m0 = o.month - 1 + i; return { year: o.year + Math.floor(m0 / 12), month: (m0 % 12) + 1 }; };
  const names = Array.from({ length: o.months }, (_, i) => { const m = month(i); return safeSheetName(`${labels.common.months[m.month - 1]} ${m.year}`); });
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: t.legendInput, calc: t.legendCalc, sheets: labels.common.sheets, credit: '' }, sheets: [{ name: settings, about: t.aboutSettings }, { name: names[0]!, about: t.aboutMonth }, { name: summaryName, about: t.aboutSummary }], region: o.region });

  const s = new SheetBuilder(settings, C.orange); s.widths([22, 12, 3, 12, 22, 3, 3, 14, 30]);
  s.put('A1', t.settingsTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.settingsSub, S.subtitle).merge('A2:I2').height(1, 30);
  s.put('A3', t.org, S.label).put('B3', o.org, S.input()).merge('B3:E3');
  headerRow(s, 4, 0, [t.weekday, t.weekOff], 24);
  t.weekdays.forEach((w, i) => s.put([0, 5 + i], w, S.cell()).put([1, 5 + i], o.weekOff[i] ? t.yes : t.no, { ...S.input(), h: 'center' }));
  s.validate({ range: 'B6:B12', kind: 'list', list: [t.yes, t.no], title: t.weekOff, prompt: t.weekOffHelp });
  headerRow(s, 4, 3, [t.code, t.meaning], 24);
  [[t.codeP, t.meaningP], [t.codeA, t.meaningA], [t.codeL, t.meaningL], [t.codeHD, t.meaningHD]].forEach(([c, m], i) => s.put([3, 5 + i], c, { ...S.input(), h: 'center', bold: true }).put([4, 5 + i], m, S.cell()));
  s.put('D11', t.alertBelow, S.label).put('E11', o.minPercent / 100, S.input('0%', 'center'));
  headerRow(s, 4, 7, [t.holidayDate, t.holidayName], 24);
  for (let i = 0; i < 40; i += 1) { const h = o.holidays[i]; s.put([7, 5 + i], h?.date, S.input(o.region.date, 'center')).put([8, 5 + i], h?.name, S.input()); }
  s.validate({ range: 'H6:H45', kind: 'date', min: 36526, prompt: t.holidayHelp, title: t.holidayDate });
  s.validate({ range: 'E11', kind: 'decimal', min: 0, max: 1, prompt: t.alertHelp });
  s.put('H3', t.holidays, S.section).put('I3', undefined, S.section);
  s.put('D4', t.codes, S.section).put('E4', undefined, S.section);
  s.def.freeze = undefined;

  const monthSheets = names.map((name, mi) => {
    const m = month(mi), days = daysIn(m.year, m.month), b = new SheetBuilder(name, C.greenBar);
    b.def.landscape = true; b.def.freeze = { row: 5, col: 3 }; b.def.printTitles = '$3:$5'; b.def.zoom = 90;
    b.widths([4, 24, 9]); for (let d = 0; d < DAYS; d += 1) b.def.widths[DAY0 + d] = 3.6; b.widths([9, 8, 8, 8, 10], SUM0);
    b.put('A1', `=IF(${q(settings)}!$B$3="","${t.title}",${q(settings)}!$B$3&" - ${t.title}")`, { ...S.title, size: 16 }).height(0, 28);
    b.put('B2', serial(m.year, m.month, 1), { ...S.input('mmmm yyyy'), bold: true, size: 12, h: 'center' }).height(1, 22);
    b.put('D2', t.codes, { ...S.label, h: 'right', size: 9 }).merge('D2:E2');
    const fills = [[C.green, C.greenText], [C.red, C.redText], [C.amber, C.amberText], [C.soft, '9A3412']];
    [6, 7, 8, 9].forEach((row, i) => b.put([5 + i, 1], `=${q(settings)}!$D$${row}`, { bold: true, h: 'center', fill: fills[i]![0], color: fills[i]![1], border: 'all', size: 9 }));
    b.put('K2', t.alertBelow, { ...S.label, h: 'right', size: 9 }).merge('K2:N2').put('O2', `=${q(settings)}!$E$11`, { ...S.calc('0%', 'center'), size: 9 });
    headerRow(b, 3, 0, [t.colNo, t.colName, t.colId], 22);
    for (let d = 1; d <= DAYS; d += 1) {
      const c = colName(DAY0 + d - 1), dateF = d <= 28 ? `DATE(YEAR($B$2),MONTH($B$2),${d})` : `IF(DAY(DATE(YEAR($B$2),MONTH($B$2),${d}))=${d},DATE(YEAR($B$2),MONTH($B$2),${d}),"")`;
      b.put(`${c}4`, `=${dateF}`, { ...S.head, numFmt: 'd', size: 9 });
      b.put(`${c}3`, `=IF(${c}4="","",LEFT(TEXT(${c}4,"ddd"),1))`, { size: 8, color: C.muted, h: 'center' });
      b.put(`${c}5`, `=IF(${c}4="","",IF(OR(INDEX(${q(settings)}!$B$6:$B$12,WEEKDAY(${c}4,2))="${t.yes}",COUNTIF(${q(settings)}!$H$6:$H$45,${c}4)>0),0,1))`, { size: 8, color: C.muted, h: 'center' });
    }
    headerRow(b, 3, SUM0, [t.colWorking, t.colPresent, t.colAbsent, t.colLeave, t.colPercent], 22);
    b.put('B5', t.workingRow, { size: 8, color: C.muted, h: 'right' });
    const dc = colName(DAY0), de = colName(DAY0 + DAYS - 1), W = colName(SUM0), P = colName(SUM0 + 1), A = colName(SUM0 + 2), Lv = colName(SUM0 + 3), PC = colName(SUM0 + 4);
    for (let i = 0; i < rows; i += 1) {
      const r = first + i, person = o.people[i];
      b.put(`A${r}`, i + 1, { color: C.muted, h: 'center', border: 'all' });
      if (mi === 0) b.put(`B${r}`, person?.name, S.input()).put(`C${r}`, person?.id, S.input()); else b.put(`B${r}`, `=IF(${q(names[0]!)}!B${r}="","",${q(names[0]!)}!B${r})`, S.calc()).put(`C${r}`, `=IF(${q(names[0]!)}!C${r}="","",${q(names[0]!)}!C${r})`, S.calc());
      for (let d = 1; d <= DAYS; d += 1) {
        let code: string | undefined;
        if (o.sample && person && d <= days) {
          const date = serial(m.year, m.month, d), weekday = (new Date(Date.UTC(m.year, m.month - 1, d)).getUTCDay() + 6) % 7, off = o.weekOff[weekday] || o.holidays.some((h) => h.date === date);
          if (!off && date <= todaySerial(now)) { const k = (i * 7 + d * 3 + i * d) % 23; code = k === 4 ? t.codeA : k === 9 ? t.codeL : k === 15 ? t.codeHD : t.codeP; }
        }
        b.put([DAY0 + d - 1, r - 1], code, { ...S.cell(undefined, 'center'), input: true, size: 9 });
      }
      b.put(`${W}${r}`, `=IF($B${r}="","",SUM($${dc}$5:$${de}$5))`, S.calc('0', 'center'));
      b.put(`${P}${r}`, `=IF($B${r}="","",COUNTIF(${dc}${r}:${de}${r},$F$2)+0.5*COUNTIF(${dc}${r}:${de}${r},$I$2))`, S.calc('0.#', 'center'));
      b.put(`${A}${r}`, `=IF($B${r}="","",COUNTIF(${dc}${r}:${de}${r},$G$2)+0.5*COUNTIF(${dc}${r}:${de}${r},$I$2))`, S.calc('0.#', 'center'));
      b.put(`${Lv}${r}`, `=IF($B${r}="","",COUNTIF(${dc}${r}:${de}${r},$H$2))`, S.calc('0', 'center'));
      b.put(`${PC}${r}`, `=IF(OR($B${r}="",${W}${r}=0),"",${P}${r}/${W}${r})`, S.calc('0%', 'center'));
    }
    const tr = last + 1;
    b.put(`B${tr}`, t.presentEach, { bold: true, h: 'right', size: 9 });
    for (let d = 1; d <= DAYS; d += 1) { const c = colName(DAY0 + d - 1); b.put(`${c}${tr}`, `=IF(${c}4="","",COUNTIF(${c}${first}:${c}${last},$F$2)+0.5*COUNTIF(${c}${first}:${c}${last},$I$2))`, { ...S.calc('0.#', 'center'), size: 8 }); }
    const area = `${dc}${first}:${de}${last}`;
    b.rule({ range: area, formula: `${dc}${first}=$F$2`, fill: C.green, color: C.greenText, bold: true, stop: true });
    b.rule({ range: area, formula: `${dc}${first}=$G$2`, fill: C.red, color: C.redText, bold: true, stop: true });
    b.rule({ range: area, formula: `${dc}${first}=$H$2`, fill: C.amber, color: C.amberText, bold: true, stop: true });
    b.rule({ range: area, formula: `${dc}${first}=$I$2`, fill: C.soft, color: '9A3412', bold: true, stop: true });
    b.rule({ range: area, formula: `OR(${dc}$4="",${dc}$5=0)`, fill: C.weekend });
    b.rule({ range: `${dc}3:${de}3`, formula: `${dc}$5=0`, fill: C.weekend });
    b.rule({ range: `${PC}${first}:${PC}${last}`, formula: `AND(ISNUMBER(${PC}${first}),${PC}${first}<$O$2)`, fill: C.red, color: C.redText, bold: true });
    b.validate({ range: area, kind: 'list', listRef: `${q(settings)}!$D$6:$D$9`, title: t.code, prompt: t.cellHelp, error: t.cellError });
    return b;
  });

  const u = new SheetBuilder(summaryName, C.orange); u.def.landscape = true; u.def.freeze = { row: 3, col: 2 };
  u.widths([4, 24]); u.widths(names.map(() => 11), 2); const k = 2 + names.length; u.widths([11, 11, 9, 11], k);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  u.put('A2', t.alertBelow, { ...S.label, size: 9 }).merge('A2:B2').put('C2', `=${q(settings)}!$E$11`, S.calc('0%', 'center')).height(1, 20);
  headerRow(u, 2, 0, [t.colNo, t.colName], 28); names.forEach((n, i) => u.put([2 + i, 2], `${n}`, S.head));
  headerRow(u, 2, k, [t.totalPresent, t.totalWorking, t.colLeave, t.colPercent], 28);
  const P = colName(SUM0 + 1), W = colName(SUM0), Lv = colName(SUM0 + 3);
  for (let i = 0; i < rows; i += 1) {
    const r = first + i, sr = 4 + i;
    u.put(`A${sr}`, i + 1, { color: C.muted, h: 'center', border: 'all' }).put(`B${sr}`, `=IF(${q(names[0]!)}!B${r}="","",${q(names[0]!)}!B${r})`, S.calc());
    names.forEach((n, mi) => u.put([2 + mi, sr - 1], `=IF($B${sr}="","",${q(n)}!${P}${r})`, S.calc('0.#', 'center')));
    const sum = (col: string) => names.map((n) => `${q(n)}!${col}${r}`).join('+');
    u.put([k, sr - 1], `=IF($B${sr}="","",${sum(P)})`, S.calc('0.#', 'center'));
    u.put([k + 1, sr - 1], `=IF($B${sr}="","",${sum(W)})`, S.calc('0', 'center'));
    u.put([k + 2, sr - 1], `=IF($B${sr}="","",${sum(Lv)})`, S.calc('0', 'center'));
    u.put([k + 3, sr - 1], `=IF(OR($B${sr}="",${colName(k + 1)}${sr}=0),"",${colName(k)}${sr}/${colName(k + 1)}${sr})`, S.calc('0%', 'center'));
  }
  const pc = colName(k + 3);
  u.rule({ range: `${pc}4:${pc}${3 + rows}`, formula: `AND(ISNUMBER(${pc}4),${pc}4<$C$2)`, fill: C.red, color: C.redText, bold: true });

  book.sheets = [guide.def, s.def, ...monthSheets.map((b) => b.def), u.def];
  return book;
}
