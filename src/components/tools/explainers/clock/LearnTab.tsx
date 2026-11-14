import React, { useState } from 'react';
import { Eye, EyeOff, Shuffle } from 'lucide-react';
import { Toggle, card } from '../../paper/controls';
import { fieldClass } from '../../utilities/common';
import { capitalise, digital, randomTime, timeWords, type ClockTime } from '../../../../lib/kids/clockTime';
import { ClockFace, HOUR_COLOUR, MINUTE_COLOUR } from './ClockFace';

const QUICK: { label: string; m: number }[] = [
  { label: "O'clock", m: 0 },
  { label: 'Quarter past', m: 15 },
  { label: 'Half past', m: 30 },
  { label: 'Quarter to', m: 45 },
];

export const LearnTab: React.FC = () => {
  const [time, setTime] = useState<ClockTime>({ h: 3, m: 0 });
  const [shown, setShown] = useState(false);
  const [step, setStep] = useState(1);
  const [numbers, setNumbers] = useState(true);

  const chip = 'min-h-11 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50';

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:items-start">
      <div className={card}>
        <div className="mx-auto max-w-sm">
          <ClockFace time={time} onChange={setTime} step={step} numbers={numbers} label="Clock you can move. Drag the short red hand for hours and the long blue hand for minutes." />
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-slate-700">
          Drag the <span style={{ color: HOUR_COLOUR }}>short red hand</span> for the hour and the <span style={{ color: MINUTE_COLOUR }}>long blue hand</span> for the minutes.
        </p>
      </div>

      <div className="space-y-4">
        <div className={card}>
          <button type="button" onClick={() => setShown((value) => !value)} aria-expanded={shown}
            className="flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 px-4 py-4 text-center hover:bg-orange-100">
            {shown ? (
              <>
                <span className="text-5xl font-black tabular-nums text-slate-900">{digital(time)}</span>
                <span className="mt-1 text-lg font-bold text-orange-800">{capitalise(timeWords(time))}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-600"><EyeOff className="h-4 w-4" aria-hidden="true" />Tap to hide</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-black text-orange-700" aria-hidden="true">?</span>
                <span className="mt-1 inline-flex items-center gap-2 text-base font-bold text-orange-800"><Eye className="h-5 w-5" aria-hidden="true" />Tap to see the time</span>
                <span className="mt-1 text-xs text-slate-600">First guess, then check.</span>
              </>
            )}
          </button>
        </div>

        <div className={card}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Try these</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((item) => <button key={item.label} type="button" className={chip} onClick={() => setTime((current) => ({ h: current.h, m: item.m }))}>{item.label}</button>)}
            <button type="button" className={`${chip} inline-flex items-center gap-2`} onClick={() => { setTime((current) => randomTime('any', current)); setShown(false); }}><Shuffle className="h-4 w-4" aria-hidden="true" />Random time</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700">
              The long hand moves
              <select className={fieldClass} value={step} onChange={(event) => setStep(Number(event.target.value))}>
                <option value={1}>One minute at a time</option>
                <option value={5}>Five minutes at a time</option>
                <option value={15}>Quarter hours</option>
              </select>
            </label>
            <div className="flex items-end"><Toggle label="Show the numbers" checked={numbers} onChange={setNumbers} /></div>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-slate-600">Move the hands with buttons instead</summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" className={chip} onClick={() => setTime((c) => ({ ...c, h: (c.h + 11) % 12 }))}>Hour back</button>
              <button type="button" className={chip} onClick={() => setTime((c) => ({ ...c, h: (c.h + 1) % 12 }))}>Hour forward</button>
              <button type="button" className={chip} onClick={() => setTime((c) => ({ ...c, m: (c.m + 60 - step) % 60 }))}>Minutes back</button>
              <button type="button" className={chip} onClick={() => setTime((c) => ({ ...c, m: (c.m + step) % 60 }))}>Minutes forward</button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
