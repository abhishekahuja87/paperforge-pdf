import React, { useCallback, useState } from 'react';
import { Maximize, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { beep } from '../../../lib/screens/beep';
import { bool, isRecord, num, str } from '../../../lib/screens/read';
import { clampScore, ordered, ranks, type Team } from '../../../lib/screens/scores';
import { THEME_STYLES } from '../../../lib/screens/themes';
import { readTheme, type Theme } from '../../../lib/screens/timed';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { WHEEL_COLOURS } from '../../../lib/screens/wheel';
import { ThemePicker } from '../shared/ThemePicker';
import { LogoField } from './LogoField';
import { rowId } from './RowsEditor';
import { ScreenShell } from './ScreenShell';
import { CHECK, FIELD, LABEL, ORANGE, OUTLINE, SMALL_BUTTON } from './ui';

interface Saved { title: string; teams: Team[]; step: number; sort: boolean; sound: boolean; theme: Theme; logo: string }
const team = (name: string): Team => ({ id: rowId(), name, score: 0 });
const DEFAULTS: Saved = { title: 'Scoreboard', teams: [], step: 1, sort: false, sound: true, theme: 'dark', logo: '' };
const read = (value: unknown): Saved | null => {
  if (!isRecord(value)) return null;
  const teams = Array.isArray(value.teams) ? value.teams.filter(isRecord).slice(0, 12).map((entry) => ({ id: str(entry.id) || rowId(), name: str(entry.name), score: clampScore(num(entry.score, 0)) })) : [];
  return { title: str(value.title, 'Scoreboard'), teams, step: Math.max(1, Math.min(1000, num(value.step, 1))), sort: bool(value.sort, false), sound: bool(value.sound, true), theme: readTheme(value.theme), logo: str(value.logo) };
};
const MAX_TEAMS = 12;
const ordinal = (rank: number) => (rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`);

/** A scoreboard for team games, quizzes and sports days. Tap a team to add points; show it big on the class or hall screen. */
export const Scoreboard: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-scores-v1', DEFAULTS, read);
  const [full, setFull] = useState(false);
  const close = useCallback(() => setFull(false), []);
  const { teams, step } = saved;
  const style = THEME_STYLES[saved.theme];
  const rank = ranks(teams);
  const shown = ordered(teams, saved.sort);

  const change = useCallback((id: string, by: number) => {
    setSaved((current) => ({ ...current, teams: current.teams.map((entry) => (entry.id === id ? { ...entry, score: clampScore(entry.score + by) } : entry)) }));
    if (saved.sound) beep(by > 0 ? 880 : 440, 90);
  }, [setSaved, saved.sound]);
  const rename = (id: string, name: string) => setSaved({ ...saved, teams: teams.map((entry) => (entry.id === id ? { ...entry, name } : entry)) });
  const add = () => teams.length < MAX_TEAMS && setSaved({ ...saved, teams: [...teams, team(`Team ${teams.length + 1}`)] });
  const quick = (names: string[]) => setSaved({ ...saved, teams: names.map(team) });

  const onKey = useCallback((event: KeyboardEvent) => {
    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= 9) { const target = teams[digit - 1]; if (target) change(target.id, step); }
  }, [teams, change, step]);

  const bar = <p className="rounded-full bg-black/25 px-4 py-2 text-sm font-semibold text-white">Tap a team to add {step}. Keys 1 to {Math.min(9, teams.length) || 1} add too.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        {teams.length === 0 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => quick(['Red', 'Blue', 'Green', 'Yellow'])} className={OUTLINE}>4 house teams</button>
            <button type="button" onClick={() => quick(['Team A', 'Team B'])} className={OUTLINE}>2 teams</button>
            <button type="button" onClick={() => quick(['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6'])} className={OUTLINE}>6 groups</button>
          </div>
        )}
        <ul className="space-y-2">
          {teams.map((entry, index) => (
            <li key={entry.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 p-2">
              <span aria-hidden="true" className="h-6 w-2 rounded-full" style={{ background: WHEEL_COLOURS[index % WHEEL_COLOURS.length] }} />
              <input type="text" aria-label={`Name of team ${index + 1}`} value={entry.name} onChange={(event) => rename(entry.id, event.target.value)} className={`${FIELD} min-w-0 flex-1`} />
              <button type="button" aria-label={`Take ${step} from ${entry.name}`} onClick={() => change(entry.id, -step)} className={SMALL_BUTTON}><Minus className="h-4 w-4" aria-hidden="true" /></button>
              <span className="w-16 text-center text-xl font-black tabular-nums text-stone-900" aria-label={`${entry.name} score`}>{entry.score}</span>
              <button type="button" aria-label={`Add ${step} to ${entry.name}`} onClick={() => change(entry.id, step)} className={SMALL_BUTTON}><Plus className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" aria-label={`Remove ${entry.name}`} onClick={() => setSaved({ ...saved, teams: teams.filter((item) => item.id !== entry.id) })} className={SMALL_BUTTON}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={add} disabled={teams.length >= MAX_TEAMS} className={ORANGE}><Plus className="h-4 w-4" aria-hidden="true" />Add a team</button>
          <button type="button" onClick={() => setFull(true)} disabled={teams.length === 0} className={OUTLINE}><Maximize className="h-4 w-4" aria-hidden="true" />Show on the big screen</button>
          <button type="button" onClick={() => setSaved({ ...saved, teams: teams.map((entry) => ({ ...entry, score: 0 })) })} disabled={teams.every((entry) => entry.score === 0)} className={OUTLINE}><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset scores</button>
        </div>
      </section>
      <section className={`${calcCard} space-y-4`}>
        <h2 className="text-sm font-black text-stone-900">Settings</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={LABEL}>Heading<input type="text" value={saved.title} onChange={(event) => setSaved({ ...saved, title: event.target.value })} className={FIELD} /></label>
          <label className={LABEL}>Points for each tap<input type="number" inputMode="numeric" min={1} max={1000} value={step} onChange={(event) => setSaved({ ...saved, step: Math.max(1, Math.min(1000, Math.round(Number(event.target.value)) || 1)) })} className={FIELD} /></label>
        </div>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <label className={CHECK}><input type="checkbox" checked={saved.sort} onChange={(event) => setSaved({ ...saved, sort: event.target.checked })} className="h-4 w-4 accent-orange-700" />Show the highest score first</label>
          <label className={CHECK}><input type="checkbox" checked={saved.sound} onChange={(event) => setSaved({ ...saved, sound: event.target.checked })} className="h-4 w-4 accent-orange-700" />Small beep for each point</label>
        </div>
        <ThemePicker name="scores-theme" value={saved.theme} onChange={(theme) => setSaved({ ...saved, theme })} />
        <LogoField logo={saved.logo} onChange={(logo) => setSaved({ ...saved, logo })} />
        <Note>Up to {MAX_TEAMS} teams. Teams on the same score share a place. The scores are saved only in this browser, so a refresh keeps them. Nothing is sent anywhere.</Note>
      </section>
      {full && (
        <ScreenShell surface={style.surface} label="Scoreboard" onClose={close} bar={bar} onKey={onKey} logo={saved.logo || undefined}>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-10">
            <h2 className="text-center text-[clamp(1.6rem,4.5vw,3.6rem)] font-black leading-tight">{saved.title.trim() || 'Scoreboard'}</h2>
            <ul className={`m-auto grid w-full max-w-6xl gap-3 ${shown.length > 4 ? 'grid-cols-2 lg:grid-cols-3' : shown.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {shown.map((entry) => {
                const index = teams.findIndex((item) => item.id === entry.id);
                const first = rank[entry.id] === 1 && entry.score !== 0;
                return (
                  <li key={entry.id} className={`flex flex-col items-center rounded-3xl border-2 p-3 text-center ${first ? style.now : style.card}`} style={{ borderLeftColor: WHEEL_COLOURS[index % WHEEL_COLOURS.length], borderLeftWidth: 12 }}>
                    <button type="button" onClick={() => change(entry.id, step)} aria-label={`Add ${step} to ${entry.name}`} className="w-full rounded-2xl py-1">
                      <span className="block break-words text-[clamp(1.2rem,3.4vw,2.6rem)] font-bold leading-tight">{entry.name || `Team ${index + 1}`}{saved.sort && entry.score !== 0 && <span className="ml-2 text-[0.6em] opacity-80">{ordinal(rank[entry.id]!)}</span>}</span>
                      <span className="block text-[clamp(3.5rem,12vw,9rem)] font-black leading-none tabular-nums">{entry.score}</span>
                    </button>
                    <button type="button" onClick={() => change(entry.id, -step)} aria-label={`Take ${step} from ${entry.name}`} className={`mt-1 flex h-10 w-16 items-center justify-center rounded-full ${style.btn}`}><Minus className="h-5 w-5" aria-hidden="true" /></button>
                  </li>
                );
              })}
            </ul>
          </div>
        </ScreenShell>
      )}
    </div>
  );
};

export default Scoreboard;
