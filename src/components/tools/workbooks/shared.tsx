import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import { computeBook, formatText, isErr, type Val } from '../../../lib/xlsx/formula';
import { colIndex, ref as cellRef, type Book, type SheetDef } from '../../../lib/xlsx/model';
import { buildXlsx } from '../../../lib/xlsx/write';
import { REGIONS, REGION_IDS, guessRegion, type DateOrder, type Region, type RegionId } from '../../../lib/workbooks/region';
import ui from '../../../locales/packs/workbooks.ui.en.json';

export const inputClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
export const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';

/** Settings kept in this browser. Lists people paste or upload are never saved. */
export function usePersisted<T extends object>(key: string, defaults: T): [T, (patch: Partial<T>) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    try { const raw = JSON.parse(localStorage.getItem(key) ?? 'null') as Partial<T> | null; if (raw && typeof raw === 'object') return { ...defaults, ...raw }; } catch { /* nothing saved or storage blocked */ }
    return defaults;
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* storage blocked */ } }, [key, state]);
  return [state, (patch) => setState((s) => ({ ...s, ...patch })), () => setState(defaults)];
}

const REGION_KEY = 'mdu_wb_region_v1';
/** One region choice shared by all the workbook tools. The browser's language only picks the first guess. */
export function useRegion(): [Region, (id: RegionId) => void, (patch: Partial<Region>) => void] {
  const [region, setRegion] = useState<Region>(() => {
    try { const raw = JSON.parse(localStorage.getItem(REGION_KEY) ?? 'null') as Region | null; if (raw && raw.id in REGIONS && Array.isArray(raw.weekOff)) return { ...REGIONS[raw.id], ...raw }; } catch { /* nothing saved */ }
    let zone = ''; try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* unknown */ }
    return REGIONS[guessRegion(typeof navigator === 'undefined' ? 'en' : navigator.language, zone)];
  });
  useEffect(() => { try { localStorage.setItem(REGION_KEY, JSON.stringify(region)); } catch { /* storage blocked */ } }, [region]);
  return [region, (id) => setRegion(REGIONS[id]), (patch) => setRegion((r) => ({ ...r, ...patch }))];
}

