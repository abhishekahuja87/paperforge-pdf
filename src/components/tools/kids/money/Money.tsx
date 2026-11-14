import React from 'react';
import { DENOMINATIONS, NOTE_STYLE, rupees, sum } from '../../../../lib/kids/rupees';

/** One play note or coin. It is drawn as a plain colour block with the amount, and marked as play money. */
export const Money: React.FC<{ value: number; size?: 'sm' | 'md' }> = ({ value, size = 'md' }) => {
  const note = NOTE_STYLE[value];
  if (note) {
    return (
      <span aria-hidden="true" className={`inline-flex flex-col items-center justify-center rounded-md border-2 border-black/30 font-black shadow-sm ${size === 'md' ? 'h-14 w-28 text-xl' : 'h-9 w-[4.5rem] text-sm'}`} style={{ background: note.bg, color: note.fg }}>
        {rupees(value)}
        <span className={`font-semibold uppercase tracking-wide opacity-70 ${size === 'md' ? 'text-[9px]' : 'text-[7px]'}`}>play money</span>
      </span>
    );
  }
  const d = value === 5 ? (size === 'md' ? 52 : 34) : value === 2 ? (size === 'md' ? 46 : 30) : size === 'md' ? 40 : 26;
  return (
    <span aria-hidden="true" className="inline-flex items-center justify-center rounded-full border-2 border-slate-500 font-black text-slate-800 shadow-sm" style={{ width: d, height: d, fontSize: size === 'md' ? 16 : 11, background: 'radial-gradient(circle at 30% 30%, #f8fafc, #cbd5e1)' }}>
      {value}
    </span>
  );
};

/** The money you can pick from. Tap a note or coin to put it in the tray. */
export const MoneyPicker: React.FC<{ onAdd: (value: number) => void; disabled?: boolean }> = ({ onAdd, disabled }) => (
  <div role="group" aria-label="Notes and coins" className="flex flex-wrap items-center justify-center gap-2">
    {DENOMINATIONS.map(({ value }) => (
      <button key={value} type="button" disabled={disabled} onClick={() => onAdd(value)} aria-label={`Add ${rupees(value)}`}
        className="flex min-h-12 min-w-12 items-center justify-center rounded-xl p-1 hover:bg-slate-100 active:scale-95 disabled:opacity-40"><Money value={value} /></button>
    ))}
  </div>
);

/** What has been put down so far. Tap one to take it back. */
export const Tray: React.FC<{ values: number[]; onRemove: (index: number) => void; label: string; disabled?: boolean }> = ({ values, onRemove, label, disabled }) => (
  <div>
    <div className="flex items-baseline justify-between gap-2">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p>
      <p className="text-2xl font-black tabular-nums text-slate-900" aria-live="polite">{rupees(sum(values))}</p>
    </div>
    <div className="mt-1 flex min-h-20 flex-wrap items-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-2">
      {values.length === 0 && <span className="px-2 text-sm text-slate-500">Tap the notes and coins above to put them here.</span>}
      {values.map((value, index) => (
        <button key={`${index}-${value}`} type="button" disabled={disabled} onClick={() => onRemove(index)} aria-label={`Take back ${rupees(value)}`} className="rounded-lg p-0.5 hover:bg-white disabled:opacity-60"><Money value={value} size="sm" /></button>
      ))}
    </div>
  </div>
);
