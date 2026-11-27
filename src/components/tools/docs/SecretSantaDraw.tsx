import React, { useState } from 'react';
import { Eye, EyeOff, RotateCcw, Shuffle } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { fieldClass } from '../../common/FieldKit';
import { card, heading } from '../../common/PanelKit';
import { MAX_PEOPLE, MIN_PEOPLE, drawSanta, parseNames, parsePairs } from '../../../lib/fun/santa';

/** Draw names for Secret Santa on one phone: pass it around and each person taps their own name. Nothing is sent anywhere. */
export const SecretSantaDraw: React.FC = () => {
  const [names, setNames] = useState('');
  const [pairs, setPairs] = useState('');
  const [event, setEvent] = useState('');
  const [budget, setBudget] = useState('');
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [organiser, setOrganiser] = useState(false);
  const [message, setMessage] = useState('');

  const run = () => {
    const list = parseNames(names);
    setMessage('');
    if (list.length < MIN_PEOPLE) { setMessage(`Add at least ${MIN_PEOPLE} different names, one per line.`); return; }
    const draw = drawSanta(list, parsePairs(pairs, list));
    if (!draw) { setMessage('These "must not draw each other" rules leave no way to draw. Remove a rule and try again.'); return; }
    setResult(draw); setOrder(list); setSeen(new Set()); setOpen(null); setOrganiser(false);
  };

  if (result) {
    return (
      <section className="mx-auto min-w-0 space-y-4">
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>{event.trim() ? `${event.trim()}: ` : ''}Pass the phone around</h2>
          {budget.trim() && <p className="text-xs text-slate-600">Gift budget: {budget.trim()}</p>}
          {open ? (
            <div role="status" className="rounded-xl border-2 border-orange-300 bg-orange-50 p-5 text-center">
              <p className="text-xs text-slate-600">Hello {open}, your Secret Santa person is</p>
              <p className="my-3 text-3xl font-extrabold text-slate-900">{result[open]}</p>
              <p className="mb-3 text-[11px] text-slate-500">Remember it, then hide this before you pass the phone on.</p>
              <button type="button" onClick={() => { setSeen((s) => new Set(s).add(open)); setOpen(null); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white"><EyeOff className="h-4 w-4" aria-hidden="true" />Hide and pass on</button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600">Tap your own name to see who you got. Each name can be opened once.</p>
              <ul className="grid grid-cols-2 gap-2">
                {order.map((name) => (
                  <li key={name}><button type="button" disabled={seen.has(name)} onClick={() => setOpen(name)} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:line-through">{name}</button></li>
                ))}
              </ul>
              <p className="text-xs text-slate-500">{seen.size} of {order.length} have looked.</p>
            </>
          )}
        </div>
        <div className={`${card} space-y-2`}>
          <button type="button" onClick={() => setOrganiser((v) => !v)} className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-700"><Eye className="h-4 w-4" aria-hidden="true" />{organiser ? 'Hide the full list' : 'Organiser: show everyone (spoils the surprise)'}</button>
          {organiser && <ul className="grid gap-1 text-xs text-slate-700">{order.map((n) => <li key={n}>{n} gives to <strong>{result[n]}</strong></li>)}</ul>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={run} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"><Shuffle className="h-4 w-4" aria-hidden="true" />Draw again</button>
          <button type="button" onClick={() => setResult(null)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"><RotateCcw className="h-4 w-4" aria-hidden="true" />Change the names</button>
        </div>
        <Note>The draw happens on this phone only. Closing or reloading the page forgets it, so finish before you leave.</Note>
      </section>
    );
  }

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>Who is playing?</h2>
        <label className="block text-xs font-semibold text-slate-700">Names, one per line ({MIN_PEOPLE} to {MAX_PEOPLE})
          <textarea rows={6} value={names} onChange={(event) => setNames(event.target.value)} placeholder={'Asha\nRohan\nMeera\nKabir'} className={fieldClass} />
        </label>
        <label className="block text-xs font-semibold text-slate-700">Must not draw each other (optional)
          <span className="block text-[11px] font-normal text-slate-500">One pair per line, such as a couple: Asha - Rohan</span>
          <textarea rows={2} value={pairs} onChange={(event) => setPairs(event.target.value)} className={fieldClass} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">Event (optional)<input type="text" maxLength={40} value={event} onChange={(e) => setEvent(e.target.value)} placeholder="Office party" className={fieldClass} /></label>
          <label className="block text-xs font-semibold text-slate-700">Gift budget (optional)<input type="text" maxLength={30} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Rs. 500" className={fieldClass} /></label>
        </div>
        <button type="button" onClick={run} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800"><Shuffle className="h-4 w-4" aria-hidden="true" />Draw the names</button>
        {message && <p role="status" className="text-xs text-red-700">{message}</p>}
      </div>
    </section>
  );
};

export default SecretSantaDraw;
