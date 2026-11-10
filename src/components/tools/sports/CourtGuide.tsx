import React, { useState } from 'react';
import { CalcFooter, Note, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { CHECKED_ON, SOURCES, SPORTS, findSport } from '../../../lib/sports/courtData';
import { spaceNeeded } from '../../../lib/sports/fit';
import { formatLength } from '../../../lib/sports/units';
import { buildSheet, pngToPdf, sheetToPng } from '../../../lib/sports/sheet';
import { downloadBlob } from '../../../lib/browserTools';
import text from '../../../locales/packs/sports.courts.en.json';
import CourtDiagram from './CourtDiagram';
import CourtFit from './CourtFit';

type SportText = {
  name: string; summary: string; variants: Record<string, string>; facts: Record<string, string>; marks: Record<string, string>;
  margins: Record<string, string>; howToPlay: string[]; notes: string[];
};
const sportsText = text.sports as unknown as Record<string, SportText>;
const ui = text.ui;

type Saving = '' | 'png' | 'pdf';

const tabClass = (on: boolean) => `min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold ${on ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`;

const CourtGuide: React.FC = () => {
  const [tab, setTab] = useState<'sizes' | 'fit'>('sizes');
  const [sportId, setSportId] = useState(SPORTS[0].id);
  const [variantId, setVariantId] = useState(SPORTS[0].variants[0].id);
  const [marginId, setMarginId] = useState(SPORTS[0].variants[0].margins[0].id);

  const [saving, setSaving] = useState<Saving>('');
  const [failed, setFailed] = useState(false);

  const sport = findSport(sportId);
  const variant = sport.variants.find((v) => v.id === variantId) ?? sport.variants[0];
  const margin = variant.margins.find((m) => m.id === marginId) ?? variant.margins[0];
  const copy = sportsText[sport.id];

  const pick = (nextSport: string, nextVariant?: string) => {
    const s = findSport(nextSport);
    const v = s.variants.find((x) => x.id === nextVariant) ?? s.variants[0];
    setSportId(s.id); setVariantId(v.id); setMarginId(v.margins[0].id);
  };

  const save = async (kind: 'png' | 'pdf') => {
    setSaving(kind); setFailed(false);
    try {
      const svg = buildSheet(variant, margin, { title: copy.name, version: copy.variants[variant.id], ui, facts: copy.facts, marks: copy.marks, margin: copy.margins[margin.id], notes: copy.notes });
      const png = await sheetToPng(svg);
      const base = `${sport.id}-${variant.id}-court-size`;
      if (kind === 'png') downloadBlob(png, `${base}.png`);
      else downloadBlob(new Blob([(await pngToPdf(png, `${copy.name}: ${copy.variants[variant.id]}`)).slice().buffer as ArrayBuffer], { type: 'application/pdf' }), `${base}.pdf`);
    } catch {
      setFailed(true);
    } finally {
      setSaving('');
    }
  };

  const [needLong, needShort] = spaceNeeded(variant, margin, 0);
  const diagonal = Math.hypot(variant.length, variant.width);
  const sourceIds = Array.from(new Set([...variant.sources, ...variant.margins.map((m) => m.source)]));

  return (
    <div className={calcCard}>
      <div className="flex gap-2" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'sizes'} className={tabClass(tab === 'sizes')} onClick={() => setTab('sizes')}>{ui.sizesTab}</button>
        <button type="button" role="tab" aria-selected={tab === 'fit'} className={tabClass(tab === 'fit')} onClick={() => setTab('fit')}>{ui.fitTab}</button>
      </div>

      {tab === 'fit' && <div className="mt-4"><CourtFit onOpen={(s, v) => { pick(s, v); setTab('sizes'); }} /></div>}

      {tab === 'sizes' && (
        <div className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label={ui.sport} value={sportId} onChange={(v) => pick(v)} options={SPORTS.map((s) => ({ value: s.id, label: sportsText[s.id].name }))} />
            {sport.variants.length > 1 && <SelectField label={ui.variant} value={variant.id} onChange={(v) => pick(sportId, v)} options={sport.variants.map((v) => ({ value: v.id, label: copy.variants[v.id] }))} />}
            {variant.margins.length > 1 && <SelectField label={ui.runoff} value={margin.id} onChange={setMarginId} options={variant.margins.map((m) => ({ value: m.id, label: copy.margins[m.id] }))} />}
          </div>
          <p className="mt-3 text-xs text-slate-600">{copy.summary}</p>
          <div className="mt-3"><CourtDiagram variant={variant} margin={margin} label={`${copy.name}: ${copy.variants[variant.id]}`} clearCaption={ui.clearCaption} /></div>
          <p className="mt-1 text-[11px] text-slate-500">{ui.drawingNote}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={saving !== ''} onClick={() => save('png')} className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{saving === 'png' ? ui.preparing : ui.saveImage}</button>
            <button type="button" disabled={saving !== ''} onClick={() => save('pdf')} className="inline-flex min-h-11 items-center rounded-xl border border-emerald-700 px-5 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60">{saving === 'pdf' ? ui.preparing : ui.savePdf}</button>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{ui.saveHint}</p>
          {failed && <p role="alert" className="mt-1 text-xs text-rose-700">{ui.saveFailed}</p>}

          <StatGrid>
            <Stat label={ui.courtSize} value={`${formatLength(variant.length)} x ${formatLength(variant.width)}`} tone="strong" />
            <Stat label={ui.spaceNeeded} value={`${formatLength(needLong)} x ${formatLength(needShort)}`} />
            {variant.clearHeight ? <Stat label={ui.height} value={`${formatLength(variant.clearHeight)} ${ui.high}`} /> : null}
          </StatGrid>
          <p className="mt-1 text-[11px] text-slate-500">{copy.margins[margin.id]}</p>

          <h3 className="mt-5 text-sm font-semibold text-slate-900">{ui.facts}</h3>
          <p className="text-[11px] text-slate-500">{ui.metresFeet}</p>
          <dl className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 text-xs">
            {variant.facts.map((f) => (
              <div key={f.id} className="flex flex-wrap justify-between gap-x-4 px-3 py-2"><dt className="text-slate-700">{copy.facts[f.id]}</dt><dd className="font-semibold text-slate-900">{formatLength(f.m)}</dd></div>
            ))}
          </dl>

          {!variant.round && (
            <>
              <h3 className="mt-5 text-sm font-semibold text-slate-900">{ui.marking}</h3>
              <p className="text-[11px] text-slate-500">{ui.markingIntro}</p>
              <dl className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 text-xs">
                <div className="flex flex-wrap justify-between gap-x-4 px-3 py-2"><dt className="text-slate-700">{ui.diagonal}</dt><dd className="font-semibold text-slate-900">{formatLength(diagonal)}</dd></div>
                {variant.marks.map((m, i) => (
                  <div key={m.id} className="flex flex-wrap justify-between gap-x-4 px-3 py-2">
                    <dt className="text-slate-700"><span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-800 text-[10px] font-bold text-white">{i + 1}</span>{copy.marks[m.id]} <span className="text-slate-500">({m.from === 'end' ? ui.fromEnd : ui.fromSide})</span></dt>
                    <dd className="font-semibold text-slate-900">{formatLength(m.m)}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          <h3 className="mt-5 text-sm font-semibold text-slate-900">{ui.howTo}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">{copy.howToPlay.map((line) => <li key={line}>{line}</li>)}</ul>

          <h3 className="mt-5 text-sm font-semibold text-slate-900">{ui.notes}</h3>
          <p className="text-[11px] text-slate-500">{ui.notesLead}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">{copy.notes.map((line) => <li key={line}>{line}</li>)}</ul>

          <h3 className="mt-5 text-sm font-semibold text-slate-900">{ui.sources}</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            {sourceIds.map((id) => <li key={id}><a href={SOURCES[id].url} target="_blank" rel="noopener noreferrer" className="text-emerald-800 underline">{SOURCES[id].name}</a></li>)}
          </ul>
          <p className="mt-1 text-[11px] text-slate-500">{ui.checked} {CHECKED_ON}.</p>
        </div>
      )}

      <div className="mt-4"><Note>{ui.disclaimer}</Note></div>
      <CalcFooter />
    </div>
  );
};

export default CourtGuide;
