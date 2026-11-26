import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { FileDropZone } from '../../common/FileDropZone';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { ConfirmButton } from '../shared/ConfirmButton';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import { LETTERS, sheetLayout, type SheetLayout } from '../../../lib/omr/layout';
import { drawSheet, makeSheetPdf, type SheetText } from '../../../lib/omr/sheet';
import { decide, rollFrom, scanSheet, type Scan, type SensitivityId } from '../../../lib/omr/scan';
import { gradeSheet, parseKey, type Graded } from '../../../lib/omr/grade';
import { makeSamplePhotos } from '../../../lib/omr/sample';
import { toCsv, toXlsx } from '../../../lib/pdftable/write';
import type { Cell } from '../../../lib/pdftable/grid';
import ui from '../../../locales/packs/omrgrader.ui.en.json';
import starters from '../../../locales/packs/omrgrader.examples.en.json';
import '../shops/posterFonts.css';

const STORAGE_KEY = 'mdu_omr_grader_v1';
const MAX_PHOTOS = 200, SCAN_SIZE = 1800, THUMB_SIZE = 900;
type StarterId = 'q10' | 'q20' | 'q50' | 'q100';
const STARTER_IDS: StarterId[] = ['q10', 'q20', 'q50', 'q100'];
type OutputId = 'xlsx' | 'csv';
interface Saved { questions: number; options: 4 | 5; digits: number; title: string; exam: string; copies: number; perRight: number; perWrong: number; sensitivity: SensitivityId; includeAnswers: boolean; output: OutputId }
const DEFAULTS: Saved = { questions: 20, options: 4, digits: 3, title: ui.sheetTitleDefault, exam: '', copies: 1, perRight: 1, perWrong: 0, sensitivity: 'normal', includeAnswers: true, output: 'xlsx' };
interface Entry { id: number; name: string; scan: Scan; thumb: Blob | null; thumbScale: number; roll: string | null }
const inputClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, Number.isFinite(value) ? value : low));

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.questions === 'number') return { ...DEFAULTS, ...raw, options: raw.options === 5 ? 5 : 4 };
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

async function openBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* older browsers */ }
  const url = URL.createObjectURL(file);
  try { const img = new Image(); img.src = url; await img.decode(); return img; } finally { setTimeout(() => URL.revokeObjectURL(url), 5000); }
}

/** Reads one photo: finds the sheet, reads every bubble, and keeps a small copy for showing the result. */
async function readPhoto(file: File, layout: SheetLayout, id: number): Promise<Entry> {
  const bitmap = await openBitmap(file), width = 'naturalWidth' in bitmap ? bitmap.naturalWidth : bitmap.width, height = 'naturalHeight' in bitmap ? bitmap.naturalHeight : bitmap.height;
  const k = Math.min(1, SCAN_SIZE / Math.max(width, height)), canvas = document.createElement('canvas'); canvas.width = Math.round(width * k); canvas.height = Math.round(height * k);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if ('close' in bitmap) bitmap.close();
  const scan = scanSheet(ctx.getImageData(0, 0, canvas.width, canvas.height), layout, 'normal');
  const t = Math.min(1, THUMB_SIZE / Math.max(canvas.width, canvas.height)), small = document.createElement('canvas'); small.width = Math.round(canvas.width * t); small.height = Math.round(canvas.height * t);
  small.getContext('2d')!.drawImage(canvas, 0, 0, small.width, small.height);
  const thumb = await new Promise<Blob | null>((resolve) => small.toBlob(resolve, 'image/jpeg', 0.7));
  canvas.width = 1; canvas.height = 1;
  return { id, name: file.name, scan, thumb, thumbScale: t, roll: null };
}

const ring = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, width: number) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); };

