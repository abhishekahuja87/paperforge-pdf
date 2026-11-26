import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { ConfirmButton } from '../shared/ConfirmButton';
import { TableInput, type TableValue } from '../shared/TableInput';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import { loadPhoto } from '../../../lib/poster/images';
import { loadPosterFonts } from '../../../lib/poster/fonts';
import { keyOf } from '../../../lib/table/shape';
import ui from '../../../locales/packs/bulkletters.ui.en.json';
import ex from '../../../locales/packs/bulkletters.examples.en.json';
import '../shops/posterFonts.css';
import { bracketPrompts, findFields, fillTemplate } from '../../../lib/letters/template';
import { drawLetter, type AccentId, type Letter, type LetterLogo, type LetterWords, type PaperId, type TextSizeId } from '../../../lib/letters/draw';
import { makeOnePdf, makeZip } from '../../../lib/letters/make';

const STORAGE_KEY = 'mdu_bulk_letters_v1', MAX_LETTERS = 200;
type StarterId = 'fee' | 'society' | 'invite' | 'thanks' | 'offer';
const STARTER_IDS: StarterId[] = ['fee', 'society', 'invite', 'thanks', 'offer'];
type OutputId = 'pdf' | 'zip';
type DateMode = 'today' | 'typed' | 'none';
interface Saved { starter: StarterId; business: string; tagline: string; contact: string; showLetterhead: boolean; subject: string; addressee: string; body: string; closing: string; signName: string; signRole: string; footer: string; paper: PaperId; accent: AccentId; size: TextSizeId; dateMode: DateMode; dateTyped: string; output: OutputId; nameColumn: string }

const fromStarter = (id: StarterId): Partial<Saved> => { const s = ex[id]; return { starter: id, subject: s.subject, addressee: s.addressee, body: s.body, closing: s.closing, signName: s.signName, signRole: s.signRole, nameColumn: s.nameColumn }; };
const DEFAULTS: Saved = { business: '', tagline: '', contact: '', showLetterhead: true, footer: '', paper: 'a4', accent: 'navy', size: 'normal', dateMode: 'today', dateTyped: '', output: 'pdf', ...fromStarter('fee') } as Saved;
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const inputClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';
const today = () => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

function load(): Saved {
  try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null; if (raw && typeof raw.body === 'string') return { ...DEFAULTS, ...raw }; } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** Make a letter for every row of a list: fees, dues, invitations, thank-yous. Paste a list or upload CSV or Excel. Everything happens on your device. */
