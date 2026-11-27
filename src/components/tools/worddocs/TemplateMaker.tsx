import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { MainActionButton } from '../../common/MainActionButton';
import { card, heading } from '../../common/PanelKit';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import { buildDocx } from '../../../lib/docx/write';
import { buildTemplate, type TplSection } from '../../../lib/docs/template';
import { isoFrom } from '../../../lib/docs/kit';
import T from '../../../locales/packs/worddocs.templates.text.en.json';
import { ConfirmButton } from '../shared/ConfirmButton';
import { buttonClass, inputClass, useRegion } from '../workbooks/shared';
import { DocPreview } from './DocPreview';

const c = T.common;
export interface TemplateDef { id: string; file: string; title: string; subtitle: string; sections: TplSection[] }
type Custom = { h: string; text: string };
interface State { title: string; subtitle: string; org: string; author: string; date: string; version: string; cover: boolean; contents: boolean; pageNumbers: boolean; numbered: boolean; font: string; accent: string; on: Record<string, boolean>; text: Record<string, string>; custom: Custom[] }

const initial = (t: TemplateDef): State => ({
  title: t.title, subtitle: t.subtitle, org: '', author: '', date: isoFrom(new Date(), 0), version: '1.0', cover: true, contents: true, pageNumbers: true, numbered: true, font: 'Calibri', accent: '1F4E79',
  on: Object.fromEntries(t.sections.map((s) => [s.id, true])), text: Object.fromEntries(t.sections.map((s) => [s.id, s.text])), custom: [],
});

const Tick: React.FC<{ label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, hint, checked, onChange }) => (
  <label className="flex items-start gap-2 text-xs font-semibold text-slate-700">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-600" />
    <span>{label}{hint && <span className="block text-[11px] font-normal text-slate-500">{hint}</span>}</span>
  </label>
);