/** The photo with the marking drawn on it. */
const Thumb: React.FC<{ entry: Entry; verdict: Graded['verdict'] | null; key2: number[]; marks: ReturnType<typeof decide>[]; big: boolean; onToggle: () => void }> = ({ entry, verdict, key2, marks, big, onToggle }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      if (!entry.thumb || !ref.current) return;
      const bitmap = await createImageBitmap(entry.thumb); if (!live || !ref.current) return;
      const canvas = ref.current; canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(bitmap, 0, 0); bitmap.close();
      const s = entry.thumbScale, r = entry.scan.radius * s, line = Math.max(1.5, r * 0.45);
      entry.scan.answerPoints.forEach((row, q) => {
        const v = verdict?.[q], mark = marks[q];
        if (!v || v === 'nokey' || !mark) return;
        const right = key2[q]!;
        if (v === 'right') ring(ctx, row[right]!.x * s, row[right]!.y * s, r * 1.25, '#16a34a', line);
        else {
          ring(ctx, row[right]!.x * s, row[right]!.y * s, r * 1.25, '#ea580c', line);
          if (v === 'wrong') ring(ctx, row[mark.chosen]!.x * s, row[mark.chosen]!.y * s, r * 1.25, '#dc2626', line);
          if (v === 'multiple') mark.scores.forEach((score, o) => { if (score >= 0.25) ring(ctx, row[o]!.x * s, row[o]!.y * s, r * 1.25, '#dc2626', line); });
        }
      });
    })();
    return () => { live = false; };
  }, [entry, verdict, key2, marks]);
  return (
    <button type="button" onClick={onToggle} aria-label={big ? ui.smaller : ui.bigger} className={`block overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ${big ? 'w-full' : 'w-28 shrink-0 sm:w-40'}`}>
      <canvas ref={ref} className="block h-auto w-full" />
    </button>
  );
};

