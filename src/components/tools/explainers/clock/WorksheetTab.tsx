import React, { useState } from 'react';
import { Printer, Shuffle } from 'lucide-react';
import { Toggle, card } from '../../paper/controls';
import { fieldClass } from '../../utilities/common';
import { CLOCK_LEVELS, capitalise, digital, randomTime, sameTime, timeWords, type ClockLevel, type ClockTime } from '../../../../lib/kids/clockTime';
import { ClockFace } from './ClockFace';

type Kind = 'draw' | 'write';
const COUNT = 12;

function makeSheet(level: ClockLevel): ClockTime[] {
  const times: ClockTime[] = [];
  while (times.length < COUNT) {
    const t = randomTime(level);
    if (!times.some((item) => sameTime(item, t))) times.push(t);
    // Whole hours only have 12 possibilities, so a full sheet still fits.
  }
  return times;
}

export const WorksheetTab: React.FC = () => {
  const [level, setLevel] = useState<ClockLevel>('half');
  const [kind, setKind] = useState<Kind>('draw');
  const [times, setTimes] = useState<ClockTime[]>(() => makeSheet('half'));
  const [answers, setAnswers] = useState(false);

  return (
    <div className="space-y-4">
      <style>{`@media print { body * { visibility: hidden !important; } #kc-print, #kc-print * { visibility: visible !important; } #kc-print { position: absolute; left: 0; top: 0; width: 100% !important; border: 0 !important; box-shadow: none !important; } @page { size: A4; margin: 12mm; } }`}</style>
      <div className={`${card} print:hidden`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">
            Level
            <select className={fieldClass} value={level} onChange={(event) => { const next = event.target.value as ClockLevel; setLevel(next); setTimes(makeSheet(next)); }}>
              {CLOCK_LEVELS.map((item) => <option key={item.id} value={item.id}>{item.label}: {item.hint}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            Kind of worksheet
            <select className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as Kind)}>
              <option value="draw">Draw the hands for each time</option>
              <option value="write">Write the time shown on each clock</option>
            </select>
          </label>
        </div>
        <div className="mt-3"><Toggle label="Show the answers" hint="Fills in the hands or the times so you can mark the sheet." checked={answers} onChange={setAnswers} /></div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => setTimes(makeSheet(level))} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"><Shuffle className="h-4 w-4" aria-hidden="true" />New worksheet</button>
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-3 text-sm font-bold text-white hover:bg-orange-800"><Printer className="h-4 w-4" aria-hidden="true" />Print or save as PDF</button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Print the sheet without answers for the child, and with answers for yourself. In the print window choose "Save as PDF" to keep a copy.</p>
      </div>

      <div id="kc-print" className="mx-auto max-w-[794px] rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-slate-800 pb-2">
          <h3 className="text-xl font-black text-slate-900">{kind === 'draw' ? 'Draw the hands on each clock' : 'What time does each clock show?'}</h3>
          <p className="text-sm text-slate-700">Name: ____________________ &nbsp; Date: ____________</p>
        </div>
        <ol className="mt-4 grid list-none grid-cols-2 gap-x-4 gap-y-6 p-0 sm:grid-cols-3">
          {times.map((time, index) => (
            <li key={`${index}-${digital(time)}`} className="text-center" style={{ breakInside: 'avoid' }}>
              <div className="mx-auto w-full max-w-[170px]">
                <ClockFace time={time} showHands={kind === 'write' || answers} label={kind === 'draw' ? `Blank clock ${index + 1}` : `Clock ${index + 1}`} />
              </div>
              <p className="mt-1 text-sm font-bold text-slate-900">
                <span className="mr-1 text-slate-500">{index + 1}.</span>
                {kind === 'draw'
                  ? <>{digital(time)} <span className="font-semibold text-slate-600">({capitalise(timeWords(time))})</span></>
                  : answers ? digital(time) : '____ : ____'}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
