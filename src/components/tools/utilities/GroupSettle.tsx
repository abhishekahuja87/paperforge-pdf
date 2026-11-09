import React, { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import { CopyButton, fieldClass } from './common';
import { Note } from '../../finance/ui';
import { card, heading } from '../paper/controls';
import { MAX_PEOPLE, computeSettlement, formatMoney, settlementText, type Expense, type Person } from '../../../lib/settle/settle';
import { renderSettleCard } from '../../../lib/settle/card';

const STORAGE_KEY = 'mdu-group-settle';
let counter = 0;
const nextId = (prefix: string) => `${prefix}${Date.now().toString(36)}${(counter += 1)}`;

interface State { title: string; label: string; people: Person[]; expenses: Expense[] }

const blankExpense = (people: Person[]): Expense => ({ id: nextId('e'), label: '', amount: '', payer: people[0]?.id ?? '', shared: people.map((p) => p.id), mode: 'equal', weights: {} });

const initial = (): State => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as State;
      if (Array.isArray(saved.people) && Array.isArray(saved.expenses)) return saved;
    }
  } catch { /* storage blocked or damaged: start fresh */ }
  const people = ['Asha', 'Ben', 'Chen'].map((name) => ({ id: nextId('p'), name }));
  return { title: '', label: '', people, expenses: [blankExpense(people)] };
};

const small = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

