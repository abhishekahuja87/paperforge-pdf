import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { calcCard } from '../../finance/ui';
import {
  EQUIPMENT, EXERCISES, GROUPS, LEVELS, filterExercises, imageUrl,
  type Exercise, type ExerciseEquipment, type ExerciseGroup, type ExerciseLevel,
} from '../../../lib/fitness/exercises';

const CHIP = 'min-h-9 rounded-full border px-3 py-1.5 text-xs font-semibold transition';
const chipClass = (on: boolean) => `${CHIP} ${on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`;

/**
 * Two photos per exercise (start and end position) fade into each other in a loop, so each card shows the movement.
 * Images load as they scroll into view. With "reduce motion" on, the start photo is shown still.
 */
const ANIMATION_CSS = `
.mdu-ex-b { animation: mdu-ex-fade 3.4s ease-in-out infinite; }
@keyframes mdu-ex-fade { 0%, 30% { opacity: 0; } 50%, 80% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .mdu-ex-b { animation: none; opacity: 0; } }
`;

const Card: React.FC<{ item: Exercise }> = ({ item }) => {
  const equipment = EQUIPMENT.find((entry) => entry.id === item.equipment)?.label ?? '';
  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="relative aspect-[3/2] bg-slate-100">
        <img src={imageUrl(item.id, 0)} alt={`${item.name}: start and end position`} width={360} height={240} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <img src={imageUrl(item.id, 1)} alt="" aria-hidden="true" width={360} height={240} loading="lazy" decoding="async" className="mdu-ex-b absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="space-y-2 p-3">
        <h3 className="text-sm font-bold leading-snug text-slate-900">{item.name}</h3>
        <p className="text-xs text-slate-600"><span className="font-semibold text-slate-700">Works:</span> {[...item.muscles, ...item.secondary.map((muscle) => `${muscle} (helps)`)].join(', ')}</p>
        <p className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{equipment}</span>
          <span className="rounded-full bg-orange-50 px-2 py-0.5 capitalize text-orange-800">{item.level}</span>
        </p>
        <details className="group">
          <summary className="cursor-pointer list-none text-xs font-bold text-orange-700 [&::-webkit-details-marker]:hidden">How to do it <span aria-hidden="true" className="inline-block transition group-open:rotate-45">+</span></summary>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-5 text-slate-700">
            {item.steps.map((step, index) => <li key={index}>{step}</li>)}
          </ol>
        </details>
      </div>
    </li>
  );
};

export const ExerciseLibrary: React.FC = () => {
  const [group, setGroup] = useState<ExerciseGroup | 'all'>('all');
  const [equipment, setEquipment] = useState<ExerciseEquipment | 'all'>('all');
  const [level, setLevel] = useState<ExerciseLevel | 'all'>('all');
  const [query, setQuery] = useState('');

  const results = useMemo(() => filterExercises({ group, equipment, level, query }), [group, equipment, level, query]);
  const counts = useMemo(() => Object.fromEntries(GROUPS.map((entry) => [entry.id, EXERCISES.filter((item) => item.group === entry.id).length])) as Record<ExerciseGroup, number>, []);
  const reset = () => { setGroup('all'); setEquipment('all'); setLevel('all'); setQuery(''); };

  return (
    <section className={calcCard}>
      <style>{ANIMATION_CSS}</style>

      <label className="relative block">
        <span className="sr-only">Search exercises or muscles</span>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" aria-hidden="true" />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search an exercise or a muscle, for example squat or biceps" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900" />
      </label>

      <div role="group" aria-label="Body area" className="mt-3 flex flex-wrap gap-2">
        <button type="button" aria-pressed={group === 'all'} onClick={() => setGroup('all')} className={chipClass(group === 'all')}>All ({EXERCISES.length})</button>
        {GROUPS.map((entry) => (
          <button key={entry.id} type="button" aria-pressed={group === entry.id} onClick={() => setGroup(entry.id)} className={chipClass(group === entry.id)}>{entry.label} ({counts[entry.id]})</button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div role="group" aria-label="Equipment" className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Equipment</span>
          <button type="button" aria-pressed={equipment === 'all'} onClick={() => setEquipment('all')} className={chipClass(equipment === 'all')}>Any</button>
          {EQUIPMENT.map((entry) => <button key={entry.id} type="button" aria-pressed={equipment === entry.id} onClick={() => setEquipment(entry.id)} className={chipClass(equipment === entry.id)}>{entry.label}</button>)}
        </div>
        <div role="group" aria-label="Level" className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Level</span>
          <button type="button" aria-pressed={level === 'all'} onClick={() => setLevel('all')} className={chipClass(level === 'all')}>Any</button>
          {LEVELS.map((entry) => <button key={entry.id} type="button" aria-pressed={level === entry.id} onClick={() => setLevel(entry.id)} className={chipClass(level === entry.id)}>{entry.label}</button>)}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-600" aria-live="polite">
        {results.length} exercise{results.length === 1 ? '' : 's'}
        {(group !== 'all' || equipment !== 'all' || level !== 'all' || query) && <> · <button type="button" onClick={reset} className="font-bold text-orange-700 underline">Clear filters</button></>}
      </p>

      {results.length === 0 && <p role="status" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">No exercise matches. Try a different word or clear the filters.</p>}

      {GROUPS.map((entry) => {
        const list = results.filter((item) => item.group === entry.id);
        if (list.length === 0) return null;
        return (
          <section key={entry.id} id={`group-${entry.id}`} className="mt-6 scroll-mt-20">
            <h2 className="text-base font-bold text-slate-900">{entry.label} <span className="text-xs font-semibold text-slate-500">({list.length})</span></h2>
            <p className="mb-3 text-xs text-slate-600">{entry.blurb}</p>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {list.map((item) => <Card key={item.id} item={item} />)}
            </ul>
          </section>
        );
      })}

      <p className="mt-6 text-center text-[11px] text-slate-500">
        General information, not medical advice. Start light, keep good form and stop if something hurts. Photos and instructions come from the public-domain free-exercise-db project.
      </p>
    </section>
  );
};

export default ExerciseLibrary;
