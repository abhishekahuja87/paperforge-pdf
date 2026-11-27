import React, { useMemo, useState } from 'react';
import { InputGrid, Note, NumberField, ResultActions, SelectField, SimpleTable, Stat, StatGrid, calcCard } from '../../common/CalcKit';
import { parseAmount } from '../../../lib/finance/format';
import { BARS, PERCENT_ROWS, brzycki, epley, estimateOneRepMax, formatWeight, plateLoad, type WeightUnit } from '../../../lib/fitness/strength';
import { chipClass } from '../shared/toolStyles';

const plateText = (perSide: Array<[number, number]>, unit: WeightUnit): string => (perSide.length ? perSide.map(([plate, count]) => `${count} × ${formatWeight(plate)} ${unit}`).join(' + ') : 'Just the bar');

export const OneRepMax: React.FC = () => {
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [weight, setWeight] = useState('80');
  const [reps, setReps] = useState('6');
  const [barId, setBarId] = useState('olympic');
  const [target, setTarget] = useState('100');

  const bar = (BARS[unit].find((entry) => entry.id === barId) ?? BARS[unit][0]).weight;
  const result = useMemo(() => {
    const w = parseAmount(weight);
    const r = Math.round(parseAmount(reps));
    if (w <= 0 || r < 1 || r > 30) return null;
    const one = estimateOneRepMax(w, r);
    return { one, epley: epley(w, r), brzycki: r < 37 ? brzycki(w, r) : one, rows: PERCENT_ROWS.map((row) => ({ ...row, load: one * row.percent / 100 })) };
  }, [weight, reps]);

  const loadFor = (value: number) => plateLoad(value, bar, unit);
  const targetLoad = useMemo(() => {
    const t = parseAmount(target);
    return t > 0 ? plateLoad(t, bar, unit) : null;
  }, [target, bar, unit]);

  const summary = result ? `Estimated one-rep max ${formatWeight(result.one)} ${unit} from ${weight} ${unit} for ${reps} reps. mydailyutils.in` : '';

  return (
    <section className={`${calcCard} space-y-4`}>
      <div role="group" aria-label="Unit" className="flex gap-2">
        {(['kg', 'lb'] as const).map((entry) => <button key={entry} type="button" aria-pressed={unit === entry} onClick={() => { setUnit(entry); setBarId('olympic'); }} className={chipClass(unit === entry)}>{entry === 'kg' ? 'Kilograms' : 'Pounds'}</button>)}
      </div>
      <InputGrid>
        <NumberField label="Weight you lifted" suffix={unit} value={weight} onChange={setWeight} />
        <NumberField label="Reps you did" value={reps} onChange={setReps} step="1" hint="Most accurate for 2 to 10 reps" />
      </InputGrid>

      {result ? (
        <>
          <StatGrid>
            <Stat label="Estimated one-rep max" value={`${formatWeight(result.one)} ${unit}`} tone="strong" />
            <Stat label="Epley formula" value={`${formatWeight(result.epley)} ${unit}`} />
            <Stat label="Brzycki formula" value={`${formatWeight(result.brzycki)} ${unit}`} />
          </StatGrid>
          <SimpleTable
            caption="Training weights from your one-rep max"
            head={['Share of max', 'Weight', 'Usual reps', 'Plates each side']}
            rows={result.rows.map((row) => { const load = loadFor(row.load); return [`${row.percent}%`, `${formatWeight(load.loaded)} ${unit}`, row.reps, plateText(load.perSide, unit)]; })}
          />
          <p className="text-[11px] text-slate-500">The reps column is a rough guide. It differs between people and between lifts, and it is usually lower for leg and back lifts than for arm lifts.</p>
          <ResultActions summary={summary} />
        </>
      ) : <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Enter the weight and between 1 and 30 reps to see your estimate.</p>}

      <div className="border-t border-slate-100 pt-4">
        <h2 className="text-sm font-bold text-slate-900">Plate calculator</h2>
        <InputGrid>
          <NumberField label="Weight on the bar" suffix={unit} value={target} onChange={setTarget} />
          <SelectField label="Bar" value={barId} onChange={setBarId} options={BARS[unit].map((entry) => ({ value: entry.id, label: entry.label }))} />
        </InputGrid>
        {targetLoad && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3" role="status">
            <p className="text-sm font-bold text-slate-900">Each side: {plateText(targetLoad.perSide, unit)}</p>
            <p className="mt-1 text-xs text-slate-600">
              {targetLoad.short > 0 ? `The bar will weigh ${formatWeight(targetLoad.loaded)} ${unit}, which is ${formatWeight(targetLoad.short)} ${unit} under your target, because the plates below do not add up to it. ` : `Total ${formatWeight(targetLoad.loaded)} ${unit} with the bar. `}
              Plates used: {unit === 'kg' ? '25, 20, 15, 10, 5, 2.5 and 1.25 kg' : '45, 35, 25, 10, 5 and 2.5 lb'}. Put the heaviest plates closest to you and use collars.
            </p>
          </div>
        )}
      </div>
      <Note>Your one-rep max is an estimate. Never test a true one-rep max alone or without a spotter or safety arms, and warm up first.</Note>
    </section>
  );
};

export default OneRepMax;
