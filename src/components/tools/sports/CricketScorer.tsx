import React, { useMemo, useRef, useState } from 'react';
import { Undo2 } from 'lucide-react';
import { calcCard, NumberField, SelectField } from '../../finance/ui';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { ballLabel, chaseView, inningsView, overHistory, projected, type Ball, type BallKind } from '../../../lib/sports/cricketScoring';
import { FullscreenButton } from '../shared/FullscreenButton';
import { chipClass, ghostButton } from '../shared/toolStyles';

interface Saved { balls: Ball[]; oversLimit: number; target: number; first: { runs: number; wickets: number; overs: string } | null }
const DEFAULT: Saved = { balls: [], oversLimit: 0, target: 0, first: null };

const KINDS = ['ok', 'wd', 'nb', 'bye', 'lb'] as const;
const read = (value: unknown): Saved | null => {
  const v = value as Partial<Saved> | null;
  if (!v || !Array.isArray(v.balls)) return null;
  const balls = v.balls.filter((b): b is Ball => !!b && (KINDS as readonly string[]).includes(b.kind) && typeof b.runs === 'number' && typeof b.wicket === 'boolean').slice(0, 3000);
  const first = v.first && typeof v.first.runs === 'number' ? { runs: v.first.runs, wickets: Number(v.first.wickets) || 0, overs: String(v.first.overs ?? '') } : null;
  return { balls, oversLimit: Math.max(0, Math.min(90, Number(v.oversLimit) || 0)), target: Math.max(0, Number(v.target) || 0), first };
};

const MODIFIERS: Array<{ id: BallKind; label: string; hint: string }> = [
  { id: 'ok', label: 'Normal', hint: 'Tap the runs scored off the bat.' },
  { id: 'wd', label: 'Wide', hint: 'The wide counts 1 run. Tap 0 for a plain wide, or the extra runs run.' },
  { id: 'nb', label: 'No-ball', hint: 'The no-ball counts 1 run. Tap 0, or the runs scored off the bat. The next ball is a free hit.' },
  { id: 'bye', label: 'Bye', hint: 'Tap the byes run. The ball counts.' },
  { id: 'lb', label: 'Leg bye', hint: 'Tap the leg byes run. The ball counts.' },
];
const RUN_BUTTONS = [0, 1, 2, 3, 4, 6];
const OVER_CHOICES = [{ value: '0', label: 'No limit' }, ...[2, 5, 6, 8, 10, 15, 20, 30, 40, 50].map((n) => ({ value: String(n), label: `${n} overs` }))];

