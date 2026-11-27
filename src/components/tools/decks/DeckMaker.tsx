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
import { buildPptx } from '../../../lib/pptx/write';
import { buildDeck, MAX_SLIDES, type DeckInput } from '../../../lib/decks/outline';
import { hasBrackets, isoFrom } from '../../../lib/docs/kit';
import T from '../../../locales/packs/ppt.text.en.json';
import { ConfirmButton } from '../shared/ConfirmButton';
import { inputClass, useRegion } from '../workbooks/shared';
import { DeckPreview } from './DeckPreview';
import type { DeckSpec } from './deckSpec';

const c = T.common;
type State = Omit<DeckInput, 'region'>;

const fromStarter = (spec: DeckSpec, id: string): State => {
  const s = spec.starters[id]!;
  return { title: s.title, subtitle: s.subtitle, author: '', date: isoFrom(new Date(), 0), closing: s.closing, contact: s.contact, outline: s.outline, look: 'blue', font: 'Calibri', agenda: spec.agenda, answers: spec.answers };
};

/** One page for every PowerPoint maker: pick a starting point, edit the text outline, check the slides, make the .pptx. */
export const DeckMaker: React.FC<{ spec: DeckSpec }> = ({ spec }) => {
  const ids = Object.keys(spec.starters);
  const [starterId, setStarterId] = useState(ids[0]!);
  const [state, setState] = useState<State>(() => fromStarter(spec, ids[0]!));
  const [region] = useRegion();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const output = useResultFile();
  const set = <K extends keyof State>(k: K, v: State[K]) => setState((s) => ({ ...s, [k]: v }));
  const input: DeckInput = useMemo(() => ({ ...state, region }), [state, region]);
  const deferred = useDeferredValue(input);
  const built = useMemo(() => buildDeck(deferred), [deferred]);
  const version = JSON.stringify([state, region.date]);
  useEffect(() => { output.clear(); setMessage(''); }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (id: string) => { setStarterId(id); setState(fromStarter(spec, id)); };
  const brackets = hasBrackets([state.title, state.subtitle, state.closing, state.contact, state.outline]);
  const hasSlides = state.outline.trim() !== '' || state.title.trim() !== '';
  const make = async () => {
    setBusy(true); setMessage(''); output.clear();
    try {
      await new Promise((r) => setTimeout(r, 30));
      const blob = await buildPptx(buildDeck(input).deck);
      output.set(blob, generateFileName(spec.id, 'pptx'), { key: version, detail: formatBytes(blob.size) });
    } catch { setMessage(c.failed); }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.start}</h2>
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-700">{c.starters}</p>
          <ChoiceButtons label={c.starters} value={starterId} onChange={choose} options={ids.map((id) => ({ value: id, label: spec.starters[id]!.label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{spec.starters[starterId]!.hint} {c.startersNote}</p>
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.fields}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([['title', c.title], ['subtitle', c.subtitle], ['author', c.author], ['closing', c.closing], ['contact', c.contact]] as const).map(([k, label]) => (
            <label key={k} className="block text-xs font-semibold text-slate-700">{label}<input type="text" value={state[k]} maxLength={150} onChange={(e) => set(k, e.target.value)} className={inputClass} /></label>
          ))}
          <label className="block text-xs font-semibold text-slate-700">{c.date}<input type="date" value={state.date} onChange={(e) => set('date', e.target.value)} className={inputClass} /></label>
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{c.outlineTitle}</h2>
        <p className="text-[11px] text-slate-500">{c.outlineIntro}</p>
        <textarea value={state.outline} rows={16} maxLength={20000} spellCheck onChange={(e) => set('outline', e.target.value)} className={`${inputClass} py-2 font-mono text-[13px] leading-5`} aria-label={c.outlineTitle} />
        <ul className="list-disc space-y-0.5 pl-5 text-[11px] text-slate-500">{[...c.outlineHelp, ...(spec.quiz ? c.quizHelp : [])].map((h) => <li key={h}>{h}</li>)}</ul>
      </section>

      <section className={`${card} space-y-3`}>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{c.look}</p><ChoiceButtons label={c.look} value={state.look} onChange={(v) => set('look', v)} options={c.looks} /></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{c.font}</p><ChoiceButtons label={c.font} value={state.font} onChange={(v) => set('font', v)} options={c.fonts} /></div>
        {!spec.quiz && (
          <label className="flex items-start gap-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" checked={state.agenda} onChange={(e) => set('agenda', e.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-600" />
            <span>{c.agenda}<span className="block text-[11px] font-normal text-slate-500">{c.agendaHint}</span></span>
          </label>
        )}
        {spec.quiz && <div><p className="mb-1 text-xs font-semibold text-slate-700">{c.answers}</p><ChoiceButtons label={c.answers} value={state.answers} onChange={(v) => set('answers', v as State['answers'])} options={c.answerOptions} /></div>}
      </section>

      {brackets && <Note>{c.bracket}</Note>}
      {built.cut && <Note>{c.tooMany.replace('{max}', String(MAX_SLIDES))}</Note>}

      <section className={`${card} space-y-2`}>
        <h2 className={heading}>{c.previewTitle} ({c.slides.replace('{n}', String(built.deck.slides.length))})</h2>
        <p className="text-[11px] text-slate-500">{c.previewNote}</p>
        <DeckPreview deck={built.deck} />
      </section>

      <section className={`${card} space-y-3`}>
        <MainActionButton onClick={() => void make()} disabled={busy || !hasSlides} busy={busy} busyLabel={c.preparing}><Download className="h-5 w-5" aria-hidden="true" />{c.download}</MainActionButton>
        {message && <Note>{message}</Note>}
        {output.result && <SaveResult href={output.result.url} name={output.result.name} label={c.ready} saveLabel={c.save} detail={output.result.detail} />}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={c.startAgain} confirmLabel={c.startAgainConfirm} onConfirm={() => choose(ids[0]!)} disabled={busy} /></div>
        <p className="text-[11px] text-slate-500">{c.notSaved}</p>
        <ul className="list-disc space-y-1 pl-5 text-[11px] text-slate-500">{c.fileNotes.map((n) => <li key={n}>{n}</li>)}</ul>
      </section>
    </div>
  );
};

export default DeckMaker;
