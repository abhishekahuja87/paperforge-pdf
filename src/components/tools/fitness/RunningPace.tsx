import React, { useMemo, useState } from 'react';
import { InputGrid, Note, NumberField, ResultActions, SimpleTable, Stat, StatGrid, calcCard } from '../../common/CalcKit';
import { parseAmount } from '../../../lib/finance/format';
import { RACES, formatClock, fromKm, paceSeconds, riegel, speed, splits, toKm, toSeconds, type DistanceUnit } from '../../../lib/fitness/running';
import { chipClass } from '../shared/toolStyles';

type Mode = 'pace' | 'time' | 'distance';
const MODES: Array<{ id: Mode; label: string }> = [{ id: 'pace', label: 'Find my pace' }, { id: 'time', label: 'Find my finish time' }, { id: 'distance', label: 'Find the distance' }];

const num = (text: string): number => Math.max(0, parseAmount(text));

export const RunningPace: React.FC = () => {
  const [mode, setMode] = useState<Mode>('pace');
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [distance, setDistance] = useState('5');
  const [h, setH] = useState('0');
  const [m, setM] = useState('30');
  const [s, setS] = useState('0');
  const [pm, setPm] = useState('6');
  const [ps, setPs] = useState('0');

  const result = useMemo(() => {
    const total = toSeconds(num(h), num(m), num(s));
    const paceSec = num(pm) * 60 + num(ps);
    let km = toKm(num(distance), unit);
    let seconds = total;
    if (mode === 'time') { if (km <= 0 || paceSec <= 0) return null; seconds = paceSec * fromKm(km, unit); }
    else if (mode === 'distance') { if (total <= 0 || paceSec <= 0) return null; km = toKm(total / paceSec, unit); seconds = total; }
    else if (km <= 0 || total <= 0) return null;
    return { km, seconds, pace: paceSeconds(seconds, km, unit), speed: speed(seconds, km, unit) };
  }, [mode, unit, distance, h, m, s, pm, ps]);

  const predictions = useMemo(() => (result && result.km >= 1.5 && result.km <= 50 ? RACES.map((race) => ({ race, seconds: riegel(result.seconds, result.km, race.km) })) : []), [result]);
  const summary = result ? `${formatClock(result.seconds)} for ${fromKm(result.km, unit).toFixed(2)} ${unit}: pace ${formatClock(result.pace)} per ${unit}, ${result.speed.toFixed(2)} ${unit}/h. mydailyutils.in` : '';
  const timeInputs = (
    <>
      <NumberField label="Hours" value={h} onChange={setH} step="1" />
      <NumberField label="Minutes" value={m} onChange={setM} step="1" />
      <NumberField label="Seconds" value={s} onChange={setS} step="1" />
    </>
  );

  return (
    <section className={`${calcCard} space-y-4`}>
      <div role="group" aria-label="What to work out" className="flex flex-wrap gap-2">
        {MODES.map((entry) => <button key={entry.id} type="button" aria-pressed={mode === entry.id} onClick={() => setMode(entry.id)} className={chipClass(mode === entry.id)}>{entry.label}</button>)}
        <span className="mx-1 hidden w-px bg-slate-200 sm:block" aria-hidden="true" />
        {(['km', 'mi'] as const).map((entry) => <button key={entry} type="button" aria-pressed={unit === entry} onClick={() => setUnit(entry)} className={chipClass(unit === entry)}>{entry === 'km' ? 'Kilometres' : 'Miles'}</button>)}
      </div>

      {mode !== 'distance' && (
        <div>
          <NumberField label={`Distance (${unit})`} value={distance} onChange={setDistance} />
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Common distances">
            {RACES.map((race) => <button key={race.id} type="button" onClick={() => setDistance(String(Math.round(fromKm(race.km, unit) * 100) / 100))} className="min-h-9 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">{race.label}</button>)}
          </div>
        </div>
      )}
      {mode !== 'time' && <div><p className="text-xs font-semibold text-slate-700">Time</p><InputGrid>{timeInputs}</InputGrid></div>}
      {mode !== 'pace' && <div><p className="text-xs font-semibold text-slate-700">Pace per {unit}</p><InputGrid><NumberField label="Minutes" value={pm} onChange={setPm} step="1" /><NumberField label="Seconds" value={ps} onChange={setPs} step="1" /></InputGrid></div>}

      {result ? (
        <>
          <StatGrid>
            <Stat label={`Pace per ${unit}`} value={formatClock(result.pace)} tone="strong" />
            <Stat label="Finish time" value={formatClock(result.seconds)} />
            <Stat label="Distance" value={`${fromKm(result.km, unit).toFixed(2)} ${unit}`} />
            <Stat label="Speed" value={`${result.speed.toFixed(2)} ${unit}/h`} />
          </StatGrid>
          <ResultActions summary={summary} />
          {predictions.length > 0 && (
            <SimpleTable caption="Race times predicted from this run" head={['Race', 'Predicted time', `Pace per ${unit}`]}
              rows={predictions.map(({ race, seconds }) => [race.label, formatClock(seconds), formatClock(paceSeconds(seconds, race.km, unit))])} />
          )}
          <SimpleTable caption={`Split times at an even pace, per ${unit}`} head={[unit === 'km' ? 'Kilometre' : 'Mile', 'Time so far']}
            rows={splits(result.seconds, result.km, unit).slice(0, 60).map((split) => [split.label, formatClock(split.elapsed)])} />
        </>
      ) : <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Fill in the boxes above to see your pace, speed and split times.</p>}
      <Note>Predicted times use the Riegel formula. They assume you train for the longer distance, so treat them as a guide and not a promise.</Note>
    </section>
  );
};

export default RunningPace;