/** Print answer sheets, then photograph the filled ones and get the roll number and marks of every student. Everything happens on your device. */
export const OmrGrader: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const [keyText, setKeyText] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [reading, setReading] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState('');
  const [bigId, setBigId] = useState<number | null>(null);
  const [making, setMaking] = useState(0);
  const [fontTick, setFontTick] = useState(0);
  const preview = useRef<HTMLCanvasElement>(null);
  const cancelled = useRef(false);
  const nextId = useRef(1);
  const sheetPdf = useResultFile();
  const results = useResultFile();

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { cancelled.current = true; }, []);
  useEffect(() => { let live = true; void Promise.all(['400 30px Poppins', '500 30px Poppins', '600 30px Poppins', '700 30px Poppins'].map((font) => document.fonts.load(font, 'AaBb1'))).catch(() => undefined).then(() => { if (live) setFontTick((tick) => tick + 1); }); return () => { live = false; }; }, []);

  const layout = useMemo(() => sheetLayout({ questions: saved.questions, options: saved.options, digits: saved.digits }), [saved.questions, saved.options, saved.digits]);
  const sheetText: SheetText = useMemo(() => ({ title: saved.title.trim() || ui.sheetTitleDefault, exam: saved.exam.trim(), labels: ui.sheet }), [saved.title, saved.exam]);
  const key = useMemo(() => parseKey(keyText, layout.questions, layout.options), [keyText, layout]);
  const keyCount = key.filter((o) => o >= 0).length;

  useEffect(() => {
    const canvas = preview.current; if (!canvas) return;
    const source = drawSheet(layout, sheetText, undefined, 2); canvas.width = source.width; canvas.height = source.height; canvas.getContext('2d')!.drawImage(source, 0, 0);
  }, [layout, sheetText, fontTick]);

  const rows = useMemo(() => entries.map((entry) => {
    const marks = entry.scan.found ? entry.scan.answerScores.map((scores) => decide(scores, saved.sensitivity)) : [];
    const roll = entry.roll ?? (entry.scan.found ? rollFrom(entry.scan.rollScores, saved.sensitivity) : '');
    const graded = entry.scan.found && keyCount > 0 ? gradeSheet(marks, key, { perRight: saved.perRight, perWrong: saved.perWrong }) : null;
    return { entry, marks, roll, graded };
  }), [entries, saved.sensitivity, saved.perRight, saved.perWrong, key, keyCount]);
  const rollCounts = useMemo(() => { const map = new Map<string, number>(); rows.forEach((r) => { if (r.roll && !r.roll.includes('?')) map.set(r.roll, (map.get(r.roll) ?? 0) + 1); }); return map; }, [rows]);

  const change = (patch: Partial<Saved>, reshape = false) => {
    sheetPdf.clear(); results.clear(); setMessage('');
    if (reshape && entries.length) { setEntries([]); setBigId(null); setMessage(ui.sheetChanged); }
    setSaved((current) => ({ ...current, ...patch }));
  };
  const pickStarter = (id: StarterId) => { const s = starters[id]; change({ questions: s.questions, options: s.options as 4 | 5, digits: s.digits }, true); };
  const activeStarter = STARTER_IDS.find((id) => starters[id].questions === saved.questions && starters[id].options === saved.options && starters[id].digits === saved.digits) ?? '';

  const readFiles = async (files: File[]) => {
    cancelled.current = false; results.clear(); setMessage('');
    const list = files.filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic)$/i.test(f.name)).slice(0, Math.max(0, MAX_PHOTOS - entries.length));
    if (files.length > list.length && entries.length + list.length >= MAX_PHOTOS) setMessage(ui.tooMany.replace('{max}', String(MAX_PHOTOS)));
    for (const [n, file] of list.entries()) {
      if (cancelled.current) break;
      setReading({ done: n, total: list.length });
      try { const entry = await readPhoto(file, layout, nextId.current++); setEntries((current) => [...current, entry]); } catch { setMessage(ui.failed); }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    setReading(null);
  };
  const trySample = async () => {
    cancelled.current = true; await new Promise((resolve) => setTimeout(resolve, 0));
    const sample = await makeSamplePhotos(layout, sheetText); setKeyText(sample.key); setEntries([]); setBigId(null); void readFiles(sample.files);
  };
  const savePdf = async () => {
    cancelled.current = false; setMaking(1); sheetPdf.clear();
    try { const blob = await makeSheetPdf(layout, sheetText, clamp(saved.copies, 1, 200), (done) => setMaking(done + 1), () => cancelled.current); if (blob) sheetPdf.set(blob, generateFileName('answer-sheet', 'pdf'), { key: 'pdf', detail: formatBytes(blob.size) }); } catch { setMessage(ui.failed); } finally { setMaking(0); }
  };
  const saveResults = async () => {
    const head: Cell[] = [ui.columns.roll, ui.columns.photo, ...(rows.some((r) => r.graded) ? [ui.columns.right, ui.columns.wrong, ui.columns.blank, ui.columns.multiple, ui.columns.score, ui.columns.total, ui.columns.percent] : [])];
    if (saved.includeAnswers) for (let q = 1; q <= layout.questions; q += 1) head.push(`Q${q}`);
    const sorted = [...rows].filter((r) => r.entry.scan.found).sort((a, b) => a.roll.localeCompare(b.roll, undefined, { numeric: true }));
    const body: Cell[][] = sorted.map((r) => {
      const asNumber = /^\d+$/.test(r.roll) ? Number(r.roll) : r.roll, line: Cell[] = [asNumber, r.entry.name];
      if (r.graded) line.push(r.graded.right, r.graded.wrong, r.graded.blank, r.graded.multiple, r.graded.score, r.graded.total, r.graded.percent);
      else if (rows.some((x) => x.graded)) line.push('', '', '', '', '', '', '');
      if (saved.includeAnswers) r.marks.forEach((m) => line.push(m.multiple ? '*' : m.chosen >= 0 ? LETTERS[m.chosen]! : '-'));
      return line;
    });
    const blob = saved.output === 'xlsx' ? await toXlsx([{ name: 'Marks', rows: [head, ...body] }]) : toCsv([{ name: 'Marks', rows: [head, ...body] }]);
    results.set(blob, generateFileName('omr-marks', saved.output), { key: saved.output, detail: formatBytes(blob.size) });
  };
  const startAgain = () => { cancelled.current = true; setEntries([]); setKeyText(''); setBigId(null); setMessage(''); sheetPdf.clear(); results.clear(); setSaved(DEFAULTS); };

  const read = rows.filter((r) => r.entry.scan.found), graded = read.filter((r) => r.graded);
  const average = graded.length ? Math.round((graded.reduce((sum, r) => sum + r.graded!.percent, 0) / graded.length) * 10) / 10 : 0;
  const numberField = (label: string, value: number, onChange: (value: number) => void, min: number, max: number, step = 1, hint = '') => (
    <label className="block text-xs font-semibold text-slate-700">{label}<input type="number" inputMode="decimal" min={min} max={max} step={step} value={value} onChange={(event) => onChange(clamp(Number(event.target.value), min, max))} className={inputClass} />{hint && <span className="mt-1 block text-[11px] font-normal text-slate-500">{hint}</span>}</label>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => pickStarter(value as StarterId)} options={STARTER_IDS.map((id) => ({ value: id, label: starters[id].label }))} />
        <p className="text-[11px] text-slate-500">{activeStarter ? starters[activeStarter].hint : ui.startersHint}</p>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.printTitle}</h2>
        <p className="text-[11px] text-slate-500">{ui.printHint}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">{ui.sheetTitle}<input type="text" maxLength={40} value={saved.title} onChange={(event) => change({ title: event.target.value })} className={inputClass} /></label>
          <label className="block text-xs font-semibold text-slate-700">{ui.exam}<input type="text" maxLength={60} value={saved.exam} placeholder={ui.examPlaceholder} onChange={(event) => change({ exam: event.target.value })} className={inputClass} /></label>
        </div>
        <div className="flex justify-center rounded-xl bg-slate-200 p-2"><canvas ref={preview} role="img" aria-label={ui.previewLabel} className="h-auto w-full max-w-xs rounded bg-white shadow" style={{ aspectRatio: '210 / 297' }} /></div>
        <MainActionButton onClick={() => void savePdf()} disabled={making > 0}><ScanLine className="h-5 w-5" aria-hidden="true" />{making > 0 ? ui.makingPdf.replace('{done}', String(making)).replace('{total}', String(clamp(saved.copies, 1, 200))) : ui.savePdf}</MainActionButton>
        {sheetPdf.result && <SaveResult href={sheetPdf.result.url} name={sheetPdf.result.name} label={ui.pdfReady} saveLabel={ui.savePdfButton} detail={sheetPdf.result.detail} />}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.keyTitle}</h2>
        <p className="text-[11px] text-slate-500">{ui.keyHint}</p>
        <textarea value={keyText} onChange={(event) => { results.clear(); setKeyText(event.target.value); }} rows={3} spellCheck={false} aria-label={ui.keyTitle} placeholder={ui.keyPlaceholder} className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm uppercase text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        <p className="text-xs font-semibold text-slate-800">{ui.keyCount.replace('{count}', String(keyCount)).replace('{total}', String(layout.questions))}</p>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.photosTitle}</h2>
        <p className="text-[11px] text-slate-500">{ui.photosHint}</p>
        <FileDropZone accept="image/*" multiple onFiles={(files) => void readFiles(files)} />
        <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => void trySample()} disabled={!!reading} className={buttonClass}>{ui.trySample}</button><span className="text-[11px] text-slate-500">{ui.sampleNote}</span></div>
        {reading && (<div className="space-y-1"><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round((reading.done / Math.max(1, reading.total)) * 100)}%` }} /></div><div className="flex items-center justify-between gap-2"><p className="text-xs text-slate-700">{ui.reading.replace('{done}', String(reading.done + 1)).replace('{total}', String(reading.total))}</p><button type="button" onClick={() => { cancelled.current = true; }} className="text-xs font-bold text-slate-700 underline">{ui.stop}</button></div></div>)}
        {message && <Note>{message}</Note>}
        {entries.length > 0 && keyCount === 0 && <Note>{ui.noKey}</Note>}
        {entries.length > 0 && <p className="text-[11px] text-slate-500">{ui.legend}</p>}
        <ul className="space-y-3">
          {rows.map(({ entry, marks, roll, graded }) => {
            const big = bigId === entry.id, dup = roll && !roll.includes('?') && (rollCounts.get(roll) ?? 0) > 1;
            return (
              <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className={big ? 'space-y-2' : 'flex gap-3'}>
                  {entry.scan.found
                    ? <Thumb entry={entry} verdict={graded?.verdict ?? null} key2={key} marks={marks} big={big} onToggle={() => setBigId(big ? null : entry.id)} />
                    : null}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="truncate text-xs text-slate-500">{entry.name}</p>
                    {!entry.scan.found && <Note>{entry.scan.reason === 'shape' ? ui.failShape : ui.failMarkers}</Note>}
                    {entry.scan.found && (
                      <>
                        <label className="block text-xs font-semibold text-slate-700">{ui.rollLabel}<input type="text" inputMode="numeric" maxLength={8} value={roll} onChange={(event) => { results.clear(); setEntries((current) => current.map((e) => (e.id === entry.id ? { ...e, roll: event.target.value } : e))); }} className={`${inputClass} max-w-[10rem]`} /></label>
                        {roll.includes('?') && <p className="text-[11px] font-semibold text-red-700">{ui.rollFix}</p>}
                        {dup && <p className="text-[11px] font-semibold text-red-700">{ui.rollSame}</p>}
                        {graded && (<><p className="text-sm font-bold text-slate-900">{ui.scoreLine.replace('{score}', String(graded.score)).replace('{total}', String(graded.total)).replace('{percent}', String(graded.percent))}</p><p className="text-[11px] text-slate-600">{ui.countsLine.replace('{right}', String(graded.right)).replace('{wrong}', String(graded.wrong)).replace('{blank}', String(graded.blank)).replace('{multiple}', String(graded.multiple))}</p></>)}
                      </>
                    )}
                    <button type="button" onClick={() => { results.clear(); setEntries((current) => current.filter((e) => e.id !== entry.id)); }} className="text-xs font-bold text-slate-700 underline">{ui.remove}</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={card}>
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {numberField(ui.questions, saved.questions, (value) => change({ questions: Math.round(value) }, true), 1, 100)}
              {numberField(ui.digits, saved.digits, (value) => change({ digits: Math.round(value) }, true), 2, 5)}
            </div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.options}</p><ChoiceButtons label={ui.options} value={String(saved.options)} onChange={(value) => change({ options: value === '5' ? 5 : 4 }, true)} options={[{ value: '4', label: ui.optionChoices['4'] }, { value: '5', label: ui.optionChoices['5'] }]} /></div>
            {numberField(ui.copies, saved.copies, (value) => change({ copies: Math.round(value) }), 1, 200)}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {numberField(ui.perRight, saved.perRight, (value) => change({ perRight: value }), 0.25, 20, 0.25)}
              {numberField(ui.perWrong, saved.perWrong, (value) => change({ perWrong: value }), 0, 20, 0.05)}
            </div>
            <p className="text-[11px] text-slate-500">{ui.perWrongHint}</p>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.sensitivity}</p><ChoiceButtons label={ui.sensitivity} value={saved.sensitivity} onChange={(value) => change({ sensitivity: value as SensitivityId })} options={[{ value: 'normal', label: ui.sensitivities.normal }, { value: 'light', label: ui.sensitivities.light }, { value: 'dark', label: ui.sensitivities.dark }]} /><p className="mt-1 text-[11px] text-slate-500">{ui.sensitivityHint}</p></div>
            <Toggle label={ui.includeAnswers} checked={saved.includeAnswers} onChange={(value) => change({ includeAnswers: value })} />
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.output}</p><ChoiceButtons label={ui.output} value={saved.output} onChange={(value) => change({ output: value as OutputId })} options={[{ value: 'xlsx', label: ui.outputs.xlsx }, { value: 'csv', label: ui.outputs.csv }]} /></div>
          </div>
        </details>
      </section>

      <section className={`${card} space-y-3`}>
        {read.length > 0 && graded.length > 0 && <p className="text-xs font-semibold text-slate-800">{ui.summary.replace('{sheets}', String(read.length)).replace('{average}', String(average))}</p>}
        <MainActionButton onClick={() => void saveResults()} disabled={read.length === 0}>{ui.saveResults.replace('{type}', saved.output === 'xlsx' ? 'Excel' : 'CSV')}</MainActionButton>
        {results.result && <SaveResult href={results.result.url} name={results.result.name} label={ui.resultsReady} saveLabel={results.result.key === 'csv' ? ui.saveCsv : ui.saveXlsx} detail={results.result.detail} />}
        <ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} />
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default OmrGrader;
