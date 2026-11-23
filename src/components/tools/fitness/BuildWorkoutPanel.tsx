import React, { useState } from 'react';
import { RefreshCw, Wand2 } from 'lucide-react';
import { EQUIPMENT_CHOICES, FOCUS_CHOICES, MINUTE_CHOICES, type BuildEquipment, type BuildFocus, type BuildOptions } from '../../../lib/fitness/buildWorkout';
import { LEVELS, type ExerciseLevel } from '../../../lib/fitness/exercises';

const chip = (on: boolean) => `min-h-9 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'}`;
const TILE_MINUTES = MINUTE_CHOICES.filter((minutes) => minutes <= 30);
const newSeed = () => Math.floor(Math.random() * 1_000_000_000);

interface Props {
  onBuild: (options: BuildOptions) => void;
  /** What was built last, so "Build another" can repeat the settings with new exercises. */
  last: BuildOptions | null;
}

/** Picks the time and whether the person has equipment, then asks the planner to fill the three lists. */
export const BuildWorkoutPanel: React.FC<Props> = ({ onBuild, last }) => {
  const [focus, setFocus] = useState<BuildFocus>('full');
  const [level, setLevel] = useState<ExerciseLevel>('beginner');
  const [minutes, setMinutes] = useState(10);
  const [equipment, setEquipment] = useState<BuildEquipment>('none');
  const build = (options: Partial<BuildOptions>) => onBuild({ minutes, equipment, focus, level, seed: newSeed(), ...options });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-black text-stone-900">Build me a workout</h2>
        <p className="mt-0.5 text-xs text-stone-500">Choose how long you have and what you have at home. A warm-up, a main part and a cool-down are picked to fit the time, and you can change every move afterwards.</p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {TILE_MINUTES.map((value) => (
          <li key={value} className="space-y-1.5 rounded-xl border border-stone-200 bg-white p-2.5">
            <p className="text-sm font-black text-stone-900">{value} minutes</p>
            <button type="button" onClick={() => { setMinutes(value); setEquipment('none'); build({ minutes: value, equipment: 'none' }); }} className="min-h-9 w-full rounded-lg bg-orange-700 px-2 py-1.5 text-xs font-bold text-white hover:bg-orange-800">No equipment</button>
            <button type="button" onClick={() => { setMinutes(value); setEquipment('home'); build({ minutes: value, equipment: 'home' }); }} className="min-h-9 w-full rounded-lg border border-orange-300 bg-white px-2 py-1.5 text-xs font-bold text-orange-800 hover:bg-orange-50">With equipment</button>
          </li>
        ))}
      </ul>
      <details className="rounded-xl border border-stone-200 bg-white">
        <summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-orange-800 [&::-webkit-details-marker]:hidden">Choose the focus, level or more time</summary>
        <div className="space-y-3 border-t border-stone-200 p-3">
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-stone-700">Focus</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Focus">{FOCUS_CHOICES.map((entry) => <button key={entry.id} type="button" aria-pressed={focus === entry.id} className={chip(focus === entry.id)} onClick={() => setFocus(entry.id)}>{entry.label}</button>)}</div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-stone-700">Level</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Level">{LEVELS.map((entry) => <button key={entry.id} type="button" aria-pressed={level === entry.id} className={chip(level === entry.id)} onClick={() => setLevel(entry.id)}>{entry.label}</button>)}</div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-stone-700">Time</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Time">{MINUTE_CHOICES.map((value) => <button key={value} type="button" aria-pressed={minutes === value} className={chip(minutes === value)} onClick={() => setMinutes(value)}>{value} min</button>)}</div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-stone-700">Equipment</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Equipment">{EQUIPMENT_CHOICES.map((entry) => <button key={entry.id} type="button" aria-pressed={equipment === entry.id} title={entry.hint} className={chip(equipment === entry.id)} onClick={() => setEquipment(entry.id)}>{entry.label}</button>)}</div>
            <p className="text-[11px] text-stone-500">{EQUIPMENT_CHOICES.find((entry) => entry.id === equipment)?.hint}</p>
          </div>
          <button type="button" onClick={() => build({})} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800"><Wand2 className="h-4 w-4" aria-hidden="true" />Build my workout</button>
        </div>
      </details>
      {last && (
        <button type="button" onClick={() => onBuild({ ...last, seed: newSeed() })} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-bold text-orange-800 hover:bg-orange-50"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Build another with the same choices</button>
      )}
    </div>
  );
};
