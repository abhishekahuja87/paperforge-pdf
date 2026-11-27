import React, { useDeferredValue, useMemo, useState } from 'react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { TableInput, type TableValue } from '../shared/TableInput';
import { labels } from '../../../lib/workbooks/common';
import ui from '../../../locales/packs/workbooks.ui.en.json';
import { BookPreview, ContentPanel, FilePanel, NumberField, RegionPanel, TextField, inputClass, usePersisted, useRegion } from './shared';
import type { ListSpec, Settings } from './listSpec';

/** One page for every list-style Excel maker: starter, a few settings, region, an optional pasted list, a preview and the download. */
export const ListWorkbook: React.FC<{ spec: ListSpec }> = ({ spec }) => {
  const starterIds = Object.keys(spec.starters);
  const defaults = useMemo(() => {
    const now = new Date();
    return { ...spec.defaults, ...(spec.month ? { month: now.getMonth() + 1, year: now.getFullYear() } : {}), starter: starterIds[0]!, sample: false, hinglish: false } as Settings & { starter: string; sample: boolean; hinglish: boolean };
  }, [spec]); // eslint-disable-line react-hooks/exhaustive-deps
  const [saved, change, reset] = usePersisted<typeof defaults>(`mdu_wb_${spec.id}_v1`, defaults);
  const [region, setPreset, patchRegion] = useRegion();
  const [table, setTable] = useState<TableValue | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const starterId = spec.starters[saved.starter] ? saved.starter : starterIds[0]!;
  const starter = spec.starters[starterId]!;
  const text = (key: string): string => String(saved[key] ?? '');

  const toRows = (cells: string[][], map: Record<string, number>) => cells.map((r) => Object.fromEntries(spec.fields.map((f) => [f.key, (map[f.key] !== undefined && map[f.key]! >= 0 ? (r[map[f.key]!] ?? '') : '').trim()])));
  const own = useMemo(() => (table ? toRows(table.rows, table.mapping).filter((r) => Object.values(r).some(Boolean)).slice(0, spec.maxRows) : []), [table]); // eslint-disable-line react-hooks/exhaustive-deps
  const sampleOrder = Object.fromEntries(spec.fields.map((f, i) => [f.key, i]));
  const useList = own.length > 0;
  const make = (forceSample: boolean) => {
    const sample = !useList && (saved.sample || forceSample);
    return spec.build({ settings: saved, rows: useList ? own : sample ? toRows(starter.rows, sampleOrder) : [], sample, region, hinglish: saved.hinglish, starter: starterId });
  };
  const deferred = useDeferredValue({ saved, region, own, forceSample: !useList && !saved.sample });
  const previewBook = useMemo(() => make(deferred.forceSample), [deferred.saved, deferred.region, deferred.own]); // eslint-disable-line react-hooks/exhaustive-deps
  const version = JSON.stringify([saved, region, own.length, own[0]]);
  const startAgain = () => { reset(); setTable(null); setResetKey((k) => k + 1); };
  const inMore = new Set(spec.more ?? []);

  const textField = (f: ListSpec['texts'][number]) => <TextField key={f.key} label={f.label} value={text(f.key)} onChange={(v) => change({ [f.key]: v })} placeholder={f.placeholder} max={f.max ?? 70} hint={f.hint} multiline={f.multiline} />;
  const numberField = (f: ListSpec['numbers'][number]) => <NumberField key={f.key} label={f.label} value={Number(saved[f.key])} onChange={(v) => change({ [f.key]: v })} min={f.min} max={f.max} hint={f.hint} />;
  const toggle = (f: NonNullable<ListSpec['toggles']>[number]) => <Toggle key={f.key} label={f.label} hint={f.hint} checked={Boolean(saved[f.key])} onChange={(v) => change({ [f.key]: v })} />;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{spec.ui.start}</h2>
        {starterIds.length > 1 && (
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{spec.ui.starters}</p>
            <ChoiceButtons label={spec.ui.starters} value={starterId} onChange={(v) => change({ starter: v, ...(spec.starters[v]?.set ?? {}) })} options={starterIds.map((id) => ({ value: id, label: spec.starters[id]!.label }))} />
            <p className="mt-1 text-[11px] text-slate-500">{starter.hint}</p></div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {spec.texts.filter((f) => !inMore.has(f.key)).map(textField)}
          {spec.numbers.filter((f) => !inMore.has(f.key)).map(numberField)}
        </div>
        {spec.month && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700">{spec.ui.month}
              <select value={Number(saved.month)} onChange={(e) => change({ month: Number(e.target.value) })} className={inputClass}>{labels.common.months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
            <NumberField label={spec.ui.year ?? ''} value={Number(saved.year)} onChange={(v) => change({ year: v })} min={2000} max={2100} />
          </div>
        )}
        {(spec.toggles ?? []).filter((f) => !inMore.has(f.key)).map(toggle)}
        {inMore.size > 0 && (
          <details className="rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.moreOptions}</summary>
            <div className="mt-3 space-y-3">
              {spec.texts.filter((f) => inMore.has(f.key)).map(textField)}
              {spec.numbers.filter((f) => inMore.has(f.key)).map(numberField)}
              {(spec.toggles ?? []).filter((f) => inMore.has(f.key)).map(toggle)}
            </div>
          </details>
        )}
      </section>

      <RegionPanel region={region} onPreset={setPreset} onPatch={patchRegion} tax={spec.region.tax} code={spec.region.code} word={spec.region.word} />

      <TableInput key={`${resetKey}-${starterId}`} name={spec.id} sampleHeaders={spec.sampleHeaders} sampleRows={starter.rows} fields={spec.fields} intro={spec.ui.listIntro} onChange={setTable} />
      {table && table.rows.length > spec.maxRows && <Note>{spec.tooMany.replace('{n}', String(spec.maxRows))}</Note>}

      <ContentPanel sample={saved.sample} onSample={(v) => change({ sample: v })} hinglish={saved.hinglish} onHinglish={(v) => change({ hinglish: v })} hasList={useList} />
      <BookPreview book={previewBook} region={region} note={useList || saved.sample ? spec.ui.previewYours : spec.ui.previewSample} />
      <FilePanel getBook={() => make(false)} base={spec.fileBase} version={version} onStartAgain={startAgain} blank={!useList && !saved.sample} />
    </div>
  );
};

export default ListWorkbook;