const tone = (ball: Ball): string => (ball.wicket ? 'bg-red-50 text-red-800' : ball.kind === 'ok' && (ball.runs === 4 || ball.runs === 6) ? 'bg-orange-100 text-orange-900' : ball.kind !== 'ok' && ball.kind !== 'bye' && ball.kind !== 'lb' ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-800');

export const CricketScorer: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-cricket-scorer-v1', DEFAULT, read);
  const [modifier, setModifier] = useState<BallKind>('ok');
  const board = useRef<HTMLDivElement>(null);
  const view = useMemo(() => inningsView(saved.balls, saved.oversLimit), [saved.balls, saved.oversLimit]);
  const chase = useMemo(() => (saved.target > 0 ? chaseView(view, saved.target, saved.oversLimit) : null), [view, saved.target, saved.oversLimit]);
  const finished = view.over || (chase?.won ?? false);
  const history = useMemo(() => overHistory(saved.balls).reverse(), [saved.balls]);
  const proj = projected(view, saved.oversLimit);
  const hint = MODIFIERS.find((entry) => entry.id === modifier)?.hint ?? '';

  const add = (runs: number, wicket = false) => {
    if (finished) return;
    setSaved({ ...saved, balls: [...saved.balls, { kind: modifier, runs: wicket ? 0 : runs, wicket }] });
    setModifier('ok');
  };
  const undo = () => setSaved({ ...saved, balls: saved.balls.slice(0, -1) });
  const startChase = () => setSaved({ ...saved, first: { runs: view.runs, wickets: view.wickets, overs: view.overs }, target: view.runs + 1, balls: [] });
  const reset = () => setSaved({ ...DEFAULT, oversLimit: saved.oversLimit });

  return (
    <section className={`${calcCard} space-y-4`}>
      <div ref={board} className="space-y-3 bg-[var(--theme-surface)] p-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
          {saved.first && <p className="text-xs font-semibold text-slate-500">First innings {saved.first.runs}/{saved.first.wickets} ({saved.first.overs} overs)</p>}
          <p className="text-6xl font-black tabular-nums leading-none text-slate-900 sm:text-7xl" aria-live="polite" aria-label={`Score ${view.runs} for ${view.wickets}`}>{view.runs}/{view.wickets}</p>
          <p className="mt-2 text-lg font-bold text-slate-700">{view.overs} overs{saved.oversLimit > 0 ? ` of ${saved.oversLimit}` : ''}</p>
          <p className="mt-1 text-sm text-slate-600">Run rate {view.runRate.toFixed(2)}{proj !== null ? ` · on course for ${proj}` : ''}</p>
          {chase && <p className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-bold text-orange-900">{chase.won ? 'Target reached' : saved.oversLimit > 0 ? `Need ${chase.needed} from ${chase.ballsLeft} balls · required rate ${chase.required.toFixed(2)}` : `Need ${chase.needed} to win`}</p>}
          {view.freeHit && !finished && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-black text-amber-900">Free hit</p>}
          {view.thisOver.length > 0 && (
            <ul className="mt-3 flex flex-wrap justify-center gap-1.5" aria-label="Balls of this over">
              {view.thisOver.map((ball, index) => <li key={index} className={`min-w-9 rounded-full px-2.5 py-1 text-sm font-bold ${tone(ball)}`}>{ballLabel(ball)}</li>)}
            </ul>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          {[['Extras', String(view.extras)], ['Fours and sixes', `${view.fours} and ${view.sixes}`], ['Partnership', `${view.partnership.runs} (${view.partnership.balls})`], ['Wickets left', String(10 - view.wickets)]].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 px-2 py-2"><dt className="text-[11px] font-semibold text-slate-500">{label}</dt><dd className="text-base font-black text-slate-900">{value}</dd></div>
          ))}
        </dl>
      </div>

      {finished ? (
        <div role="status" className="space-y-2 rounded-xl bg-green-50 px-3 py-3 text-center">
          <p className="text-sm font-black text-green-800">{chase?.won ? `Chase complete: ${view.runs}/${view.wickets} in ${view.overs} overs` : `Innings over: ${view.runs}/${view.wickets} in ${view.overs} overs`}</p>
          {!saved.first && <button type="button" onClick={startChase} className="min-h-11 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700">Start the chase, target {view.runs + 1}</button>}
        </div>
      ) : (
        <>
          <div role="group" aria-label="Kind of ball" className="flex flex-wrap gap-2">
            {MODIFIERS.map((entry) => <button key={entry.id} type="button" aria-pressed={modifier === entry.id} onClick={() => setModifier(entry.id)} className={chipClass(modifier === entry.id)}>{entry.label}</button>)}
          </div>
          <p className="text-[11px] text-slate-500">{hint}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {RUN_BUTTONS.map((runs) => <button key={runs} type="button" onClick={() => add(runs)} aria-label={`${runs} ${runs === 1 ? 'run' : 'runs'}`} className="min-h-14 rounded-xl border border-orange-300 bg-white text-2xl font-black text-orange-900 hover:bg-orange-50 active:bg-orange-100">{runs}</button>)}
          </div>
          <button type="button" onClick={() => add(0, true)} className="min-h-12 w-full rounded-xl bg-orange-600 px-4 py-2 text-base font-black text-white hover:bg-orange-700">Wicket</button>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={undo} disabled={saved.balls.length === 0} className={ghostButton}><Undo2 className="h-4 w-4" aria-hidden="true" />Undo last ball</button>
        <FullscreenButton target={board} />
      </div>

      {history.length > 0 && (
        <details className="rounded-xl border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">Over by over ({history.length})</summary>
          <ol className="mt-3 space-y-2">
            {history.map((line) => (
              <li key={line.over} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-bold text-slate-900">Over {line.over}{line.complete ? '' : ' (in progress)'}</span>
                  <span className="text-slate-700">{line.runs} {line.runs === 1 ? 'run' : 'runs'}{line.wickets > 0 ? `, ${line.wickets} ${line.wickets === 1 ? 'wicket' : 'wickets'}` : ''} · total {line.total}/{line.totalWickets}</span>
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label={`Balls of over ${line.over}`}>
                  {line.balls.map((ball, index) => <li key={index} className={`min-w-8 rounded-full px-2 py-0.5 text-xs font-bold ${tone(ball)}`}>{ballLabel(ball)}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </details>
      )}

      <details className="rounded-xl border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Options (all optional)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <SelectField label="Overs in the innings" value={String(saved.oversLimit)} onChange={(v) => setSaved({ ...saved, oversLimit: Number(v) })} options={OVER_CHOICES} />
          <NumberField label="Target to chase" value={saved.target ? String(saved.target) : ''} onChange={(v) => setSaved({ ...saved, target: Math.max(0, Math.floor(Number(v) || 0)) })} step="1" hint="Leave empty if you are batting first" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={startChase} disabled={saved.balls.length === 0} className={ghostButton}>End innings and start the chase</button>
          <button type="button" onClick={reset} disabled={saved.balls.length === 0 && !saved.first && !saved.target} className={ghostButton}>New match</button>
        </div>
      </details>
      <p className="text-center text-[11px] text-slate-500">The innings is saved on this device, so it is still here if you close the page. It does not record player names.</p>
    </section>
  );
};

export default CricketScorer;
