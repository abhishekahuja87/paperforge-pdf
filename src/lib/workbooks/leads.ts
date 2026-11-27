/** Enquiry and lead tracker workbook: every enquiry with its source, value and stage, the next follow-up date, who is overdue, a WhatsApp link, and counts by stage and source. */
import { SheetBuilder, todaySerial, type Book } from '../xlsx/model';
import { C, S, headerRow, startHere, q } from './common';
import { fillTemplate, linkText, listSheet, settingsSheet, statusRules, whatsappNumber } from './kit';
import { parseAmount } from './dates';
import { moneyFormat, type Region } from './region';
import T from '../../locales/packs/workbooks.more2.text.en.json';

const t = T.leads.sheet;
export interface LeadsOptions { business: string; rows: Record<string, string>[]; sources: string[]; spare: number; message: string; sample: boolean; region: Region; hinglish: boolean }
const SRC = 8;

export function buildLeads(o: LeadsOptions, now = new Date()): Book {
  const money = moneyFormat(o.region), N = T.common, cap = Math.min(500, Math.max(1, o.rows.length + o.spare)), first = 4, last = 3 + cap, today = todaySerial(now);
  const [sNew, sContacted, sQuote, sWon, sLost] = t.stages as [string, string, string, string, string];
  const book: Book = { sheets: [], paper: o.region.paper, warnings: [] };
  const guide = startHere({ title: t.title, intro: t.intro, steps: o.hinglish ? t.guideHi : t.guide, hinglish: o.hinglish, legend: { input: N.legendInput, calc: N.legendCalc, sheets: N.sheets, credit: '' }, sheets: [t.sheetSettings, t.sheetLists, t.sheetLeads, t.sheetSummary].map((name, i) => ({ name, about: t.about[i]! })), region: o.region });
  const { sheet: settings, at: S0 } = settingsSheet(t.sheetSettings, t.sheetSettings, [[t.business, o.business], [t.asOf, '=TODAY()', o.region.date], [t.code, o.region.code], [t.message, o.message]], t.settingsHelp);
  settings.height(5, 64);
  const business = S0(0), asOf = S0(1), code = S0(2), msg = S0(3);

  const lists = new SheetBuilder(t.sheetLists, C.orange); lists.widths([30, 22]); lists.def.freeze = { row: 3, col: 0 };
  lists.put('A1', t.listsTitle, { ...S.title, size: 16 }).height(0, 28).put('A2', t.listsSub, S.subtitle).merge('A2:B2').height(1, 30);
  headerRow(lists, 2, 0, [t.colSource, t.colStage], 32);
  for (let i = 0; i < SRC; i += 1) { lists.put([0, 3 + i], o.sources[i], S.input()); lists.put([1, 3 + i], t.stages[i], i < 5 ? S.calc() : { fill: C.weekend, border: 'all', borderColor: 'E2E8F0' }); }
  const Ls = `${q(t.sheetLists)}!$A$4:$A$${3 + SRC}`, Lg = `${q(t.sheetLists)}!$B$4:$B$8`;

  const sample = o.sample ? o.rows.map((r, i) => { const s = T.leads.sample.leads[i % T.leads.sample.leads.length]!; return [today - s.ago, r.name, r.phone, r.source || o.sources[i % Math.max(1, o.sources.length)], r.interest, parseAmount(r.value ?? '') ?? undefined, s.stage, s.follow === null ? undefined : today + s.follow]; }) : o.rows.map((r) => [undefined, r.name, r.phone, r.source, r.interest, parseAmount(r.value ?? '') ?? undefined, r.name ? sNew : undefined]);
  const leads = listSheet(t.sheetLeads, t.leadsTitle, t.leadsSub, [{ head: t.colDate, width: 12, fmt: o.region.date, align: 'center' }, { head: t.colName, width: 24 }, { head: t.colPhone, width: 15 }, { head: t.colSource, width: 16 }, { head: t.colInterest, width: 26 }, { head: t.colValue, width: 13, fmt: money }, { head: t.colStage, width: 13 }, { head: t.colNext, width: 13, fmt: o.region.date, align: 'center' }, { head: t.colLeft, width: 10, fmt: '0', align: 'center' }, { head: t.colFollow, width: 13 }, { head: t.colChat, width: 10 }], sample, cap);
  for (let r = first; r <= last; r += 1) {
    const closed = `OR(G${r}="${sWon}",G${r}="${sLost}")`;
    leads.put(`I${r}`, `=IF(OR(B${r}="",H${r}="",${closed}),"",H${r}-${asOf})`, S.calc('0', 'center'));
    leads.put(`J${r}`, `=IF(B${r}="","",IF(${closed},"",IF(H${r}="","${t.setDate}",IF(H${r}<${asOf},"${t.overdue}",IF(H${r}=${asOf},"${t.today}","${t.upcoming}")))))`, S.calc(undefined, 'center'));
    const filled = fillTemplate(msg, [['{name}', `B${r}`], ['{business}', business]]);
    leads.put(`K${r}`, `=IF(OR(B${r}="",C${r}=""),"",HYPERLINK("https://wa.me/"&${whatsappNumber(`C${r}`, code)}&"?text="&${linkText(filled)},"${t.chat}"))`, { ...S.calc(undefined, 'center'), color: C.ink, underline: true, bold: true });
  }
  leads.validate({ range: `D${first}:D${last}`, kind: 'list', listRef: Ls, soft: true, title: t.colSource, prompt: t.sourceHelp });
  leads.validate({ range: `G${first}:G${last}`, kind: 'list', listRef: Lg, title: t.colStage, prompt: t.stageHelp });
  leads.validate({ range: `F${first}:F${last}`, kind: 'decimal', min: 0 });
  leads.def.filter = `A3:K${last}`;
  statusRules(leads, `J${first}:J${last}`, `$J${first}`, { warn: t.today, bad: t.overdue });
  statusRules(leads, `G${first}:G${last}`, `$G${first}`, { good: sWon });

  const Le = (col: string) => `${q(t.sheetLeads)}!$${col}$${first}:$${col}$${last}`;
  const u = new SheetBuilder(t.sheetSummary, C.greenBar); u.widths([30, 14, 16, 4, 20, 12, 12, 12]);
  u.put('A1', t.summaryTitle, { ...S.title, size: 16 }).height(0, 28);
  const open = `(COUNTIF(${Le('G')},"${sNew}")+COUNTIF(${Le('G')},"${sContacted}")+COUNTIF(${Le('G')},"${sQuote}"))`;
  const openVal = [sNew, sContacted, sQuote].map((s) => `SUMIF(${Le('G')},"${s}",${Le('F')})`).join('+');
  const kpis: [string, string, string][] = [[t.kpiLeads, `=COUNTA(${Le('B')})`, '0'], [t.kpiOpen, `=${open}`, '0'], [t.kpiOpenValue, `=${openVal}`, money], [t.kpiWonValue, `=SUMIF(${Le('G')},"${sWon}",${Le('F')})`, money], [t.kpiWinRate, `=IF(COUNTIF(${Le('G')},"${sWon}")+COUNTIF(${Le('G')},"${sLost}")=0,"",COUNTIF(${Le('G')},"${sWon}")/(COUNTIF(${Le('G')},"${sWon}")+COUNTIF(${Le('G')},"${sLost}")))`, '0%'], [t.kpiOverdue, `=COUNTIF(${Le('J')},"${t.overdue}")`, '0'], [t.kpiToday, `=COUNTIF(${Le('J')},"${t.today}")`, '0']];
  kpis.forEach(([name, f, fmt], i) => u.put([0, 2 + i], name, S.label).put([1, 2 + i], f, { ...S.calc(fmt, 'right'), bold: true }));
  headerRow(u, 10, 0, [t.colStage, t.colCount, t.colValue], 30);
  t.stages.forEach((s, i) => { u.put([0, 11 + i], s, S.calc()).put([1, 11 + i], `=COUNTIF(${Le('G')},A${12 + i})`, S.calc('0', 'center')).put([2, 11 + i], `=SUMIF(${Le('G')},A${12 + i},${Le('F')})`, S.calc(money)); });
  headerRow(u, 10, 4, [t.colSource, t.colCount, t.colWon], 30);
  for (let i = 0; i < SRC; i += 1) { u.put([4, 11 + i], `=IF(${q(t.sheetLists)}!A${4 + i}="","",${q(t.sheetLists)}!A${4 + i})`, S.calc()).put([5, 11 + i], `=IF(E${12 + i}="","",COUNTIF(${Le('D')},E${12 + i}))`, S.calc('0', 'center')).put([6, 11 + i], `=IF(E${12 + i}="","",COUNTIFS(${Le('D')},E${12 + i},${Le('G')},"${sWon}"))`, S.calc('0', 'center')); }
  u.chart({ kind: 'col', title: t.chartStage, cats: `${q(t.sheetSummary)}!$A$12:$A$16`, series: [{ name: t.colCount, vals: `${q(t.sheetSummary)}!$B$12:$B$16`, color: C.orange }], at: { col: 0, row: 19, cols: 4, rows: 15 } });
  u.chart({ kind: 'col', title: t.chartSource, cats: `${q(t.sheetSummary)}!$E$12:$E$${11 + Math.max(2, Math.min(SRC, o.sources.length))}`, series: [{ name: t.colCount, vals: `${q(t.sheetSummary)}!$F$12:$F$${11 + Math.max(2, Math.min(SRC, o.sources.length))}`, color: C.orange }], at: { col: 4, row: 19, cols: 4, rows: 15 } });
  book.sheets = [guide.def, settings.def, lists.def, leads.def, u.def];
  return book;
}