/** One page for every long Word template: set the title page, tick the sections, edit the prompts, check the preview, make the .docx. */
export const TemplateMaker: React.FC<{ template: TemplateDef }> = ({ template }) => {
  const [state, setState] = useState(() => initial(template));
  const [open, setOpen] = useState<string>('');
  const [region] = useRegion();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState(false);
  const justReset = useRef(false);
  const output = useResultFile();
  const set = <K extends keyof State>(k: K, v: State[K]) => setState((s) => ({ ...s, [k]: v }));
  const input = useMemo(() => ({
    title: state.title, subtitle: state.subtitle, org: state.org, author: state.author, date: state.date, version: state.version, cover: state.cover, contents: state.contents, pageNumbers: state.pageNumbers, numbered: state.numbered,
    contentsHeading: c.contentsHeading, preparedBy: c.preparedBy, versionLabel: c.versionLabel, font: state.font, accent: state.accent, region,
    picks: template.sections.map((section) => ({ section, on: state.on[section.id] ?? false, text: state.text[section.id] ?? '' })), custom: state.custom,
  }), [state, template, region]);
  const deferred = useDeferredValue(input);
  const doc = useMemo(() => buildTemplate(deferred), [deferred]);
  const version = JSON.stringify([state, region.date, region.paper]);
  useEffect(() => { output.clear(); setMessage(''); setNotice(justReset.current); justReset.current = false; }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const picked = Object.values(state.on).filter(Boolean).length + state.custom.filter((x) => x.h.trim() || x.text.trim()).length;
  const make = async () => {
    setBusy(true); setMessage(''); output.clear();
    try {
      await new Promise((r) => setTimeout(r, 30));
      const blob = await buildDocx(buildTemplate(input));
      output.set(blob, generateFileName(template.file, 'docx'), { key: version, detail: formatBytes(blob.size) });
    } catch { setMessage(c.failed); }
    setBusy(false);
  };
  const setAll = (v: boolean) => setState((s) => ({ ...s, on: Object.fromEntries(template.sections.map((x) => [x.id, v])) }));
  const setCustom = (i: number, k: keyof Custom, v: string) => setState((s) => ({ ...s, custom: s.custom.map((x, n) => (n === i ? { ...x, [k]: v } : x)) }));

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.fields}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([['title', c.title], ['subtitle', c.subtitle], ['org', c.org], ['author', c.author], ['version', c.version]] as const).map(([k, label]) => (
            <label key={k} className="block text-xs font-semibold text-slate-700">{label}<input type="text" value={state[k]} maxLength={120} onChange={(e) => set(k, e.target.value)} className={inputClass} /></label>
          ))}
          <label className="block text-xs font-semibold text-slate-700">{c.date}<input type="date" value={state.date} onChange={(e) => set('date', e.target.value)} className={inputClass} /></label>
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.options}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Tick label={c.cover} hint={c.coverHint} checked={state.cover} onChange={(v) => set('cover', v)} />
          <Tick label={c.contents} hint={c.contentsHint} checked={state.contents} onChange={(v) => set('contents', v)} />
          <Tick label={c.pageNumbers} checked={state.pageNumbers} onChange={(v) => set('pageNumbers', v)} />
          <Tick label={c.numbered} checked={state.numbered} onChange={(v) => set('numbered', v)} />
        </div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{c.font}</p><ChoiceButtons label={c.font} value={state.font} onChange={(v) => set('font', v)} options={c.fonts} /></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{c.accent}</p><ChoiceButtons label={c.accent} value={state.accent} onChange={(v) => set('accent', v)} options={c.accents} /></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.sections}</h2>
        <p className="text-[11px] text-slate-500">{c.sectionsIntro}</p>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setAll(true)} className={buttonClass}>{c.all}</button><button type="button" onClick={() => setAll(false)} className={buttonClass}>{c.none}</button></div>
        <ul className="space-y-2">
          {template.sections.map((s) => (
            <li key={s.id} className={`rounded-xl border border-slate-200 p-3 ${s.level === 2 ? 'ml-5' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Tick label={s.h} hint={s.table ? c.includesTable.replace('{cols}', s.table.headers.join(', ')) : undefined} checked={state.on[s.id] ?? false} onChange={(v) => setState((x) => ({ ...x, on: { ...x.on, [s.id]: v } }))} />
                <button type="button" onClick={() => setOpen(open === s.id ? '' : s.id)} className="text-xs font-semibold text-orange-700 underline" aria-expanded={open === s.id}>{c.edit}</button>
              </div>
              {open === s.id && <textarea value={state.text[s.id] ?? ''} rows={5} maxLength={3000} onChange={(e) => setState((x) => ({ ...x, text: { ...x.text, [s.id]: e.target.value } }))} className={`${inputClass} mt-2 py-2`} aria-label={`${c.edit}: ${s.h}`} />}
            </li>
          ))}
        </ul>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.custom}</h2>
        {state.custom.length === 0 && <p className="text-xs text-slate-500">{c.empty}</p>}
        {state.custom.map((x, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-slate-200 p-3">
            <label className="block text-xs font-semibold text-slate-700">{c.customHeading}<input type="text" value={x.h} maxLength={100} onChange={(e) => setCustom(i, 'h', e.target.value)} className={inputClass} /></label>
            <label className="block text-xs font-semibold text-slate-700">{c.customText}<textarea value={x.text} rows={3} maxLength={3000} onChange={(e) => setCustom(i, 'text', e.target.value)} className={`${inputClass} py-2`} /></label>
            <button type="button" onClick={() => setState((s) => ({ ...s, custom: s.custom.filter((_, n) => n !== i) }))} className="text-xs font-semibold text-red-700 underline">{c.remove}</button>
          </div>
        ))}
        <button type="button" onClick={() => setState((s) => (s.custom.length >= 10 ? s : { ...s, custom: [...s.custom, { h: '', text: '' }] }))} disabled={state.custom.length >= 10} className={buttonClass}>{c.customAdd}</button>
      </section>

      <section className={`${card} space-y-2`}>
        <h2 className={heading}>{c.previewTitle}</h2>
        <p className="text-[11px] text-slate-500">{c.previewNote}</p>
        <DocPreview doc={doc} />
      </section>

      <section className={`${card} space-y-3`}>
        <MainActionButton onClick={() => void make()} disabled={busy || picked === 0} busy={busy} busyLabel={c.preparing}><Download className="h-5 w-5" aria-hidden="true" />{c.download}</MainActionButton>
        {message && <Note>{message}</Note>}
        {output.result && <SaveResult href={output.result.url} name={output.result.name} label={c.ready} saveLabel={c.save} detail={output.result.detail} />}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={c.startAgain} confirmLabel={c.startAgainConfirm} onConfirm={() => { justReset.current = true; setNotice(true); setState(initial(template)); setOpen(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={busy} /></div>
        {notice && <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{c.startedAgain}</p>}
        <p className="text-[11px] text-slate-500">{c.notSaved}</p>
        <ul className="list-disc space-y-1 pl-5 text-[11px] text-slate-500">{c.fileNotes.map((n) => <li key={n}>{n}</li>)}</ul>
      </section>
    </div>
  );
};

export default TemplateMaker;