export const GroupSettle: React.FC = () => {
  const [state, setState] = useState<State>(initial);
  const [cardMessage, setCardMessage] = useState('');
  const { title, label, people, expenses } = state;

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const result = useMemo(() => computeSettlement(people, expenses), [people, expenses]);
  const names = new Map(people.map((p) => [p.id, p.name || 'Unnamed']));
  const patch = (next: Partial<State>) => setState((current) => ({ ...current, ...next }));
  const label_ = (id: string) => names.get(id) ?? '?';

  const setName = (id: string, name: string) => patch({ people: people.map((p) => (p.id === id ? { ...p, name } : p)) });
  const addPerson = () => {
    if (people.length >= MAX_PEOPLE) return;
    patch({ people: [...people, { id: nextId('p'), name: `Person ${people.length + 1}` }] });
  };
  const removePerson = (id: string) => {
    if (people.length <= 2) return;
    const rest = people.filter((p) => p.id !== id);
    patch({
      people: rest,
      expenses: expenses.map((e) => ({ ...e, payer: e.payer === id ? (rest[0]?.id ?? '') : e.payer, shared: e.shared.filter((s) => s !== id) })),
    });
  };
  const change = (id: string, next: Partial<Expense>) => patch({ expenses: expenses.map((e) => (e.id === id ? { ...e, ...next } : e)) });
  const toggleShared = (e: Expense, id: string) => change(e.id, { shared: e.shared.includes(id) ? e.shared.filter((s) => s !== id) : [...e.shared, id] });
  const reset = () => {
    if (!window.confirm('Clear all people and expenses?')) return;
    const fresh = ['Asha', 'Ben', 'Chen'].map((name) => ({ id: nextId('p'), name }));
    setState({ title: '', label: '', people: fresh, expenses: [blankExpense(fresh)] });
  };

  const summary = settlementText(title, people, result, label);
  const makeCard = () => renderSettleCard(title, people, result, label);
  const downloadCard = () => {
    makeCard().toBlob((blob) => {
      if (!blob) { setCardMessage('Could not make the picture.'); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'settle-up.png';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      setCardMessage('');
    }, 'image/png');
  };
  const copyCard = async () => {
    try {
      const blob = await new Promise<Blob | null>((resolve) => makeCard().toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('no image');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCardMessage('Picture copied.');
    } catch {
      setCardMessage('Copying a picture is blocked here. Use Download picture instead.');
    }
  };
  const hasData = result.total > 0;

  return (
    <div className="space-y-4">
      <div className={card}>
        <h2 className={heading}>1. Who is in the group?</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">Name of this trip or event (optional)
            <input value={title} onChange={(e) => patch({ title: e.target.value })} placeholder="Goa weekend" className={fieldClass} />
          </label>
          <label className="block text-xs font-semibold text-slate-700">Currency sign (optional)
            <input value={label} onChange={(e) => patch({ label: e.target.value })} maxLength={6} placeholder="Leave empty for plain numbers" className={fieldClass} />
          </label>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {people.map((p) => (
            <li key={p.id} className="flex gap-2">
              <input aria-label="Person name" value={p.name} onChange={(e) => setName(p.id, e.target.value)} className={`${fieldClass} mt-0`} />
              <button type="button" aria-label={`Remove ${p.name || 'person'}`} onClick={() => removePerson(p.id)} disabled={people.length <= 2} className={small}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={addPerson} disabled={people.length >= MAX_PEOPLE} className={`${small} mt-3 inline-flex items-center gap-1.5`}><Plus className="h-4 w-4" aria-hidden="true" />Add person</button>
      </div>

      <div className={card}>
        <h2 className={heading}>2. What was paid, and who shared it?</h2>
        <div className="mt-3 space-y-3">
          {expenses.map((e, position) => (
            <div key={e.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="block text-xs font-semibold text-slate-700">What for
                  <input value={e.label} onChange={(ev) => change(e.id, { label: ev.target.value })} placeholder={`Expense ${position + 1}`} className={fieldClass} />
                </label>
                <label className="block text-xs font-semibold text-slate-700">Amount
                  <input inputMode="decimal" value={e.amount} onChange={(ev) => change(e.id, { amount: ev.target.value })} placeholder="0" className={fieldClass} />
                </label>
                <label className="block text-xs font-semibold text-slate-700">Paid by
                  <select value={e.payer} onChange={(ev) => change(e.id, { payer: ev.target.value })} className={fieldClass}>
                    {people.map((p) => <option key={p.id} value={p.id}>{p.name || 'Unnamed'}</option>)}
                  </select>
                </label>
              </div>
              <fieldset className="mt-3">
                <legend className="text-xs font-semibold text-slate-700">Shared by</legend>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {people.map((p) => {
                    const on = e.shared.includes(p.id);
                    return (
                      <div key={p.id} className="flex items-center gap-1">
                        <button type="button" aria-pressed={on} onClick={() => toggleShared(e, p.id)} className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold ${on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-500'}`}>{p.name || 'Unnamed'}</button>
                        {on && e.mode === 'shares' && (
                          <input aria-label={`Portions for ${p.name}`} inputMode="decimal" value={e.weights[p.id] ?? ''} placeholder="1" onChange={(ev) => change(e.id, { weights: { ...e.weights, [p.id]: ev.target.value } })} className="w-14 rounded-lg border border-slate-200 px-2 py-1.5 text-xs" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => change(e.id, { shared: people.map((p) => p.id) })} className={small}>Everyone</button>
                <button type="button" aria-pressed={e.mode === 'shares'} onClick={() => change(e.id, { mode: e.mode === 'equal' ? 'shares' : 'equal' })} className={small}>{e.mode === 'equal' ? 'Unequal shares' : 'Back to equal'}</button>
                <button type="button" onClick={() => patch({ expenses: expenses.filter((x) => x.id !== e.id) })} className={`${small} ml-auto`}>Remove expense</button>
              </div>
              {e.mode === 'shares' && <p className="mt-2 text-[11px] text-slate-500">Type portions next to each name, for example 2 for a bigger share and 1 for a smaller one. Empty means 1.</p>}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => patch({ expenses: [...expenses, blankExpense(people)] })} className={`${small} mt-3 inline-flex items-center gap-1.5`}><Plus className="h-4 w-4" aria-hidden="true" />Add expense</button>
      </div>

      <div className={card} aria-live="polite">
        <h2 className={heading}>3. Who pays whom</h2>
        {result.skipped.length > 0 && <div className="mt-2"><Note>{result.skipped.map((s) => `"${s.label}" was left out: ${s.reason}.`).join(' ')}</Note></div>}
        {!hasData ? <p className="mt-2 text-xs text-slate-500">Add an expense with an amount to see the payments.</p> : (
          <>
            <p className="mt-2 text-xs text-slate-600">Total spent {formatMoney(result.total, label)}. {result.transfers.length === 0 ? 'Everyone is even.' : `${result.transfers.length} payment${result.transfers.length > 1 ? 's' : ''} settle everything.`}</p>
            <ul className="mt-3 space-y-2">
              {result.transfers.map((t) => (
                <li key={`${t.from}-${t.to}`} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
                  <span className="font-semibold text-slate-900">{label_(t.from)} pays {label_(t.to)}</span>
                  <span className="font-bold text-emerald-800">{formatMoney(t.amount, label)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">What each person paid, their share, and the balance</caption>
                <thead><tr className="text-slate-500"><th className="py-1.5 pr-2 font-semibold">Person</th><th className="px-2 text-right font-semibold">Paid</th><th className="px-2 text-right font-semibold">Share</th><th className="pl-2 text-right font-semibold">Balance</th></tr></thead>
                <tbody>
                  {result.balances.map((b) => (
                    <tr key={b.id} className="border-t border-slate-100">
                      <td className="py-1.5 pr-2 font-medium text-slate-900">{b.name || 'Unnamed'}</td>
                      <td className="px-2 text-right">{formatMoney(b.paid)}</td>
                      <td className="px-2 text-right">{formatMoney(b.owed)}</td>
                      <td className={`pl-2 text-right font-bold ${b.net > 0 ? 'text-emerald-700' : b.net < 0 ? 'text-red-700' : 'text-slate-500'}`}>{b.net > 0 ? '+' : ''}{formatMoney(b.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              <button type="button" onClick={downloadCard} className={`${small} inline-flex items-center gap-1.5`}><Download className="h-4 w-4" aria-hidden="true" />Download picture</button>
              <button type="button" onClick={copyCard} className={small}>Copy picture</button>
              <CopyButton text={summary} label="Copy as text" />
              <button type="button" onClick={() => window.print()} className={small}>Print or save as PDF</button>
            </div>
            {cardMessage && <p className="mt-2 text-xs text-slate-600" role="status">{cardMessage}</p>}
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500 print:hidden">
        <span>Saved on this device only, so you can come back during a trip. Nothing is uploaded.</span>
        <button type="button" onClick={reset} className={small}>Clear all</button>
      </div>
    </div>
  );
};

export default GroupSettle;
