import React, { useMemo, useState } from 'react';
import { CopyButton, fieldClass } from '../common';
import { describeGap, parseEpoch, shiftDate, type ShiftUnit } from '../../../../lib/utilities/timestampTools';

const UNITS: ShiftUnit[] = ['seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'];

/** Add or subtract time from a timestamp, and find the gap between two timestamps. */
export const TimestampMath: React.FC<{ start: string }> = ({ start }) => {
  const [amount, setAmount] = useState('7');
  const [unit, setUnit] = useState<ShiftUnit>('days');
  const [other, setOther] = useState(() => String(Math.floor(Date.now() / 1000) + 86400 * 30));
  const base = useMemo(() => parseEpoch(start), [start]);
  const second = useMemo(() => parseEpoch(other), [other]);
  const shifted = base ? shiftDate(base.date, Number(amount), unit) : null;
  const seconds = shifted ? String(Math.floor(shifted.getTime() / 1000)) : '';
  const gap = base && second ? second.date.getTime() - base.date.getTime() : null;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Add or subtract time</h2>
        <p className="mt-1 text-xs text-slate-500">Starts from the timestamp at the top. Use a minus sign to go back.</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">Amount<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className={`${fieldClass} font-mono`} /></label>
          <label className="block text-xs font-semibold text-slate-700">Unit
            <select value={unit} onChange={(event) => setUnit(event.target.value as ShiftUnit)} className={fieldClass}>{UNITS.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </label>
        </div>
        {shifted && base ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[['New timestamp (seconds)', seconds], ['New date (UTC)', shifted.toISOString()]].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="truncate font-mono text-sm font-bold">{value}</p></div><CopyButton text={value!} label="Copy" /></div>
            ))}
          </div>
        ) : <p className="mt-3 text-xs text-red-700" role="alert">Enter a valid timestamp at the top and a number here.</p>}
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-900">Time between two timestamps</h2>
        <label className="mt-2 block text-xs font-semibold text-slate-700">Second timestamp<input value={other} onChange={(event) => setOther(event.target.value)} inputMode="numeric" className={`${fieldClass} font-mono`} /></label>
        {gap !== null ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800" aria-live="polite">{gap === 0 ? 'The two timestamps are the same moment.' : <>The second is <strong>{describeGap(gap)}</strong> {gap > 0 ? 'after' : 'before'} the first ({Math.abs(Math.round(gap / 1000)).toLocaleString('en-IN')} seconds).</>}</p>
        ) : <p className="mt-3 text-xs text-red-700" role="alert">Enter a valid timestamp in both boxes.</p>}
      </div>
    </div>
  );
};
