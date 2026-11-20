import React, { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons, CopyButton, fieldClass } from '../utilities/common';
import { card, heading } from '../paper/controls';
import { parseList, shuffled, splitTeams } from '../../../lib/toolkit/pick';

type Mode = 'teams' | 'order';

/** Split a class or group into fair random teams, or shuffle people into a numbered order for seats, turns or presentations. */
export const TeamMaker: React.FC = () => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>('teams');
  const [by, setBy] = useState<'teams' | 'size'>('teams');
  const [amount, setAmount] = useState('2');
  const [teams, setTeams] = useState<string[][]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const run = () => {
    setMessage('');
    const people = parseList(text);
    if (people.length < 2) { setMessage('Add at least two names, one per line.'); return; }
    if (mode === 'order') { setOrder(shuffled(people)); setTeams([]); return; }
    const n = Math.max(1, Math.floor(Number(amount)) || 0);
    if (!n) { setMessage('Enter how many teams or how many people in each team.'); return; }
    const count = by === 'teams' ? n : Math.ceil(people.length / n);
    if (count > people.length) { setMessage('There are more teams than people. Lower the number.'); return; }
    setTeams(splitTeams(people, count)); setOrder([]);
  };

  const asText = teams.length ? teams.map((team, i) => `Team ${i + 1}: ${team.join(', ')}`).join('\n') : order.map((name, i) => `${i + 1}. ${name}`).join('\n');

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Names and what to make</h2>
        <label className="block text-xs font-semibold text-slate-700">Names, one per line (or separated by commas)
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={7} placeholder={'Asha\nRahul\nMeera\nKabir'} className={fieldClass} />
        </label>
        <ChoiceButtons label="Make" value={mode} onChange={(v) => setMode(v as Mode)} options={[{ value: 'teams', label: 'Random teams' }, { value: 'order', label: 'A shuffled order' }]} />
        {mode === 'teams' && (
          <div className="flex flex-wrap items-end gap-3">
            <ChoiceButtons label="Split by" value={by} onChange={(v) => setBy(v as 'teams' | 'size')} options={[{ value: 'teams', label: 'Number of teams' }, { value: 'size', label: 'People per team' }]} />
            <label className="text-xs font-semibold text-slate-700">{by === 'teams' ? 'Teams' : 'People in each team'}
              <input type="number" min={1} value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1.5 block w-24 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" />
            </label>
          </div>
        )}
        <button type="button" onClick={run} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800"><Shuffle className="h-4 w-4" aria-hidden="true" />{teams.length || order.length ? 'Shuffle again' : mode === 'teams' ? 'Make teams' : 'Shuffle order'}</button>
        {message && <p role="status" className="text-xs text-red-700">{message}</p>}
      </div>

      {(teams.length > 0 || order.length > 0) && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>2. Result</h2>
          {teams.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {teams.map((team, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-bold text-orange-800">Team {i + 1} <span className="font-normal text-slate-500">({team.length})</span></p>
                  <ul className="mt-1 space-y-0.5 text-sm text-slate-900">{team.map((name, j) => <li key={`${name}-${j}`}>{name}</li>)}</ul>
                </div>
              ))}
            </div>
          )}
          {order.length > 0 && <ol className="list-decimal space-y-0.5 pl-6 text-sm text-slate-900">{order.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}</ol>}
          <CopyButton text={asText} label="Copy result" />
        </div>
      )}
      <Note>Teams and orders are shuffled with your browser's secure random numbers, so nobody is favoured. The names stay on this page and are never saved or sent.</Note>
    </section>
  );
};

export default TeamMaker;
