import React, { useMemo } from 'react';
import { Undo2 } from 'lucide-react';
import { calcCard, SelectField } from '../../common/CalcKit';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { SCORE_SPORTS, matchView, sportInfo, type MatchSetup, type ScoreSportId, type Side } from '../../../lib/sports/scoring';
import { ConfirmButton } from '../shared/ConfirmButton';
import { ghostButton, primaryButton, smallInput } from '../shared/toolStyles';

interface Saved extends MatchSetup { names: [string, string] }
const DEFAULT: Saved = { sport: 'badminton', bestOf: 3, points: [], names: ['Player 1', 'Player 2'] };

const read = (value: unknown): Saved | null => {
  const v = value as Partial<Saved> | null;
  if (!v || !SCORE_SPORTS.some((sport) => sport.id === v.sport) || !Array.isArray(v.points) || !Array.isArray(v.names) || typeof v.bestOf !== 'number') return null;
  return { sport: v.sport as ScoreSportId, bestOf: v.bestOf, points: v.points.filter((p): p is Side => p === 0 || p === 1), names: [String(v.names[0] ?? 'Player 1').slice(0, 24), String(v.names[1] ?? 'Player 2').slice(0, 24)] };
};

export const MatchScoreKeeper: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-score-keeper-v1', DEFAULT, read);
  const sport = sportInfo(saved.sport);
  const view = useMemo(() => matchView(saved), [saved]);
  const isTennis = saved.sport === 'tennis';
  const finishedNote = view.finished.map(([a, b], index) => `${isTennis ? 'Set' : sport.rules?.unit === 'set' ? 'Set' : 'Game'} ${index + 1}: ${a}-${b}`).join('  ·  ');
  const add = (side: Side) => { if (view.winner === null) setSaved({ ...saved, points: [...saved.points, side] }); };
  const undo = () => setSaved({ ...saved, points: saved.points.slice(0, -1) });
  const reset = () => setSaved({ ...saved, points: [] });
  const choose = (id: ScoreSportId) => { const next = sportInfo(id); setSaved({ ...saved, sport: id, bestOf: next.defaultBestOf, points: [] }); };

  return (
    <section className={`${calcCard} space-y-4`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField label="Sport" value={saved.sport} onChange={(v) => choose(v as ScoreSportId)} options={SCORE_SPORTS.map((entry) => ({ value: entry.id, label: entry.label }))} />
        <SelectField label="Match length" value={String(saved.bestOf)} onChange={(v) => setSaved({ ...saved, bestOf: Number(v), points: [] })} options={sport.bestOfChoices.map((n) => ({ value: String(n), label: n === 1 ? 'Single game' : `Best of ${n}` }))} />
        <div className="text-xs font-semibold text-slate-700 sm:self-end"><span className="block rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] font-normal text-slate-600">{isTennis ? 'Points go 15, 30, 40 with deuce. Sets are to 6 games with a tie-break at 6-6.' : `Games to ${sport.rules?.to}${sport.rules?.decidingTo ? `, deciding set to ${sport.rules.decidingTo}` : ''}, win by ${sport.rules?.winBy}${sport.rules?.cap ? `, capped at ${sport.rules.cap}` : ''}.`}</span></div>
      </div>

      <p className="text-center text-sm font-bold uppercase tracking-wide text-slate-500" aria-live="polite">{view.heading}</p>

      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((side) => (
          <div key={side} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <label className="block text-[11px] font-semibold text-slate-500">
              <span className="sr-only">Name of side {side + 1}</span>
              <input value={saved.names[side]} maxLength={24} onChange={(event) => { const names: [string, string] = [saved.names[0], saved.names[1]]; names[side] = event.target.value; setSaved({ ...saved, names }); }} className={`${smallInput} mt-0 text-center text-sm font-bold`} />
            </label>
            <p className="mt-2 text-6xl font-black tabular-nums leading-none text-slate-900 sm:text-7xl" aria-label={`${saved.names[side]} score`}>{view.now[side]}</p>
            <p className="mt-2 text-xs text-slate-600">{isTennis ? `Games ${view.inSet?.[side] ?? 0}` : ''} {isTennis ? '· ' : ''}{sport.rules?.unit === 'set' ? 'Sets' : isTennis ? 'Sets' : 'Games'} {view.won[side]}</p>
            <button type="button" onClick={() => add(side)} disabled={view.winner !== null} aria-label={`Add a point for ${saved.names[side]}`} className={`${primaryButton} mt-3 w-full text-lg`}>+1 point</button>
          </div>
        ))}
      </div>

      {view.winner !== null && <p role="status" className="rounded-xl bg-green-50 px-3 py-3 text-center text-base font-black text-green-800">{saved.names[view.winner]} wins the match {view.won[view.winner]}-{view.won[(1 - view.winner) as Side]}</p>}
      {view.winner === null && view.hint && <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-900">{view.hint}</p>}
      {finishedNote && <p className="text-center text-xs text-slate-600">{finishedNote}</p>}

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={undo} disabled={saved.points.length === 0} className={ghostButton}><Undo2 className="h-4 w-4" aria-hidden="true" />Undo last point</button>
        <ConfirmButton label="New match" confirmLabel="Tap again to start a new match" onConfirm={reset} disabled={saved.points.length === 0} />
      </div>
      <p className="text-center text-[11px] text-slate-500">The score is kept on this device, so it survives a closed tab. It does not keep track of who is serving.</p>
    </section>
  );
};

export default MatchScoreKeeper;