export const BulkLetterMaker: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const [table, setTable] = useState<TableValue | null>(null);
  const [logo, setLogo] = useState<LetterLogo | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [message, setMessage] = useState('');
  const [fontTick, setFontTick] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cancelled = useRef(false);
  const output = useResultFile();

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { cancelled.current = true; }, []);
  useEffect(() => { let live = true; void loadPosterFonts().catch(() => undefined).then(() => { if (live) setFontTick((n) => n + 1); }); return () => { live = false; }; }, []);

  const sample = ex[saved.starter];
  const headers = table ? table.headers : sample.headers, rows = table ? table.rows : sample.rows;
  const columnOf = useMemo(() => { const map = new Map<string, number>(); headers.forEach((h, i) => { const k = keyOf(h); if (!map.has(k)) map.set(k, i); }); return map; }, [headers]);
  const dateLong = saved.dateMode === 'typed' ? saved.dateTyped.trim() : today();
  const templateText = [saved.subject, saved.addressee, saved.body].join('\n');
  const fields = useMemo(() => findFields(templateText), [templateText]);
  const status = fields.map((name) => { const key = keyOf(name); const builtIn = key === 'date' && !columnOf.has('date'); return { name, builtIn, column: builtIn ? -1 : columnOf.get(key) ?? -1 }; });
  const missing = status.filter((f) => !f.builtIn && f.column < 0);
  const prompts = [...new Set(bracketPrompts([saved.subject, saved.addressee, saved.body, saved.closing, saved.signName, saved.signRole, saved.footer, saved.business, saved.tagline, saved.contact].join('\n')))];
  const shown = Math.min(index, Math.max(0, rows.length - 1));
  const nameColumn = (() => { const i = columnOf.get(keyOf(saved.nameColumn)); return i ?? 0; })();

  const words: LetterWords = useMemo(() => ({ business: saved.business, tagline: saved.tagline, contact: saved.contact, closing: saved.closing, signName: saved.signName, signRole: saved.signRole, footer: saved.footer }), [saved]);
  const look = useMemo(() => ({ paper: saved.paper, accent: saved.accent, size: saved.size, letterhead: saved.showLetterhead }), [saved.paper, saved.accent, saved.size, saved.showLetterhead]);
  const letterFor = (row: string[]): Letter => {
    const valueOf = (field: string) => { const key = keyOf(field); if (key === 'date' && !columnOf.has('date')) return dateLong; const c = columnOf.get(key); return c === undefined ? `{${field}}` : row[c] ?? ''; };
    return { dateText: saved.dateMode === 'none' ? '' : dateLong, addressee: fillTemplate(saved.addressee, valueOf), subject: fillTemplate(saved.subject, valueOf), body: fillTemplate(saved.body, valueOf) };
  };
  const previewPages = useMemo(() => { const row = rows[shown]; return row ? drawLetter(look, words, letterFor(row), logo).length : 1; }, [rows, shown, look, words, logo, saved.subject, saved.addressee, saved.body, saved.dateMode, saved.dateTyped, headers, fontTick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const row = rows[shown]; if (!canvas.current || !row) return;
    const page = drawLetter(look, words, letterFor(row), logo)[0]!, target = canvas.current;
    target.width = page.width; target.height = page.height; target.getContext('2d')!.drawImage(page, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, shown, look, words, logo, saved.subject, saved.addressee, saved.body, saved.dateMode, saved.dateTyped, headers, fontTick]);

  const change = (patch: Partial<Saved>) => { output.clear(); setMessage(''); setSaved((s) => ({ ...s, ...patch })); };
  const field = (label: string, key: keyof Saved, placeholder = '', max = 120) => (
    <label className="block text-xs font-semibold text-slate-700">{label}
      <input type="text" value={saved[key] as string} maxLength={max} placeholder={placeholder} onChange={(e) => change({ [key]: e.target.value } as Partial<Saved>)} className={inputClass} /></label>
  );
  const canMake = !!table && rows.length > 0 && rows.length <= MAX_LETTERS && missing.length === 0 && prompts.length === 0;

  const pickLogo = async (file: File | undefined) => { if (!file) return; setMessage(''); output.clear(); try { setLogo(await loadPhoto(file)); } catch { setMessage(ui.logoFailed); } };
  const makeFile = async () => {
    if (!table || !canMake) return;
    cancelled.current = false; setBusy(true); setDone(0); setMessage(''); output.clear();
    try {
      const letters = table.rows.map((row) => letterFor(row));
      const blob = saved.output === 'zip'
        ? await makeZip(letters, table.rows.map((r) => r[nameColumn] ?? ''), look, words, logo, setDone, () => cancelled.current)
        : await makeOnePdf(letters, look, words, logo, setDone, () => cancelled.current);
      if (blob) output.set(blob, generateFileName('letters', saved.output), { key: saved.output, detail: ui.readyDetail.replace('{n}', String(letters.length)).replace('{size}', formatBytes(blob.size)) });
    } catch { setMessage(ui.failed); } finally { setBusy(false); }
  };
  const startAgain = () => { cancelled.current = true; setSaved(DEFAULTS); setLogo(null); setIndex(0); output.clear(); setMessage(''); setResetKey((k) => k + 1); };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={saved.starter} onChange={(v) => change(fromStarter(v as StarterId))} options={STARTER_IDS.map((id) => ({ value: id, label: ex[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{ex[saved.starter].hint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.write}</h2>
        <p className="text-[11px] text-slate-500">{ui.writeHint}</p>
        {field(ui.subject, 'subject', '', 140)}
        <label className="block text-xs font-semibold text-slate-700">{ui.addressee}
          <textarea value={saved.addressee} rows={3} maxLength={400} onChange={(e) => change({ addressee: e.target.value })} className={`${inputClass} py-2`} /></label>
        <p className="-mt-2 text-[11px] text-slate-500">{ui.addresseeHint}</p>
        <label className="block text-xs font-semibold text-slate-700">{ui.body}
          <textarea value={saved.body} rows={10} maxLength={4000} onChange={(e) => change({ body: e.target.value })} className={`${inputClass} py-2`} /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{field(ui.closing, 'closing', '', 40)}{field(ui.signName, 'signName', '', 60)}{field(ui.signRole, 'signRole', '', 60)}</div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.letterhead}</h2>
        {field(ui.business, 'business', ui.businessPlaceholder, 70)}
        <Toggle label={ui.showLetterhead} checked={saved.showLetterhead} onChange={(v: boolean) => change({ showLetterhead: v })} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field(ui.tagline, 'tagline', ex.sample.tagline, 70)}{field(ui.contact, 'contact', ex.sample.contact, 110)}</div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.logo}</p>
          <div className="flex flex-wrap gap-2">
            <label className={`${buttonClass} cursor-pointer`}>{ui.logoChoose}<input type="file" accept="image/*" className="sr-only" onChange={(e) => { void pickLogo(e.target.files?.[0]); e.target.value = ''; }} /></label>
            {logo && <button type="button" onClick={() => { output.clear(); setLogo(null); }} className={buttonClass}>{ui.logoRemove}</button>}</div></div>
      </section>

      <TableInput key={resetKey} name="letters" sampleHeaders={sample.headers} sampleRows={sample.rows} intro={ui.introList} disabled={busy}
        onChange={(value) => { output.clear(); setIndex(0); setTable(value); }} />

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.checkTitle}</h2>
        {!table && <p className="text-[11px] text-slate-500">{ui.noList}</p>}
        {fields.length > 0 && (
          <div><p className="text-xs font-bold text-slate-900">{ui.fieldsFound}</p>
            <ul className="mt-1 space-y-1 text-xs">{status.map((f) => (
              <li key={f.name} className={f.builtIn || f.column >= 0 ? 'text-green-800' : 'font-semibold text-red-700'}>
                <span className="font-mono">{`{${f.name}}`}</span> {f.builtIn ? ui.builtIn : f.column >= 0 ? ui.matched.replace('{name}', headers[f.column]!) : ui.missingField}</li>))}</ul></div>
        )}
        {table && missing.length > 0 && <Note>{ui.missing}</Note>}
        {prompts.length > 0 && <Note>{ui.brackets.replace('{list}', prompts.join(', '))}</Note>}
        {table && rows.length > MAX_LETTERS && <Note>{ui.tooMany.replace('{max}', String(MAX_LETTERS))}</Note>}
      </section>

      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 space-y-2">
          {!table && <p className="text-[11px] text-slate-500">{ui.previewSample}</p>}
          {rows.length > 1 && (
            <div className="flex items-center justify-between gap-2">
              <button type="button" aria-label={ui.previous} onClick={() => setIndex(Math.max(0, shown - 1))} disabled={shown === 0} className={`${buttonClass} !px-3`}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
              <p className="text-xs font-semibold text-slate-700">{ui.previewFor.replace('{n}', String(shown + 1)).replace('{total}', String(rows.length))}{previewPages > 1 ? ` · ${previewPages} pages each` : ''}</p>
              <button type="button" aria-label={ui.next} onClick={() => setIndex(Math.min(rows.length - 1, shown + 1))} disabled={shown >= rows.length - 1} className={`${buttonClass} !px-3`}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          )}
          <div className="flex justify-center rounded-xl bg-slate-200 p-2"><canvas ref={canvas} role="img" aria-label={ui.previewLabel} className="h-auto w-full max-w-md rounded bg-white shadow" /></div>
        </div>
      </section>

      <section className={card}>
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
          <div className="mt-3 space-y-3">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.dateMode}</p><ChoiceButtons label={ui.dateMode} value={saved.dateMode} onChange={(v) => change({ dateMode: v as DateMode })} options={names(ui.dates)} /></div>
            {saved.dateMode === 'typed' && field(ui.dateTyped, 'dateTyped', '26 November 2026', 30)}
            {field(ui.footer, 'footer', '', 100)}
            <label className="block text-xs font-semibold text-slate-700">{ui.nameFiles}
              <select value={saved.nameColumn} onChange={(e) => change({ nameColumn: e.target.value })} className={inputClass}>{headers.map((h) => <option key={h} value={h}>{h}</option>)}</select></label>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.paper}</p><ChoiceButtons label={ui.paper} value={saved.paper} onChange={(v) => change({ paper: v as PaperId })} options={names(ui.papers)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.accent}</p><ChoiceButtons label={ui.accent} value={saved.accent} onChange={(v) => change({ accent: v as AccentId })} options={names(ui.accents)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.size}</p><ChoiceButtons label={ui.size} value={saved.size} onChange={(v) => change({ size: v as TextSizeId })} options={names(ui.sizes)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.output}</p><ChoiceButtons label={ui.output} value={saved.output} onChange={(v) => change({ output: v as OutputId })} options={names(ui.outputs)} /><p className="mt-1 text-[11px] text-slate-500">{ui.outputHint}</p></div>
          </div>
        </details>
      </section>

      <section className={`${card} space-y-3`}>
        {busy && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round((done / Math.max(1, rows.length)) * 100)}%` }} /></div><p className="text-xs text-slate-700">{ui.making.replace('{done}', String(done)).replace('{total}', String(rows.length))} {ui.keepOpen}</p></>}
        {busy
          ? <button type="button" onClick={() => { cancelled.current = true; }} className={`${buttonClass} w-full`}>{ui.cancel}</button>
          : <MainActionButton onClick={() => void makeFile()} disabled={!canMake}><FileText className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
        {message && <Note>{message}</Note>}
        {output.result && (
          <div className="space-y-2">
            <SaveResult href={output.result.url} name={output.result.name} label={ui.ready} saveLabel={output.result.key === 'zip' ? ui.saveZip : ui.savePdf} detail={output.result.detail} />
            <p className="text-[11px] text-slate-500">{ui.notSelectable}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={busy} /></div>
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default BulkLetterMaker;
