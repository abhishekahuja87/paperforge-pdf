import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { EQUIPMENT, EXERCISES, GROUPS, filterExercises, imageUrl, type Exercise, type ExerciseGroup } from '../../../lib/fitness/exercises';

const FIELD = 'min-h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100';
const chipClass = (on: boolean) => `min-h-8 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'}`;

interface Props {
  /** Which group the picker opens on. */
  startGroup: ExerciseGroup | 'all';
  /** Names the picker for screen readers and the search box. */
  label: string;
  onPick: (exercise: Exercise) => void;
}

/** Pick an exercise or stretch from the Exercise Library (pictures included). Used by the workout planner and the routine display. */
export const ExercisePicker: React.FC<Props> = ({ startGroup, label, onPick }) => {
  const [group, setGroup] = useState<ExerciseGroup | 'all'>(startGroup);
  const [query, setQuery] = useState('');
  const choices = useMemo(() => filterExercises({ group, equipment: 'all', level: 'all', query }), [group, query]);
  const shown = choices.slice(0, 40);

  return (
    <details className="group rounded-xl border border-stone-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-800 [&::-webkit-details-marker]:hidden"><Plus className="h-4 w-4" aria-hidden="true" />Add from the exercise list ({EXERCISES.length} exercises with pictures)</summary>
      <div className="space-y-2 border-t border-stone-200 p-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Exercise group">
          <button type="button" className={chipClass(group === 'all')} onClick={() => setGroup('all')}>All</button>
          {GROUPS.map((entry) => <button key={entry.id} type="button" className={chipClass(group === entry.id)} onClick={() => setGroup(entry.id)}>{entry.label}</button>)}
        </div>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or muscle" aria-label={`Search exercises for ${label}`} className={FIELD} />
        {shown.length === 0 ? <p className="text-xs text-stone-500">No exercise matches. Add your own instead.</p> : (
          <ul className="grid max-h-72 gap-1.5 overflow-y-auto sm:grid-cols-2">
            {shown.map((exercise) => (
              <li key={exercise.id}>
                <button type="button" onClick={() => onPick(exercise)} className="flex w-full items-center gap-2 rounded-lg border border-stone-200 bg-white p-1.5 text-left hover:border-orange-300 hover:bg-orange-50">
                  <img src={imageUrl(exercise.id, 0)} alt="" width={48} height={32} loading="lazy" className="h-8 w-12 shrink-0 rounded object-cover" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-stone-900">{exercise.name}</span><span className="block truncate text-[10px] text-stone-500">{EQUIPMENT.find((entry) => entry.id === exercise.equipment)?.label}</span></span>
                  <Plus className="h-4 w-4 shrink-0 text-orange-700" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {choices.length > shown.length && <p className="text-[11px] text-stone-500">Showing the first {shown.length} of {choices.length}. Search or pick a group to narrow the list.</p>}
      </div>
    </details>
  );
};
