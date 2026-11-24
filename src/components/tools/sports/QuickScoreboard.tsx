import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Pause, Play, Plus, Undo2 } from 'lucide-react';
import { calcCard, SelectField } from '../../finance/ui';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { QUICK_GAMES, clockText, elapsed, gameInfo, leader, totals, type Entry, type Side } from '../../../lib/sports/quickScore';
import { ConfirmButton } from '../shared/ConfirmButton';
import { FullscreenButton } from '../shared/FullscreenButton';
import { ghostButton, primaryButton, smallInput } from '../shared/toolStyles';

interface Saved { game: string; names: [string, string]; log: Entry[]; period: number; fouls: [number, number]; banked: number; startedAt: number | null }
const DEFAULT: Saved = { game: 'basketball', names: ['Home', 'Away'], log: [], period: 0, fouls: [0, 0], banked: 0, startedAt: null };

const read = (value: unknown): Saved | null => {
  const v = value as Partial<Saved> | null;
  if (!v || typeof v.game !== 'string' || !Array.isArray(v.log) || !Array.isArray(v.names)) return null;
  const log = v.log.filter((e): e is Entry => !!e && (e.side === 0 || e.side === 1) && typeof e.points === 'number').slice(0, 3000);
  const fouls = Array.isArray(v.fouls) ? [Math.max(0, Number(v.fouls[0]) || 0), Math.max(0, Number(v.fouls[1]) || 0)] as [number, number] : [0, 0] as [number, number];
  return { game: gameInfo(v.game).id, names: [String(v.names[0] ?? 'Home').slice(0, 20), String(v.names[1] ?? 'Away').slice(0, 20)], log, period: Math.max(0, Math.floor(Number(v.period) || 0)), fouls, banked: Math.max(0, Number(v.banked) || 0), startedAt: typeof v.startedAt === 'number' ? v.startedAt : null };
};

export const QuickScoreboard: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-quick-scoreboard-v1', DEFAULT, read);
  const [now, setNow] = useState(() => Date.now());
  const board = useRef<HTMLDivElement>(null);
  const game = gameInfo(saved.game);
  const score = useMemo(() => totals(saved.log), [saved.log]);
  const ahead = leader(score);
  const running = saved.startedAt !== null;
  const period = game.periods[Math.min(saved.period, game.periods.length - 1)];

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  const add = (side: Side, points: number) => setSaved({ ...saved, log: [...saved.log, { side, points }] });
  const setName = (side: Side, value: string) => { const names: [string, string] = [saved.names[0], saved.names[1]]; names[side] = value; setSaved({ ...saved, names }); };
  const setFouls = (side: Side, change: number) => { const fouls: [number, number] = [saved.fouls[0], saved.fouls[1]]; fouls[side] = Math.max(0, fouls[side] + change); setSaved({ ...saved, fouls }); };
  const toggleClock = () => {
    const t = Date.now();
    setNow(t);
    setSaved(running ? { ...saved, banked: elapsed(saved.banked, saved.startedAt, t), startedAt: null } : { ...saved, startedAt: t });
  };
  const newGame = () => setSaved({ ...DEFAULT, game: saved.game, names: saved.names });
  const choose = (id: string) => setSaved({ ...DEFAULT, game: id, names: saved.names });

  return (
    <section className={`${calcCard} space-y-4`}>
      <SelectField label="Game" value={saved.game} onChange={choose} options={QUICK_GAMES.map((entry) => ({ value: entry.id, label: entry.label }))} />

      <div ref={board} className="space-y-3 bg-[var(--theme-surface)] p-1">
        <div className="flex flex-wrap items-center justify-center gap-3 text-center">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">{period}</span>
          <span className="text-2xl font-black tabular-nums text-slate-900" aria-label="Game clock">{clockText(elapsed(saved.banked, saved.startedAt, now))}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([0, 1] as const).map((side) => (
            <div key={side} className={`rounded-2xl border bg-white p-3 text-center ${ahead === side ? 'border-orange-300' : 'border-slate-200'}`}>
              <label className="block"><span className="sr-only">Name of side {side + 1}</span>
                <input value={saved.names[side]} maxLength={20} onChange={(event) => setName(side, event.target.value)} className={`${smallInput} mt-0 text-center text-sm font-bold`} />
              </label>
              <p className="mt-2 text-7xl font-black tabular-nums leading-none text-slate-900 sm:text-8xl" aria-label={`${saved.names[side]} score`} aria-live="polite">{score[side]}</p>
              <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${game.buttons.length}, minmax(0, 1fr))` }}>
                {game.buttons.map((points) => <button key={points} type="button" onClick={() => add(side, points)} aria-label={`Add ${points} to ${saved.names[side]}`} className={`${primaryButton} min-h-14 text-lg`}>+{points}</button>)}
              </div>
              {game.fouls && (
                <p className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
                  Fouls
                  <button type="button" onClick={() => setFouls(side, -1)} aria-label={`Remove a foul from ${saved.names[side]}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"><Minus className="h-4 w-4" aria-hidden="true" /></button>
                  <span className="min-w-6 text-base font-black text-slate-900">{saved.fouls[side]}</span>
                  <button type="button" onClick={() => setFouls(side, 1)} aria-label={`Add a foul to ${saved.names[side]}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"><Plus className="h-4 w-4" aria-hidden="true" /></button>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-500">{game.help}</p>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setSaved({ ...saved, log: saved.log.slice(0, -1) })} disabled={saved.log.length === 0} className={ghostButton}><Undo2 className="h-4 w-4" aria-hidden="true" />Undo last score</button>
        <button type="button" onClick={toggleClock} className={ghostButton}>{running ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{running ? 'Pause clock' : 'Start clock'}</button>
        <button type="button" onClick={() => setSaved({ ...saved, banked: 0, startedAt: null })} disabled={!running && saved.banked === 0} className={ghostButton}>Reset clock</button>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">Period
          <select value={saved.period} onChange={(event) => setSaved({ ...saved, period: Number(event.target.value) })} className="min-h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm">
            {game.periods.map((name, index) => <option key={name} value={index}>{name}</option>)}
          </select>
        </label>
        <FullscreenButton target={board} />
        <ConfirmButton label="New game" confirmLabel="Tap again to start a new game" onConfirm={newGame} disabled={saved.log.length === 0 && saved.banked === 0 && !running && saved.fouls[0] === 0 && saved.fouls[1] === 0} />
      </div>
      <p className="text-center text-[11px] text-slate-500">The score, names and clock are saved on this device, so they are still here if you close the page.</p>
    </section>
  );
};

export default QuickScoreboard;
