import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
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
import { plain } from '../../../lib/docx/model';
import { hasBrackets, resolveDate, type DocInput } from '../../../lib/docs/kit';
import T from '../../../locales/packs/worddocs.text.en.json';
import { ConfirmButton } from '../shared/ConfirmButton';
import { buttonClass, inputClass, useRegion } from '../workbooks/shared';
import { DocPreview } from './DocPreview';
import type { DocField, DocSpec, DocStarter } from './docSpec';

const c = T.common;
type Values = Record<string, string>;
type Lists = Record<string, Values[]>;

const resolve = (s: DocStarter): { values: Values; lists: Lists } => {
  const now = new Date();
  return { values: Object.fromEntries(Object.entries(s.values).map(([k, v]) => [k, resolveDate(v, now)])), lists: Object.fromEntries(Object.entries(s.lists).map(([k, rows]) => [k, rows.map((r) => Object.fromEntries(Object.entries(r).map(([a, b]) => [a, resolveDate(b, now)])))])) };
};

const Field: React.FC<{ f: DocField; value: string; onChange: (v: string) => void }> = ({ f, value, onChange }) => (
  <label className="block text-xs font-semibold text-slate-700">{f.label}
    {f.kind === 'textarea' ? <textarea value={value} rows={f.rows ?? 3} maxLength={f.max ?? 1000} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputClass} py-2`} />
      : f.kind === 'select' ? <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>{(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        : <input type={f.kind === 'date' ? 'date' : 'text'} value={value} maxLength={f.max ?? 100} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />}
    {f.hint && <span className="mt-0.5 block text-[11px] font-normal text-slate-500">{f.hint}</span>}
  </label>
);

/** One page for every Word document maker: pick a starting point, fill in the boxes, check the preview, make the .docx. */
export const DocMaker: React.FC<{ spec: DocSpec }> = ({ spec }) => {
  const starterIds = Object.keys(spec.starters);
  const [starterId, setStarterId] = useState(starterIds[0]!);
  const [state, setState] = useState(() => resolve(spec.starters[starterIds[0]!]!));
  const [look, setLook] = useState(spec.form.looks?.[0]?.value ?? '');
  const [region] = useRegion();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const output = useResultFile();
  const input: DocInput = useMemo(() => ({ values: state.values, lists: state.lists, look, region }), [state, look, region]);
  const deferred = useDeferredValue(input);
  const doc = useMemo(() => spec.build(deferred), [spec, deferred]);
  const version = JSON.stringify([state, look, region.date, region.paper]);
  useEffect(() => { output.clear(); setMessage(''); }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const chooseStarter = (id: string) => { setStarterId(id); setState(resolve(spec.starters[id]!)); };
  const startAgain = () => chooseStarter(starterIds[0]!);
  const setValue = (key: string, v: string) => setState((s) => ({ ...s, values: { ...s.values, [key]: v } }));
  const setCell = (list: string, row: number, key: string, v: string) => setState((s) => ({ ...s, lists: { ...s.lists, [list]: (s.lists[list] ?? []).map((r, i) => (i === row ? { ...r, [key]: v } : r)) } }));
  const addRow = (list: string, max: number) => setState((s) => ((s.lists[list] ?? []).length >= max ? s : { ...s, lists: { ...s.lists, [list]: [...(s.lists[list] ?? []), {}] } }));
  const removeRow = (list: string, row: number) => setState((s) => ({ ...s, lists: { ...s.lists, [list]: (s.lists[list] ?? []).filter((_, i) => i !== row) } }));

  const texts = [...Object.values(state.values), ...Object.values(state.lists).flatMap((rows) => rows.flatMap((r) => Object.values(r)))];
  const brackets = hasBrackets(texts);
  const notes = spec.notes ? spec.notes(input) : [];
  const make = async () => {
    setBusy(true); setMessage(''); output.clear();
    try {
      await new Promise((r) => setTimeout(r, 30));
      const blob = await buildDocx(spec.build(input));
      output.set(blob, generateFileName(spec.id, 'docx'), { key: version, detail: formatBytes(blob.size) });
    } catch { setMessage(c.failed); }
    setBusy(false);
  };
  const empty = doc.blocks.map(plain).join('').trim() === '';

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.start}</h2>
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-700">{c.starters}</p>
          <ChoiceButtons label={c.starters} value={starterId} onChange={chooseStarter} options={starterIds.map((id) => ({ value: id, label: spec.starters[id]!.label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{spec.starters[starterId]!.hint} {c.startersNote}</p>
        </div>
        {spec.form.looks && spec.form.looks.length > 1 && (
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{c.look}</p><ChoiceButtons label={c.look} value={look} onChange={setLook} options={spec.form.looks} /></div>
        )}
      </section>

      {spec.form.groups.map((g) => (
        <section key={g.title} className={`${card} space-y-3`}>
          <h2 className={heading}>{g.title}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {g.fields.map((f) => <div key={f.key} className={f.kind === 'textarea' ? 'sm:col-span-2' : ''}><Field f={f} value={state.values[f.key] ?? ''} onChange={(v) => setValue(f.key, v)} /></div>)}
          </div>
        </section>
      ))}

      {spec.form.lists.map((l) => {
        const rows = state.lists[l.key] ?? [];
        return (
          <section key={l.key} className={`${card} space-y-3`}>
            <h2 className={heading}>{l.title}</h2>
            {rows.length === 0 && <p className="text-xs text-slate-500">{c.empty}</p>}
            {rows.map((row, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-slate-200 p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {l.columns.map((f) => <div key={f.key} className={f.kind === 'textarea' ? 'sm:col-span-2' : ''}><Field f={f} value={row[f.key] ?? ''} onChange={(v) => setCell(l.key, i, f.key, v)} /></div>)}
                </div>
                <button type="button" onClick={() => removeRow(l.key, i)} className="text-xs font-semibold text-red-700 underline">{c.remove} ({c.entry} {i + 1})</button>
              </div>
            ))}
            <button type="button" onClick={() => addRow(l.key, l.max)} disabled={rows.length >= l.max} className={buttonClass}>{l.add}</button>
          </section>
        );
      })}

      {notes.map((n) => <Note key={n}>{n}</Note>)}
      {brackets && <Note>{c.bracket}</Note>}

      <section className={`${card} space-y-2`}>
        <h2 className={heading}>{c.previewTitle}</h2>
        <p className="text-[11px] text-slate-500">{c.previewNote}</p>
        <DocPreview doc={doc} />
      </section>

      <section className={`${card} space-y-3`}>
        <MainActionButton onClick={() => void make()} disabled={busy || empty} busy={busy} busyLabel={c.preparing}><Download className="h-5 w-5" aria-hidden="true" />{c.download}</MainActionButton>
        {message && <Note>{message}</Note>}
        {output.result && <SaveResult href={output.result.url} name={output.result.name} label={c.ready} saveLabel={c.save} detail={output.result.detail} />}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={c.startAgain} confirmLabel={c.startAgainConfirm} onConfirm={startAgain} disabled={busy} /></div>
        <p className="text-[11px] text-slate-500">{c.notSaved}</p>
        <ul className="list-disc space-y-1 pl-5 text-[11px] text-slate-500">{c.fileNotes.map((n) => <li key={n}>{n}</li>)}</ul>
      </section>
    </div>
  );
};

export default DocMaker;
