import React, { useCallback, useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { bool, isRecord, num, str } from '../../../lib/screens/read';
import { buildIntervalSlides, clampInt, formatDuration, totalSeconds, type IntervalConfig } from '../../../lib/screens/timed';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { PresetGrid, type Preset } from './PresetGrid';
import { TimedPlayer } from './TimedPlayer';
import { CHECK, FIELD, LABEL, ORANGE } from './ui';

interface Settings { prepare: number; work: number; rest: number; rounds: number; sets: number; setRest: number; names: string; sound: boolean; timer: boolean }
const DEFAULTS: Settings = { prepare: 10, work: 40, rest: 20, rounds: 8, sets: 1, setRest: 60, names: '', sound: true, timer: true };

const PRESETS: Array<Preset & { values: Partial<Settings> }> = [
  { id: 'tabata', label: 'Tabata', blurb: '20 seconds work, 10 seconds rest, 8 rounds.', values: { work: 20, rest: 10, rounds: 8, sets: 1 } },
  { id: 'hiit', label: 'HIIT', blurb: '40 seconds work, 20 seconds rest, 10 rounds.', values: { work: 40, rest: 20, rounds: 10, sets: 1 } },
  { id: 'circuit', label: 'Circuit', blurb: '45 seconds each, 15 seconds rest, 6 stations, 2 sets.', values: { work: 45, rest: 15, rounds: 6, sets: 2, setRest: 60, names: 'Squats\nPush-ups\nLunges\nPlank\nMountain climbers\nJumping jacks' } },
  { id: 'emom', label: 'Every minute (EMOM)', blurb: 'A new round every 60 seconds for 10 minutes.', values: { work: 60, rest: 0, rounds: 10, sets: 1 } },
  { id: 'boxing', label: 'Boxing rounds', blurb: '3 minute rounds, 1 minute rest, 5 rounds.', values: { work: 180, rest: 60, rounds: 5, sets: 1 } },
  { id: 'study', label: 'Study sprints', blurb: '25 minutes focus, 5 minutes break, 4 rounds.', values: { work: 1500, rest: 300, rounds: 4, sets: 1, prepare: 5 } },
];

const readSettings = (value: unknown): Settings | null => (isRecord(value) ? {
  prepare: num(value.prepare, DEFAULTS.prepare), work: num(value.work, DEFAULTS.work), rest: num(value.rest, DEFAULTS.rest), rounds: num(value.rounds, DEFAULTS.rounds), sets: num(value.sets, DEFAULTS.sets),
  setRest: num(value.setRest, DEFAULTS.setRest), names: str(value.names), sound: bool(value.sound, true), timer: bool(value.timer, true),
} : null);

export const IntervalTimer: React.FC = () => {
  const [s, setS] = usePersisted<Settings>('mdu-interval-v1', DEFAULTS, readSettings);
  const [active, setActive] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const close = useCallback(() => setPlaying(false), []);

  const config: IntervalConfig = useMemo(() => ({
    prepare: clampInt(s.prepare, 0, 120, 10), work: clampInt(s.work, 3, 7200, 40), rest: clampInt(s.rest, 0, 3600, 20), rounds: clampInt(s.rounds, 1, 99, 8), sets: clampInt(s.sets, 1, 20, 1), setRest: clampInt(s.setRest, 0, 3600, 60),
    names: s.names.split(/\r?\n/),
  }), [s]);
  const slides = useMemo(() => buildIntervalSlides(config), [config]);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => { setS({ ...s, [key]: value }); setActive(null); };
  const number = (key: 'prepare' | 'work' | 'rest' | 'rounds' | 'sets' | 'setRest', label: string, min: number, max: number) => (
    <label className={LABEL}>{label}<input type="number" inputMode="numeric" min={min} max={max} value={s[key]} onChange={(event) => set(key, Number(event.target.value))} className={FIELD} /></label>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <PresetGrid presets={PRESETS} active={active} hint="Pick a ready timer, then change any number below." onPick={(id) => { const preset = PRESETS.find((entry) => entry.id === id); if (!preset) return; setS({ ...s, ...preset.values, names: preset.values.names ?? '' }); setActive(id); }} />
      </section>
      <section className={`${calcCard} space-y-4`}>
        <h2 className="text-sm font-black text-stone-900">Your timer</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {number('work', 'Work (seconds)', 3, 7200)}
          {number('rest', 'Rest (seconds, 0 for none)', 0, 3600)}
          {number('rounds', 'Rounds', 1, 99)}
          {number('sets', 'Sets', 1, 20)}
          {number('setRest', 'Rest between sets (seconds)', 0, 3600)}
          {number('prepare', 'Get ready (seconds)', 0, 120)}
        </div>
        <label className={LABEL}>Names for each round (optional, one per line, they repeat if there are fewer than rounds)
          <textarea rows={4} value={s.names} onChange={(event) => set('names', event.target.value)} placeholder={'Squats\nPush-ups\nPlank'} className={FIELD} />
        </label>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <label className={CHECK}><input type="checkbox" checked={s.sound} onChange={(event) => set('sound', event.target.checked)} className="h-4 w-4 accent-orange-700" />Beep for the last 3 seconds and at each change</label>
          <label className={CHECK}><input type="checkbox" checked={s.timer} onChange={(event) => set('timer', event.target.checked)} className="h-4 w-4 accent-orange-700" />Show the big countdown</label>
        </div>
        <p className="text-sm font-semibold text-stone-800">{config.rounds * config.sets} work rounds, about {formatDuration(totalSeconds(slides))} in all.</p>
        <button type="button" onClick={() => setPlaying(true)} className={ORANGE}><Play className="h-4 w-4" aria-hidden="true" />Start timer</button>
        <Note>Green is work, blue is rest. Your settings are saved only in this browser. The timer fills the screen and tries to keep it awake; the sound needs the volume on. Use the arrow keys, space bar or the buttons to skip, pause and close. Exercise at a level that suits you and stop if something hurts.</Note>
      </section>
      {playing && <TimedPlayer slides={slides} label="Interval timer" showTimer={s.timer} sound={s.sound} light={false} onClose={close} />}
    </div>
  );
};

export default IntervalTimer;
