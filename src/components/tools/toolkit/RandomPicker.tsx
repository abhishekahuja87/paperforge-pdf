import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import { Note } from '../../finance/ui';
import { Toggle, card, heading } from '../paper/controls';
import { fieldClass } from '../utilities/common';
import { parseList, randomInt, shuffled } from '../../../lib/toolkit/pick';

/** Pick one or more names fairly, with a short spin, and keep the ones already picked out of the next round. */
export const RandomPicker: React.FC = () => {
  const [text, setText] = useState('');
  const [count, setCount] = useState('1');
  const [skipPicked, setSkipPicked] = useState(true);
  const [picked, setPicked] = useState<string[]>([]);
  const [shown, setShown] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const all = parseList(text);
  const pool = skipPicked ? all.filter((name) => !picked.includes(name)) : all;
  const wanted = Math.max(1, Math.min(20, Math.floor(Number(count)) || 1));

  const pick = () => {
    setMessage('');
    if (pool.length === 0) { setMessage(all.length ? 'Everyone has been picked. Press Start over to use the whole list again.' : 'Add some names first, one per line.'); return; }
    const take = Math.min(wanted, pool.length);
    const winners = shuffled(pool).slice(0, take);
    setSpinning(true);
    let ticks = 0;
    timer.current = window.setInterval(() => {
      ticks += 1;
      setShown(pool[randomInt(pool.length)]!);
      if (ticks >= 18) {
        if (timer.current) window.clearInterval(timer.current);
        timer.current = null;
        setShown(winners.join(', '));
        setPicked((list) => [...list, ...winners]);
        setSpinning(false);
      }
    }, 80);
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Add the names</h2>
        <label className="block text-xs font-semibold text-slate-700">Names, one per line (or separated by commas)
          <textarea value={text} onChange={(event) => { setText(event.target.value); setPicked([]); setShown(''); }} rows={6} placeholder={'Asha\nRahul\nMeera'} className={fieldClass} />
        </label>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs font-semibold text-slate-700">How many to pick
            <input type="number" min={1} max={20} value={count} onChange={(event) => setCount(event.target.value)} className="mt-1.5 block w-24 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" />
          </label>
          <Toggle label="Do not pick the same name twice" checked={skipPicked} onChange={setSkipPicked} />
        </div>
        <p className="text-[11px] text-slate-500">{all.length} name{all.length === 1 ? '' : 's'}{skipPicked && picked.length ? `, ${pool.length} left` : ''}</p>
      </div>

      <div className={`${card} space-y-3 text-center`}>
        <h2 className={heading}>2. Pick</h2>
        <div role="status" aria-live="polite" className="flex min-h-24 items-center justify-center rounded-xl border-2 border-orange-200 bg-orange-50 px-3 py-4 text-2xl font-extrabold text-slate-900 sm:text-3xl">{shown || 'Ready'}</div>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" disabled={spinning} onClick={pick} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"><Shuffle className="h-4 w-4" aria-hidden="true" />{spinning ? 'Picking...' : 'Pick now'}</button>
          <button type="button" disabled={spinning} onClick={() => { setPicked([]); setShown(''); setMessage(''); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"><RotateCcw className="h-4 w-4" aria-hidden="true" />Start over</button>
        </div>
        {message && <p role="status" className="text-xs text-red-700">{message}</p>}
        {picked.length > 0 && <p className="text-left text-xs text-slate-600"><span className="font-semibold">Picked so far:</span> {picked.join(', ')}</p>}
      </div>
      <Note>Names are picked with your browser's secure random numbers, so every name has the same chance. Everything stays on this page and nothing is saved or sent.</Note>
    </section>
  );
};

export default RandomPicker;
