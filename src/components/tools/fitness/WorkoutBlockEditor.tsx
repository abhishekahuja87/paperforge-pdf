import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { EQUIPMENT, EXERCISES, GROUPS, filterExercises, imageUrl, type ExerciseGroup } from '../../../lib/fitness/exercises';
import { customItem, itemFromExercise, type WorkoutItem } from '../../../lib/fitness/workout';

const FIELD = 'min-h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100';
const SMALL_BUTTON = 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40';
const chipClass = (on: boolean) => `min-h-8 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'}`;

interface Props {
  label: string;
  hint: string;
  items: WorkoutItem[];
  onChange: (items: WorkoutItem[]) => void;
  /** Which exercise group the picker opens on. */
  startGroup: ExerciseGroup | 'all';
}

/** One part of the day (warm-up, main workout or cool-down): its list, a picker for the Exercise Library, and a form for your own entries. */
export const WorkoutBlockEditor: React.FC<Props> = ({ label, hint, items, onChange, startGroup }) => {
  const [group, setGroup] = useState<ExerciseGroup | 'all'>(startGroup);
  const [query, setQuery] = useState('');
  const [ownName, setOwnName] = useState('');
  const [ownNote, setOwnNote] = useState('');

  const choices = useMemo(() => filterExercises({ group, equipment: 'all', level: 'all', query }), [group, query]);
  const shown = choices.slice(0, 40);

  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    onChange(next);
  };
  const setDetail = (key: string, detail: string) => onChange(items.map((item) => (item.key === key ? { ...item, detail } : item)));
  const addOwn = () => {
    if (ownName.trim() === '') return;
    onChange([...items, customItem(ownName, ownNote)]);
    setOwnName('');
    setOwnNote('');
  };

  return (
    <section className="space-y-2 rounded-2xl border border-stone-200 bg-white/70 p-3 sm:p-4" aria-label={label}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-black tracking-tight text-stone-900">{label} <span className="text-xs font-semibold text-stone-500">({items.length})</span></h3>
        <p className="text-[11px] text-stone-500">{hint}</p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">Nothing here yet. Pick a quick start above or add exercises below.</p>
      ) : (
        <ol className="space-y-1.5">
          {items.map((item, index) => (
            <li key={item.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[11px] font-bold text-orange-800">{index + 1}</span>
              {item.exerciseId
                ? <img src={imageUrl(item.exerciseId, 0)} alt="" width={48} height={32} loading="lazy" className="h-8 w-12 shrink-0 rounded object-cover" />
                : <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded bg-stone-100 text-[9px] font-semibold text-stone-500">No picture</span>}
              <span className="min-w-0 flex-1 basis-32 truncate text-sm font-semibold text-stone-900">{item.name}</span>
              <input type="text" value={item.detail} onChange={(event) => setDetail(item.key, event.target.value)} placeholder="Sets, reps or a note" aria-label={`Note for ${item.name}`} className={`${FIELD} !min-h-8 basis-40 !py-1 text-xs sm:w-44 sm:flex-none`} />
              <span className="flex gap-1">
                <button type="button" className={SMALL_BUTTON} aria-label={`Move ${item.name} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" className={SMALL_BUTTON} aria-label={`Move ${item.name} down`} disabled={index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" className={SMALL_BUTTON} aria-label={`Remove ${item.name}`} onClick={() => onChange(items.filter((entry) => entry.key !== item.key))}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
              </span>
            </li>
          ))}
        </ol>
      )}

      <details className="group rounded-xl border border-stone-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-800 [&::-webkit-details-marker]:hidden"><Plus className="h-4 w-4" aria-hidden="true" />Add from the exercise list ({EXERCISES.length} exercises)</summary>
        <div className="space-y-2 border-t border-stone-200 p-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Exercise group">
            <button type="button" className={chipClass(group === 'all')} onClick={() => setGroup('all')}>All</button>
            {GROUPS.map((entry) => <button key={entry.id} type="button" className={chipClass(group === entry.id)} onClick={() => setGroup(entry.id)}>{entry.label}</button>)}
          </div>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or muscle" aria-label={`Search exercises for ${label}`} className={FIELD} />
          {shown.length === 0 ? <p className="text-xs text-stone-500">No exercise matches. Add your own below.</p> : (
            <ul className="grid max-h-72 gap-1.5 overflow-y-auto sm:grid-cols-2">
              {shown.map((exercise) => (
                <li key={exercise.id}>
                  <button type="button" onClick={() => onChange([...items, itemFromExercise(exercise)])} className="flex w-full items-center gap-2 rounded-lg border border-stone-200 bg-white p-1.5 text-left hover:border-orange-300 hover:bg-orange-50">
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

      <details className="group rounded-xl border border-stone-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-800 [&::-webkit-details-marker]:hidden"><Plus className="h-4 w-4" aria-hidden="true" />Add your own (not in the list)</summary>
        <div className="space-y-2 border-t border-stone-200 p-3">
          <p className="text-[11px] leading-4 text-stone-500">Type any name, for example foam rolling or yoga flow, and a note such as the time or the reason. These show on the slide without a picture.</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input type="text" value={ownName} onChange={(event) => setOwnName(event.target.value)} placeholder="Exercise name" aria-label={`Your own exercise for ${label}`} className={FIELD} />
            <input type="text" value={ownNote} onChange={(event) => setOwnNote(event.target.value)} placeholder="Note, for example 5 minutes" aria-label="Note for your own exercise" className={FIELD} />
            <button type="button" onClick={addOwn} disabled={ownName.trim() === ''} className="min-h-10 rounded-lg bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:bg-stone-300 disabled:text-stone-500">Add</button>
          </div>
        </div>
      </details>
    </section>
  );
};