export const TextField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; max?: number; hint?: string; multiline?: number }> = ({ label, value, onChange, placeholder, max = 80, hint, multiline }) => (
  <label className="block text-xs font-semibold text-slate-700">{label}
    {multiline
      ? <textarea value={value} rows={multiline} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputClass} py-2`} />
      : <input type="text" value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />}
    {hint && <span className="mt-0.5 block text-[11px] font-normal text-slate-500">{hint}</span>}
  </label>
);

export const NumberField: React.FC<{ label: string; value: number; onChange: (v: number) => void; min: number; max: number; hint?: string }> = ({ label, value, onChange, min, max, hint }) => (
  <label className="block text-xs font-semibold text-slate-700">{label}
    <input type="number" inputMode="decimal" value={Number.isFinite(value) ? value : ''} min={min} max={max} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))} className={inputClass} />
    {hint && <span className="mt-0.5 block text-[11px] font-normal text-slate-500">{hint}</span>}
  </label>
);

/** Where you are: currency, number style, dates, paper and what the tax is called. */
export const RegionPanel: React.FC<{ region: Region; onPreset: (id: RegionId) => void; onPatch: (patch: Partial<Region>) => void; tax?: boolean; code?: boolean; word?: boolean }> = ({ region, onPreset, onPatch, tax, code, word }) => (
  <section className={`${card} space-y-3`}>
    <h2 className={heading}>{ui.regionTitle}</h2>
    <p className="text-[11px] text-slate-500">{ui.regionHint}</p>
    <ChoiceButtons label={ui.regionTitle} value={region.id} onChange={(v) => onPreset(v as RegionId)} options={REGION_IDS.map((id) => ({ value: id, label: ui.regionNames[id] }))} />
    <details className="rounded-xl border border-slate-200 p-3">
      <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.regionMore}</summary>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label={ui.symbol} value={region.symbol} onChange={(v) => onPatch({ symbol: v })} max={6} hint={ui.symbolHint} />
        {word && <TextField label={ui.word} value={region.word} onChange={(v) => onPatch({ word: v.replace(/[^A-Za-z]/g, '') })} max={6} hint={ui.wordHint} />}
        {tax && <TextField label={ui.taxName} value={region.tax} onChange={(v) => onPatch({ tax: v })} max={20} hint={ui.taxHint} />}
        {code && <TextField label={ui.countryCode} value={region.code} onChange={(v) => onPatch({ code: v.replace(/\D/g, '') })} max={4} hint={ui.countryCodeHint} />}
        <label className="block text-xs font-semibold text-slate-700">{ui.dateOrder}
          <select value={region.date} onChange={(e) => onPatch({ date: e.target.value as DateOrder })} className={inputClass}>{(['dd-mm-yyyy', 'mm-dd-yyyy', 'yyyy-mm-dd'] as DateOrder[]).map((d) => <option key={d} value={d}>{ui.dateNames[d]}</option>)}</select></label>
        <label className="block text-xs font-semibold text-slate-700">{ui.paper}
          <select value={region.paper} onChange={(e) => onPatch({ paper: e.target.value as 'a4' | 'letter' })} className={inputClass}><option value="a4">A4</option><option value="letter">Letter</option></select></label>
      </div>
      <div className="mt-3"><Toggle label={ui.lakh} hint={ui.lakhHint} checked={region.lakh} onChange={(v) => onPatch({ lakh: v })} /></div>
    </details>
  </section>
);

/** Blank or sample, and the language of the guide sheet. */
export const ContentPanel: React.FC<{ sample: boolean; onSample: (v: boolean) => void; hinglish: boolean; onHinglish: (v: boolean) => void; hasList: boolean }> = ({ sample, onSample, hinglish, onHinglish, hasList }) => (
  <section className={`${card} space-y-3`}>
    <h2 className={heading}>{ui.contentTitle}</h2>
    {hasList ? <p className="text-xs text-slate-700">{ui.contentList}</p> : (
      <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.contentLabel}</p>
        <ChoiceButtons label={ui.contentLabel} value={sample ? 'sample' : 'blank'} onChange={(v) => onSample(v === 'sample')} options={[{ value: 'blank', label: ui.blank }, { value: 'sample', label: ui.withSample }]} />
        <p className="mt-1 text-[11px] text-slate-500">{sample ? ui.sampleHint : ui.blankHint}</p></div>
    )}
    <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.guideLanguage}</p>
      <ChoiceButtons label={ui.guideLanguage} value={hinglish ? 'hi' : 'en'} onChange={(v) => onHinglish(v === 'hi')} options={[{ value: 'en', label: ui.english }, { value: 'hi', label: ui.hinglish }]} />
      <p className="mt-1 text-[11px] text-slate-500">{ui.guideLanguageHint}</p></div>
  </section>
);

/** Makes the .xlsx and offers it for saving. The file is built in the browser and goes nowhere else. */
export const FilePanel: React.FC<{ getBook: () => Book; base: string; version: string; disabled?: boolean; onStartAgain: () => void; blank: boolean }> = ({ getBook, base, version, disabled, onStartAgain, blank }) => {
  const output = useResultFile();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { output.clear(); setMessage(''); }, [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const make = async () => {
    setBusy(true); setMessage(''); output.clear();
    try {
      await new Promise((r) => setTimeout(r, 30));
      const { blob, computed } = await buildXlsx(getBook());
      output.set(blob, generateFileName(base, 'xlsx'), { key: version, detail: ui.readyDetail.replace('{size}', formatBytes(blob.size)) });
      if (computed.warnings.length) setMessage(ui.warnFormulas);
    } catch { setMessage(ui.failed); }
    setBusy(false);
  };
  return (
    <section className={`${card} space-y-3`}>
      <MainActionButton onClick={() => void make()} disabled={disabled || busy} busy={busy} busyLabel={ui.preparing}><Download className="h-5 w-5" aria-hidden="true" />{ui.download}</MainActionButton>
      {blank && <p className="text-[11px] text-slate-500">{ui.blankDownload}</p>}
      {message && <Note>{message}</Note>}
      {output.result && <SaveResult href={output.result.url} name={output.result.name} label={ui.ready} saveLabel={ui.save} detail={output.result.detail} />}
      <div className="flex flex-wrap gap-2"><ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={onStartAgain} disabled={busy} /></div>
      <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      <ul className="list-disc space-y-1 pl-5 text-[11px] text-slate-500">{ui.fileNotes.map((n) => <li key={n}>{n}</li>)}</ul>
    </section>
  );
};

// ---------- preview ----------
const MAX_ROWS = 46, MAX_COLS = 56;
const range = (text: string) => { const [a, b = a] = text.split(':'); const m1 = /^([A-Z]+)(\d+)$/.exec(a!)!, m2 = /^([A-Z]+)(\d+)$/.exec(b)!; return { c0: colIndex(m1[1]!), r0: Number(m1[2]) - 1, c1: colIndex(m2[1]!), r1: Number(m2[2]) - 1 }; };

/** A cell as it will look in Excel: dates, percentages and amounts written out. */
export function showValue(v: Val | undefined, numFmt: string | undefined, region: Region): string {
  if (v === undefined || v === null || v === '') return '';
  if (isErr(v)) return v.err;
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'string') return v;
  if (!numFmt) return String(Math.round(v * 1e6) / 1e6);
  if (/^[dmy\-/ ]+$/i.test(numFmt)) return formatText(v, numFmt);
  const literal = /^0"([^"]*)"$/.exec(numFmt); if (literal) return `${v} ${literal[1]}`;
  const first = numFmt.includes('[') ? numFmt.split(';').pop()! : numFmt;
  if (first.includes('%')) return `${+(v * 100).toFixed((/\.(#+|0+)/.exec(first)?.[1]?.length ?? 0))}%`;
  const dec = /\.(0+)/.exec(first)?.[1]?.length ?? 0, soft = /\.(#+)/.exec(first)?.[1]?.length ?? 0;
  if (/#,##0|##,##0/.test(first)) {
    const prefix = region.symbol && numFmt.includes(region.symbol.trim()) ? region.symbol : '';
    return prefix + v.toLocaleString(region.lakh ? 'en-IN' : 'en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  return String(+v.toFixed(dec || soft));
}

/** Shows the sheets of the workbook, with its colour rules applied, so people see what they will get before they download. */
export const BookPreview: React.FC<{ book: Book; region: Region; note: string }> = ({ book, region, note }) => {
  const [index, setIndex] = useState(0);
  const computed = useMemo(() => computeBook(book), [book]);
  const sheet: SheetDef = book.sheets[Math.min(index, book.sheets.length - 1)]!;
  const view = useMemo(() => {
    const keys = Object.keys(sheet.cells).map((k) => { const m = /^([A-Z]+)(\d+)$/.exec(k)!; return { c: colIndex(m[1]!), r: Number(m[2]) - 1, k }; });
    const rows = Math.min(MAX_ROWS, Math.max(1, ...keys.map((x) => x.r + 1))), cols = Math.min(MAX_COLS, Math.max(1, ...keys.map((x) => x.c + 1)));
    const merges = sheet.merges.map(range), covered = new Set<string>(), starts = new Map<string, { cs: number; rs: number }>();
    merges.forEach((m) => { starts.set(`${m.c0},${m.r0}`, { cs: Math.min(m.c1, cols - 1) - m.c0 + 1, rs: Math.min(m.r1, rows - 1) - m.r0 + 1 }); for (let r = m.r0; r <= m.r1; r += 1) for (let c = m.c0; c <= m.c1; c += 1) if (r !== m.r0 || c !== m.c0) covered.add(`${c},${r}`); });
    const rules = sheet.rules.map((r) => ({ ...r, b: range(r.range) }));
    /** Long text runs on over the empty cells beside it, as it does in Excel. */
    for (const x of keys) {
      const cell = sheet.cells[x.k]!; const text = cell.f === undefined ? cell.v : undefined;
      if (typeof text !== 'string' || x.c >= cols || x.r >= rows || cell.s?.wrap || (cell.s?.h && cell.s.h !== 'left') || covered.has(`${x.c},${x.r}`) || starts.has(`${x.c},${x.r}`)) continue;
      const need = text.length * (cell.s?.size && cell.s.size > 12 ? 9 : 6.2); let have = (sheet.widths[x.c] ?? 8.43) * 7 + 5, span = 1;
      while (have < need && x.c + span < cols && !sheet.cells[cellRef(x.c + span, x.r)]?.f && sheet.cells[cellRef(x.c + span, x.r)]?.v === undefined && !covered.has(`${x.c + span},${x.r}`)) { have += (sheet.widths[x.c + span] ?? 8.43) * 7 + 5; covered.add(`${x.c + span},${x.r}`); span += 1; }
      if (span > 1) starts.set(`${x.c},${x.r}`, { cs: span, rs: 1 });
    }
    const value = (c: number, r: number): Val | undefined => { const cell = sheet.cells[cellRef(c, r)]; if (!cell) return undefined; return cell.f !== undefined ? computed.values.get(`${sheet.name}!${c},${r}`) : cell.v; };
    return { rows, cols, covered, starts, rules, value };
  }, [sheet, computed]);
  const widths = Array.from({ length: view.cols }, (_, c) => (sheet.hiddenCols.includes(c) ? 0 : Math.round((sheet.widths[c] ?? 8.43) * 7 + 5)));
  return (
    <section className={`${card} space-y-3`}>
      <h2 className={heading}>{ui.previewTitle}</h2>
      <p className="text-[11px] text-slate-500">{note}</p>
      <div role="tablist" aria-label={ui.previewTitle} className="flex flex-wrap gap-2">
        {book.sheets.slice(0, 16).map((s, i) => <button key={s.name} type="button" role="tab" aria-selected={i === index} onClick={() => setIndex(i)} className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold ${i === index ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{s.name}</button>)}
        {book.sheets.length > 16 && <span className="self-center text-[11px] text-slate-500">+{book.sheets.length - 16}</span>}
      </div>
      <div className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200 bg-white" tabIndex={0} aria-label={sheet.name}>
        <table className="border-collapse text-[11px]" style={{ tableLayout: 'fixed', width: widths.reduce((a, b) => a + b, 0) }}>
          <colgroup>{widths.map((w, c) => <col key={c} style={{ width: w }} />)}</colgroup>
          <tbody>
            {Array.from({ length: view.rows }, (_, r) => (
              <tr key={r} style={{ height: Math.round((sheet.heights[r] ?? 15) * 1.25) }}>
                {Array.from({ length: view.cols }, (_, c) => {
                  if (view.covered.has(`${c},${r}`) || widths[c] === 0) return <Fragment key={c} />;
                  const cell = sheet.cells[cellRef(c, r)], style = cell?.s ?? {}; let fill = style.fill, color = style.color, bold = style.bold;
                  for (const rule of view.rules) {
                    if (c < rule.b.c0 || c > rule.b.c1 || r < rule.b.r0 || r > rule.b.r1) continue;
                    if (computed.test?.(sheet.name, rule.formula, c - rule.b.c0, r - rule.b.r0)) { fill = rule.fill ?? fill; color = rule.color ?? color; bold = rule.bold ?? bold; if (rule.stop) break; }
                  }
                  const span = view.starts.get(`${c},${r}`), text = showValue(view.value(c, r), style.numFmt, region);
                  return (
                    <td key={c} colSpan={span?.cs} rowSpan={span?.rs} className="overflow-hidden px-1"
                      style={{ background: fill ? `#${fill}` : undefined, color: color ? `#${color}` : '#0f172a', fontWeight: bold ? 700 : 400, textAlign: style.h ?? (typeof view.value(c, r) === 'number' ? 'right' : 'left'), fontSize: style.size ? Math.max(9, Math.min(20, style.size)) : 11, whiteSpace: style.wrap ? 'pre-wrap' : 'nowrap', verticalAlign: style.v === 'top' ? 'top' : 'middle', border: style.border ? `1px solid #${style.borderColor ?? 'cbd5e1'}` : '1px solid #f1f5f9' }}>{text}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">{ui.previewScroll}</p>
    </section>
  );
};
