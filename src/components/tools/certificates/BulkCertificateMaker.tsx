import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { card, heading } from '../paper/controls';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import ui from '../../../locales/packs/bulkcertificates.ui.en.json';
import starters from '../../../locales/packs/bulkcertificates.examples.en.json';
import '../shops/posterFonts.css';
import { drawWhole, parsePeople, type AccentId, type CertificateLook, type CertificateWords, type DesignId, type PaperId } from '../../../lib/certificates/draw';
import { makeOnePdf, makeZip } from '../../../lib/certificates/make';

const STORAGE_KEY = 'mdu_bulk_certificates_v1';
const MAX_PDF = 500, MAX_ZIP = 200;
type StarterId = 'participation' | 'achievement' | 'appreciation' | 'completion';
const STARTER_IDS: StarterId[] = ['participation', 'achievement', 'appreciation', 'completion'];
type OutputId = 'pdf' | 'zip';
interface Saved extends CertificateWords, CertificateLook { output: OutputId }

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const longDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return y && m && d ? new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : ''; };
const fromStarter = (id: StarterId): Partial<Saved> => { const s = starters[id]; return { design: s.design as DesignId, accent: s.accent as AccentId, title: s.title, preface: s.preface, reason: s.reason, signOneRole: s.signOneRole, signTwoRole: s.signTwoRole, organisation: s.organisation }; };
const DEFAULTS: Saved = { design: 'classic', accent: 'gold', paper: 'a4', output: 'pdf', title: '', preface: '', reason: '', organisation: '', date: today(), signOneName: '', signOneRole: '', signTwoName: '', signTwoRole: '', ...fromStarter('participation') } as Saved;
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const inputClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.title === 'string') return { ...DEFAULTS, ...raw };
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** Make a certificate for every name in a list, as one PDF or as a zip with a PDF for each person. Everything happens on your device. */
export const BulkCertificateMaker: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const [list, setList] = useState('');
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
  useEffect(() => { let live = true; void Promise.all(['600 30px Poppins', '700 30px Poppins'].map((font) => document.fonts.load(font, 'AaBb'))).catch(() => undefined).then(() => { if (live) setFontTick((tick) => tick + 1); }); return () => { live = false; }; }, []);

  const words: CertificateWords = useMemo(() => ({ title: saved.title, preface: saved.preface, reason: saved.reason, organisation: saved.organisation, date: saved.date ? longDate(saved.date) : '', signOneName: saved.signOneName, signOneRole: saved.signOneRole, signTwoName: saved.signTwoName, signTwoRole: saved.signTwoRole }), [saved]);
  const look: CertificateLook = useMemo(() => ({ design: saved.design, accent: saved.accent, paper: saved.paper }), [saved.design, saved.accent, saved.paper]);
  const people = useMemo(() => parsePeople(list, saved.reason), [list, saved.reason]);
  const limit = saved.output === 'zip' ? MAX_ZIP : MAX_PDF;
  const shown = Math.min(index, Math.max(0, people.length - 1));
  const person = people[shown] ?? { name: 'Riya Sharma', reason: saved.reason };

  useEffect(() => { if (canvas.current) drawWhole(canvas.current, look, words, person, 0.28); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look, words, person.name, person.reason, fontTick]);

  const change = (patch: Partial<Saved>) => { output.clear(); setMessage(''); setSaved((current) => ({ ...current, ...patch })); };
  const useStarter = (id: StarterId) => change(fromStarter(id));
  const activeStarter = STARTER_IDS.find((id) => { const s = fromStarter(id) as Record<string, string>; return (['design', 'accent', 'title', 'preface', 'reason'] as const).every((field) => s[field] === saved[field]); }) ?? '';
  const field = (label: string, key: keyof Saved, placeholder = '', type = 'text', max = 90) => (
    <label className="block text-xs font-semibold text-slate-700">{label}
      <input type={type} value={saved[key] as string} maxLength={max} placeholder={placeholder} onChange={(event) => change({ [key]: event.target.value } as Partial<Saved>)} className={inputClass} /></label>
  );

  const makeFile = async () => {
    if (people.length === 0 || people.length > limit) return;
    cancelled.current = false; setBusy(true); setDone(0); setMessage(''); output.clear();
    try {
      const blob = await (saved.output === 'zip' ? makeZip : makeOnePdf)(people, look, words, setDone, () => cancelled.current);
      if (blob) output.set(blob, generateFileName('certificates', saved.output === 'zip' ? 'zip' : 'pdf'), { key: saved.output, detail: ui.readyDetail.replace('{n}', String(people.length)).replace('{size}', formatBytes(blob.size)) });
    } catch { setMessage(ui.failed); } finally { setBusy(false); }
  };
  const startAgain = () => { cancelled.current = true; setList(''); setIndex(0); output.clear(); setMessage(''); setSaved({ ...DEFAULTS, date: today() }); };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => useStarter(value as StarterId)} options={STARTER_IDS.map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? starters[activeStarter].hint : ui.startersHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.wording}</h2>
        {field(ui.organisation, 'organisation', ui.organisationPlaceholder, 'text', 70)}
        {field(ui.title, 'title', '', 'text', 50)}
        <div>{field(ui.reason, 'reason', '', 'text', 120)}<p className="mt-1 text-[11px] text-slate-500">{ui.reasonHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.names}</h2>
        <p className="text-[11px] text-slate-500">{ui.namesHint}</p>
        <textarea value={list} onChange={(event) => { output.clear(); setList(event.target.value); }} rows={8} disabled={busy} placeholder={ui.namesPlaceholder} aria-label={ui.names}
          className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { output.clear(); setList(starters.sampleNames.join('\n')); setIndex(0); }} disabled={busy} className={buttonClass}>{ui.useSample}</button>
          {list && <button type="button" onClick={() => { output.clear(); setList(''); setIndex(0); }} disabled={busy} className={buttonClass}>{ui.clearNames}</button>}
          <p className="text-xs font-semibold text-slate-800">{people.length === 0 ? ui.countNone : people.length === 1 ? ui.countOne : ui.count.replace('{n}', String(people.length))}</p>
        </div>
        {people.length > limit && <Note>{ui.tooMany.replace('{max}', String(MAX_PDF)).replace('{zipMax}', String(MAX_ZIP))}</Note>}
      </section>

      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 space-y-2">
          {people.length > 1 && (
            <div className="flex items-center justify-between gap-2">
              <button type="button" aria-label={ui.previous} onClick={() => setIndex(Math.max(0, shown - 1))} disabled={shown === 0} className={`${buttonClass} !px-3`}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
              <p className="text-xs font-semibold text-slate-700">{ui.previewFor.replace('{n}', String(shown + 1)).replace('{total}', String(people.length))}</p>
              <button type="button" aria-label={ui.next} onClick={() => setIndex(Math.min(people.length - 1, shown + 1))} disabled={shown >= people.length - 1} className={`${buttonClass} !px-3`}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          )}
          <div className="flex justify-center rounded-xl bg-slate-200 p-2"><canvas ref={canvas} role="img" aria-label={ui.previewLabel} className="h-auto w-full max-w-2xl rounded bg-white shadow" /></div>
        </div>
      </section>

      <section className={card}>
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
          <div className="mt-3 space-y-3">
            {field(ui.preface, 'preface', '', 'text', 80)}
            {field(ui.date, 'date', '', 'date', 12)}
            <p className="-mt-2 text-[11px] text-slate-500">{ui.dateHint}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{field(ui.signOneName, 'signOneName', '', 'text', 40)}{field(ui.signOneRole, 'signOneRole', '', 'text', 40)}{field(ui.signTwoName, 'signTwoName', '', 'text', 40)}{field(ui.signTwoRole, 'signTwoRole', '', 'text', 40)}</div>
            <p className="-mt-2 text-[11px] text-slate-500">{ui.signHint}</p>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.design}</p><ChoiceButtons label={ui.design} value={saved.design} onChange={(value) => change({ design: value as DesignId })} options={names(ui.designs)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.accent}</p><ChoiceButtons label={ui.accent} value={saved.accent} onChange={(value) => change({ accent: value as AccentId })} options={names(ui.accents)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.paper}</p><ChoiceButtons label={ui.paper} value={saved.paper} onChange={(value) => change({ paper: value as PaperId })} options={names(ui.papers)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.output}</p><ChoiceButtons label={ui.output} value={saved.output} onChange={(value) => change({ output: value as OutputId })} options={names(ui.outputs)} /><p className="mt-1 text-[11px] text-slate-500">{ui.outputHint}</p></div>
          </div>
        </details>
      </section>

      <section className={`${card} space-y-3`}>
        {busy && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round((done / Math.max(1, people.length)) * 100)}%` }} /></div><p className="text-xs text-slate-700">{ui.making.replace('{done}', String(done)).replace('{total}', String(people.length))} {ui.keepOpen}</p></>}
        {busy
          ? <button type="button" onClick={() => { cancelled.current = true; }} className={`${buttonClass} w-full`}>{ui.cancel}</button>
          : <MainActionButton onClick={() => void makeFile()} disabled={people.length === 0 || people.length > limit}><FileText className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
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

export default BulkCertificateMaker;
