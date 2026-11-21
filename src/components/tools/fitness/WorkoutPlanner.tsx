import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Play, Trash2 } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { EXERCISES } from '../../../lib/fitness/exercises';
import {
  BLOCKS, buildSlides, clampSeconds, emptyPlan, formatDuration, itemFromExercise, planItemCount, planToText, readSavedPlan, totalSeconds,
  type BlockId, type WorkoutItem, type WorkoutPlan,
} from '../../../lib/fitness/workout';
import { QUICK_STARTS, type QuickStart } from '../../../lib/fitness/workoutStarts';
import { WorkoutBlockEditor } from './WorkoutBlockEditor';
import { DEFAULT_SHOW, WorkoutPlayer, type ShowOptions } from './WorkoutPlayer';

const STORAGE_KEY = 'mdu-workout-plan-v1';
const FIELD = 'min-h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100';
const LABEL = 'block space-y-1 text-xs font-bold text-stone-700';
const START_GROUP: Record<BlockId, 'all' | 'stretching' | 'cardio'> = { warmup: 'cardio', main: 'all', cooldown: 'stretching' };
const BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));

const SHOW_LABELS: Array<[keyof ShowOptions, string]> = [
  ['date', 'Date'], ['title', 'Workout name'], ['place', 'Gym or trainer name'], ['pictures', 'Pictures'], ['muscles', 'Muscles worked'],
  ['steps', 'How-to steps'], ['timer', 'Countdown timer'], ['next', 'Next exercise'], ['light', 'Light screen (default is dark)'],
];

function loadPlan(): WorkoutPlan {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return (raw ? readSavedPlan(JSON.parse(raw)) : null) ?? emptyPlan();
  } catch {
    return emptyPlan();
  }
}

const planFromStart = (start: QuickStart, keep: WorkoutPlan): WorkoutPlan => {
  const toItems = (ids: string[]): WorkoutItem[] => ids.flatMap((id) => { const exercise = BY_ID.get(id); return exercise ? [itemFromExercise(exercise)] : []; });
  return { ...keep, title: start.title, blocks: { warmup: toItems(start.blocks.warmup), main: toItems(start.blocks.main), cooldown: toItems(start.blocks.cooldown) } };
};

export const WorkoutPlanner: React.FC = () => {
  const [plan, setPlan] = useState<WorkoutPlan>(loadPlan);
  const [previous, setPrevious] = useState<WorkoutPlan | null>(null);
  const [notice, setNotice] = useState('');
  const [show, setShow] = useState<ShowOptions>(DEFAULT_SHOW);
  const [work, setWork] = useState(40);
  const [rest, setRest] = useState(15);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)); } catch { /* the plan still works without saving */ }
  }, [plan]);

  const timing = useMemo(() => ({ work: clampSeconds(work, 5, 600, 40), rest: clampSeconds(rest, 0, 300, 15) }), [work, rest]);
  const count = planItemCount(plan);
  const duration = useMemo(() => formatDuration(totalSeconds(buildSlides(plan, timing))), [plan, timing]);
  const close = useCallback(() => setPlaying(false), []);

  const setBlock = (id: BlockId, items: WorkoutItem[]) => setPlan((current) => ({ ...current, blocks: { ...current.blocks, [id]: items } }));
  const applyStart = (start: QuickStart) => {
    setPrevious(plan);
    setPlan((current) => planFromStart(start, current));
    setNotice(`Loaded ${start.label}. Change anything below.`);
  };
  const clearAll = () => {
    setPrevious(plan);
    setPlan((current) => ({ ...current, blocks: { warmup: [], main: [], cooldown: [] } }));
    setNotice('Cleared the exercises.');
  };
  const undo = () => {
    if (previous) setPlan(previous);
    setPrevious(null);
    setNotice('Undone.');
  };
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(planToText(plan));
      setNotice('Copied. Paste it into a chat or a note.');
    } catch {
      setNotice('Could not copy here. Select the plan and copy it by hand.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={LABEL}>Workout name<input type="text" value={plan.title} onChange={(event) => setPlan({ ...plan, title: event.target.value })} className={FIELD} /></label>
          <label className={LABEL}>Gym or trainer (optional)<input type="text" value={plan.place} onChange={(event) => setPlan({ ...plan, place: event.target.value })} placeholder="For example your gym name" className={FIELD} /></label>
          <label className={LABEL}>Date<input type="date" value={plan.date} onChange={(event) => setPlan({ ...plan, date: event.target.value })} className={FIELD} /></label>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-black text-stone-900">Quick start</h2>
          <p className="text-xs text-stone-500">Pick a ready plan, then add, remove or reorder anything. Every list can be changed.</p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_STARTS.map((start) => (
              <li key={start.id}>
                <button type="button" onClick={() => applyStart(start)} className="h-full w-full rounded-xl border border-orange-200 bg-white p-3 text-left transition hover:border-orange-400 hover:bg-orange-50">
                  <span className="block text-sm font-bold text-stone-900">{start.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-stone-500">{start.blurb}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {notice && (
          <p role="status" className="flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-900">
            {notice}
            {previous && <button type="button" onClick={undo} className="underline">Undo</button>}
          </p>
        )}
      </section>

      {BLOCKS.map((block) => (
        <WorkoutBlockEditor key={block.id} label={block.label} hint={block.hint} items={plan.blocks[block.id]} onChange={(items) => setBlock(block.id, items)} startGroup={START_GROUP[block.id]} />
      ))}

      <section className={`${calcCard} space-y-4`}>
        <h2 className="text-sm font-black text-stone-900">What the screen shows</h2>
        <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
          {SHOW_LABELS.map(([key, label]) => (
            <label key={key} className="flex min-h-9 items-center gap-2 text-sm text-stone-800">
              <input type="checkbox" checked={show[key]} onChange={(event) => setShow({ ...show, [key]: event.target.checked })} className="h-4 w-4 accent-orange-700" />
              {label}
            </label>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={LABEL}>Seconds per exercise<input type="number" inputMode="numeric" min={5} max={600} value={work} onChange={(event) => setWork(Number(event.target.value))} className={FIELD} /></label>
          <label className={LABEL}>Rest between exercises (seconds, 0 for none)<input type="number" inputMode="numeric" min={0} max={300} value={rest} onChange={(event) => setRest(Number(event.target.value))} className={FIELD} /></label>
        </div>
        <p className="text-sm font-semibold text-stone-800">{count === 0 ? 'Add some exercises to start.' : `${count} ${count === 1 ? 'exercise' : 'exercises'}, about ${duration} on screen.`}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPlaying(true)} disabled={count === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500">
            <Play className="h-4 w-4" aria-hidden="true" />Start slideshow
          </button>
          <button type="button" onClick={() => void copyText()} disabled={count === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-orange-300 px-4 py-2.5 text-sm font-bold text-orange-800 hover:bg-orange-50 disabled:opacity-50"><Copy className="h-4 w-4" aria-hidden="true" />Copy plan as text</button>
          <button type="button" onClick={clearAll} disabled={count === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-50"><Trash2 className="h-4 w-4" aria-hidden="true" />Clear exercises</button>
        </div>
        <Note>Your plan is saved only in this browser. The slideshow fills the screen and tries to keep it awake; use the arrow keys, space bar or the buttons to move, pause and close. This is general information, not medical advice: start light, keep good form and stop if something hurts.</Note>
      </section>

      {playing && <WorkoutPlayer plan={plan} timing={timing} show={show} onClose={close} />}
    </div>
  );
};

export default WorkoutPlanner;
