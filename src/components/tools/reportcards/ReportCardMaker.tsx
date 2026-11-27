import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import ui from '../../../locales/packs/reportcards.ui.en.json';
import starters from '../../../locales/packs/reportcards.examples.en.json';
import '../shops/posterFonts.css';
import { compute, gradeFor, parseBands, parseMarks, type Parsed } from '../../../lib/reportcards/marks';
import { drawCard, drawRankPage, PAGE, rankPageCount, type CardOptions } from '../../../lib/reportcards/draw';
import { makeReportPdf, makeReportZip, resultsCsv } from '../../../lib/reportcards/make';
import { buttonClass, inputClass } from '../../common/styles';

const STORAGE_KEY = 'mdu_report_cards_v1';
const MAX_STUDENTS = 300;
type StarterId = 'halfyearly' | 'withpass' | 'grades' | 'ranks';
const STARTER_IDS: StarterId[] = ['halfyearly', 'withpass', 'grades', 'ranks'];
type OutputId = 'pdf' | 'zip';
interface Saved { school: string; exam: string; classLabel: string; bands: string; passOn: boolean; passMark: number; gradesOnly: boolean; showRank: boolean; rankList: boolean; cards: boolean; output: OutputId }
const DEFAULTS: Saved = { school: 'Sunrise Public School', exam: starters.halfyearly.exam, classLabel: '7 B', bands: starters.bands, passOn: false, passMark: 33, gradesOnly: false, showRank: true, rankList: true, cards: true, output: 'pdf' };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const SAMPLE = parseMarks(starters.sample)!;

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.school === 'string') return { ...DEFAULTS, ...raw };
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** Paste a class's marks and get a report card for each student and a rank list. Grade bands and the pass mark are yours. Everything happens on your device. */
export const ReportCardMaker: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const [table, setTable] = useState('');
  const [maxes, setMaxes] = useState<Record<string, string>>({});
  const [page, setPage] = useState<'card' | 'rank'>('card');
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [message, setMessage] = useState('');
  const [fontTick, setFontTick] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cancelled = useRef(false);
  const output = useResultFile();
  const sheet = useResultFile();

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { cancelled.current = true; }, []);
  useEffect(() => { let live = true; void Promise.all(['500 30px Poppins', '600 30px Poppins', '700 30px Poppins'].map((font) => document.fonts.load(font, 'AaBb'))).catch(() => undefined).then(() => { if (live) setFontTick((tick) => tick + 1); }); return () => { live = false; }; }, []);

  const parsed: Parsed | null = useMemo(() => (table.trim() ? parseMarks(table) : SAMPLE), [table]);
  const usingSample = !table.trim();
  const subjectKey = parsed ? parsed.subjects.join('|') : '';
  useEffect(() => { setMaxes({}); }, [subjectKey]);
  const max = useMemo(() => (parsed ? parsed.subjects.map((_, n) => { const typed = Number(maxes[n] ?? ''); return maxes[n] !== undefined && Number.isFinite(typed) && typed > 0 ? typed : parsed.max[n]!; }) : []), [parsed, maxes]);
  const bands = useMemo(() => parseBands(saved.bands), [saved.bands]);
  const students = useMemo(() => (parsed ? compute(parsed, max, bands, saved.passOn ? saved.passMark : 0) : []), [parsed, max, bands, saved.passOn, saved.passMark]);
  const options: (CardOptions & { students: typeof students }) | null = useMemo(() => (parsed ? { school: saved.school, exam: saved.exam, classLabel: saved.classLabel, subjects: parsed.subjects, max, gradesOnly: saved.gradesOnly, showPass: saved.passOn, showRank: saved.showRank, total: max.reduce((sum, value) => sum + value, 0), count: students.length, gradeOf: (percent: number) => gradeFor(percent, bands), labels: ui.labels, students } : null), [parsed, saved, max, bands, students]);
  const shown = Math.min(index, Math.max(0, students.length - 1));
  const pages = (saved.rankList ? rankPageCount(students.length) : 0) + (saved.cards ? students.length : 0);
  const tooMany = students.length > MAX_STUDENTS;

  useEffect(() => {
    const element = canvas.current; if (!element || !options || students.length === 0) return;
    const source = page === 'rank' ? drawRankPage(0, options) : drawCard(students[shown]!, options);
    const scale = 0.4; element.width = Math.round(PAGE.width * scale); element.height = Math.round(PAGE.height * scale);
    element.getContext('2d')!.drawImage(source, 0, 0, element.width, element.height);
  }, [options, students, shown, page, fontTick]);

  const change = (patch: Partial<Saved>) => { output.clear(); sheet.clear(); setMessage(''); setSaved((current) => ({ ...current, ...patch })); };
  const useStarter = (id: StarterId) => { const s = starters[id]; change({ exam: s.exam, gradesOnly: s.gradesOnly, passOn: s.showPass, showRank: s.showRank, rankList: s.rankList, cards: s.cards }); };
  const activeStarter = STARTER_IDS.find((id) => { const s = starters[id]; return s.gradesOnly === saved.gradesOnly && s.showPass === saved.passOn && s.showRank === saved.showRank && s.rankList === saved.rankList && s.cards === saved.cards; }) ?? '';
  const textField = (label: string, key: 'school' | 'exam' | 'classLabel', placeholder = '', maxLength = 80) => (
    <label className="block text-xs font-semibold text-slate-700">{label}<input type="text" value={saved[key]} maxLength={maxLength} placeholder={placeholder} onChange={(event) => change({ [key]: event.target.value } as Partial<Saved>)} className={inputClass} /></label>
  );

  const makeFile = async () => {
    if (!options || students.length === 0 || pages === 0 || tooMany) return;
    cancelled.current = false; setBusy(true); setDone(0); setMessage(''); output.clear();
    try {
      const job = { ...options, rankList: saved.rankList, cards: saved.cards, title: `${saved.exam || ui.labels.reportCard}` };
      const blob = await (saved.output === 'zip' ? makeReportZip : makeReportPdf)(job, setDone, () => cancelled.current);
      if (blob) output.set(blob, generateFileName('report-cards', saved.output === 'zip' ? 'zip' : 'pdf'), { key: saved.output, detail: ui.readyDetail.replace('{pages}', String(pages)).replace('{size}', formatBytes(blob.size)) });
    } catch { setMessage(ui.failed); } finally { setBusy(false); }
  };
  const makeCsv = () => { if (parsed) sheet.set(resultsCsv(students, parsed.subjects, max), generateFileName('results', 'csv'), { key: 'csv' }); };
  const startAgain = () => { cancelled.current = true; setTable(''); setIndex(0); setPage('card'); output.clear(); sheet.clear(); setMessage(''); setSaved(DEFAULTS); };

  const unreadable = table.trim() !== '' && parsed === null;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => useStarter(value as StarterId)} options={STARTER_IDS.map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? starters[activeStarter].hint : ui.startersHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.marks}</h2>
        <p className="text-[11px] text-slate-500">{ui.marksHint}</p>
        <textarea value={table} onChange={(event) => { output.clear(); sheet.clear(); setIndex(0); setTable(event.target.value); }} rows={8} disabled={busy} placeholder={ui.marksPlaceholder} aria-label={ui.marks} spellCheck={false}
          className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { output.clear(); setTable(starters.sample); setIndex(0); }} disabled={busy} className={buttonClass}>{ui.useSample}</button>
          {table && <button type="button" onClick={() => { output.clear(); setTable(''); setIndex(0); }} disabled={busy} className={buttonClass}>{ui.clear}</button>}
        </div>
        {unreadable && <Note>{ui.readFailed}</Note>}
        {parsed && <p className="text-xs font-semibold text-slate-800">{usingSample ? ui.sampleShown : ui.loaded.replace('{students}', String(students.length)).replace('{subjects}', String(parsed.subjects.length))}</p>}
        {parsed && !usingSample && (
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.maxTitle}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{parsed.subjects.map((subject, n) => (
              <label key={`${subject}${n}`} className="block text-[11px] font-semibold text-slate-700">{subject}
                <input type="number" min={1} value={maxes[n] ?? String(parsed.max[n])} onChange={(event) => { output.clear(); setMaxes((current) => ({ ...current, [n]: event.target.value })); }} className={inputClass} /></label>))}</div>
            <p className="mt-1 text-[11px] text-slate-500">{ui.maxHint}</p></div>
        )}
        {tooMany && <Note>{ui.tooMany.replace('{max}', String(MAX_STUDENTS))}</Note>}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.wording}</h2>
        {textField(ui.school, 'school', ui.schoolPlaceholder, 70)}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{textField(ui.exam, 'exam', '', 60)}{textField(ui.classLabel, 'classLabel', ui.classPlaceholder, 30)}</div>
      </section>

      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 space-y-2">
          <ChoiceButtons label={ui.preview} value={page} onChange={(value) => setPage(value as 'card' | 'rank')} options={names(ui.previewPages)} />
          {page === 'card' && students.length > 1 && (
            <div className="flex items-center justify-between gap-2">
              <button type="button" aria-label={ui.previous} onClick={() => setIndex(Math.max(0, shown - 1))} disabled={shown === 0} className={`${buttonClass} !px-3`}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
              <p className="text-xs font-semibold text-slate-700">{ui.student.replace('{n}', String(shown + 1)).replace('{total}', String(students.length))}</p>
              <button type="button" aria-label={ui.next} onClick={() => setIndex(Math.min(students.length - 1, shown + 1))} disabled={shown >= students.length - 1} className={`${buttonClass} !px-3`}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          )}
          <div className="flex justify-center rounded-xl bg-slate-200 p-2"><canvas ref={canvas} role="img" aria-label={ui.previewLabel} className="h-auto w-full max-w-md rounded bg-white shadow" style={{ aspectRatio: `${PAGE.width} / ${PAGE.height}` }} /></div>
        </div>
      </section>

      <section className={card}>
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
          <div className="mt-3 space-y-3">
            <div><label className="block text-xs font-semibold text-slate-700">{ui.bands}
              <textarea value={saved.bands} onChange={(event) => change({ bands: event.target.value })} rows={7} spellCheck={false} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" /></label>
              <p className="mt-1 text-[11px] text-slate-500">{ui.bandsHint}</p></div>
            <Toggle label={ui.passOn} hint={ui.passHint} checked={saved.passOn} onChange={(value) => change({ passOn: value })} />
            {saved.passOn && <label className="block text-xs font-semibold text-slate-700">{ui.passMark}<input type="number" min={1} max={100} value={saved.passMark} onChange={(event) => change({ passMark: Math.max(1, Math.min(100, Number(event.target.value) || 1)) })} className={inputClass} /></label>}
            <Toggle label={ui.gradesOnly} checked={saved.gradesOnly} onChange={(value) => change({ gradesOnly: value })} />
            <Toggle label={ui.rankOn} checked={saved.showRank} onChange={(value) => change({ showRank: value })} />
            <Toggle label={ui.rankListOn} checked={saved.rankList} onChange={(value) => change({ rankList: value })} />
            <Toggle label={ui.cardsOn} checked={saved.cards} onChange={(value) => change({ cards: value })} />
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.output}</p><ChoiceButtons label={ui.output} value={saved.output} onChange={(value) => change({ output: value as OutputId })} options={names(ui.outputs)} /><p className="mt-1 text-[11px] text-slate-500">{ui.outputHint}</p></div>
          </div>
        </details>
      </section>

      <section className={`${card} space-y-3`}>
        {pages === 0 && <Note>{ui.nothing}</Note>}
        {busy && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round((done / Math.max(1, saved.output === 'zip' ? students.length : pages)) * 100)}%` }} /></div><p className="text-xs text-slate-700">{ui.making.replace('{done}', String(done)).replace('{total}', String(saved.output === 'zip' ? students.length : pages))} {ui.keepOpen}</p></>}
        {busy
          ? <button type="button" onClick={() => { cancelled.current = true; }} className={`${buttonClass} w-full`}>{ui.cancel}</button>
          : <MainActionButton onClick={() => void makeFile()} disabled={students.length === 0 || pages === 0 || tooMany}><FileText className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
        {message && <Note>{message}</Note>}
        {output.result && (<div className="space-y-2"><SaveResult href={output.result.url} name={output.result.name} label={ui.ready} saveLabel={output.result.key === 'zip' ? ui.saveZip : ui.savePdf} detail={output.result.detail} /><p className="text-[11px] text-slate-500">{ui.notSelectable}</p></div>)}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={makeCsv} disabled={busy || students.length === 0} className={buttonClass}>{ui.csv}</button>
          <ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={busy} />
        </div>
        {sheet.result && <SaveResult href={sheet.result.url} name={sheet.result.name} label={ui.csv} saveLabel={ui.saveCsv} />}
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default ReportCardMaker;
