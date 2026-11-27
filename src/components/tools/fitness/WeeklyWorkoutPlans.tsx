import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, MonitorPlay } from 'lucide-react';
import { calcCard, Note } from '../../common/CalcKit';
import { EQUIPMENT, EXERCISES, imageUrl } from '../../../lib/fitness/exercises';
import { PLAN_STORAGE_KEY, newKey, todayIso, type WorkoutItem, type WorkoutPlan } from '../../../lib/fitness/workout';
import { KINDS, WEEKLY_PLANS, dayMinutes, type Move, type PlanDay, type PlanKind, type WeeklyPlan } from '../../../lib/fitness/weeklyPlans';

const BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));
const CHIP = 'min-h-10 rounded-full border px-4 py-2 text-sm font-semibold transition';
const chipClass = (on: boolean) => `${CHIP} ${on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`;
const EQUIPMENT_LABEL = new Map(EQUIPMENT.map((entry) => [entry.id, entry.label]));

const nameOf = (id: string): string => BY_ID.get(id)?.name ?? id;

const toItems = (moves: Move[]): WorkoutItem[] => moves.map(([id, note]) => ({ key: newKey(), exerciseId: id, name: nameOf(id), detail: note }));

/** The Workout Planner's plan for one day, so the day can be shown on a screen there. */
const dayToPlan = (plan: WeeklyPlan, day: PlanDay): WorkoutPlan => ({
  title: `${plan.name}, ${day.title}`,
  place: '',
  date: todayIso(),
  blocks: { warmup: toItems(day.warmup), main: toItems(day.main), cooldown: toItems(day.cooldown) },
});

const dayToText = (plan: WeeklyPlan, day: PlanDay): string => {
  const part = (label: string, moves: Move[]) => `${label}\n${moves.map(([id, note]) => `- ${nameOf(id)}: ${note}`).join('\n')}`;
  return [`${plan.name}: ${day.title}`, day.focus, '', part('Warm-up', day.warmup), '', part('Main', day.main), '', part('Cool-down', day.cooldown)].join('\n');
};

const planToText = (plan: WeeklyPlan): string => `${plan.name}\n${plan.schedule}\n\n${plan.plan.map((day) => dayToText(plan, day)).join('\n\n')}`;

const MoveRow: React.FC<{ move: Move }> = ({ move: [id, note] }) => {
  const exercise = BY_ID.get(id);
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-slate-100">
        <img src={imageUrl(id, 1)} alt="" width={72} height={48} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-tight text-slate-900">{nameOf(id)}</span>
        <span className="block text-xs text-slate-600">
          {exercise && exercise.group !== 'yoga' && exercise.group !== 'stretching' ? `${EQUIPMENT_LABEL.get(exercise.equipment) ?? ''} · ` : ''}{exercise?.muscles.join(', ')}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-900">{note}</span>
    </li>
  );
};

const Part: React.FC<{ label: string; moves: Move[] }> = ({ label, moves }) => (
  <div>
    <h4 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</h4>
    <ul className="divide-y divide-slate-100">{moves.map((move, index) => <MoveRow key={`${move[0]}-${index}`} move={move} />)}</ul>
  </div>
);

export const WeeklyWorkoutPlans: React.FC = () => {
  const navigate = useNavigate();
  const [kind, setKind] = useState<PlanKind>('gym');
  const [days, setDays] = useState<3 | 4 | 5>(3);
  const [notice, setNotice] = useState('');
  const plan = useMemo(() => WEEKLY_PLANS.find((entry) => entry.kind === kind && entry.days === days) ?? WEEKLY_PLANS[0], [kind, days]);
  const kindInfo = KINDS.find((entry) => entry.id === kind);

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(done);
    } catch {
      setNotice('Could not copy here. Select the text and copy it by hand.');
    }
  };
  const show = (day: PlanDay) => {
    try {
      window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(dayToPlan(plan, day)));
    } catch {
      setNotice('Your browser would not save the plan, so it cannot be opened in the planner here.');
      return;
    }
    navigate('/workout-planner');
  };

  return (
    <section className={`${calcCard} space-y-4`}>
      <div role="group" aria-label="Type of plan" className="flex flex-wrap gap-2">
        {KINDS.map((entry) => <button key={entry.id} type="button" aria-pressed={kind === entry.id} onClick={() => { setKind(entry.id); setNotice(''); }} className={chipClass(kind === entry.id)}>{entry.label}</button>)}
      </div>
      <div role="group" aria-label="Days per week" className="flex flex-wrap gap-2">
        {([3, 4, 5] as const).map((count) => <button key={count} type="button" aria-pressed={days === count} onClick={() => { setDays(count); setNotice(''); }} className={chipClass(days === count)}>{count} days a week</button>)}
      </div>

      <div className="rounded-xl bg-slate-50 p-3">
        <h2 className="text-base font-bold text-slate-900">{plan.name[0].toUpperCase() + plan.name.slice(1)}</h2>
        <p className="mt-1 text-sm text-slate-700">{plan.blurb}</p>
        <p className="mt-1 text-xs text-slate-600"><span className="font-semibold">Train on:</span> {plan.schedule} <span className="font-semibold">Needs:</span> {kindInfo?.blurb}</p>
        <button type="button" onClick={() => void copy(planToText(plan), 'Copied the whole week. Paste it into a chat or a note.')} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-orange-300 px-4 py-2 text-sm font-bold text-orange-800 hover:bg-orange-50"><Copy className="h-4 w-4" aria-hidden="true" />Copy the whole week as text</button>
      </div>

      {notice && <p role="status" className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">{notice}</p>}

      <ol className="space-y-3">
        {plan.plan.map((day) => (
          <li key={day.title}>
            <details className="group rounded-xl border border-slate-200 bg-white" open={day === plan.plan[0]}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block text-sm font-bold text-slate-900">{day.title}</span>
                  <span className="block text-xs text-slate-600">{day.focus} · about {dayMinutes(day, kind)} min</span>
                </span>
                <span aria-hidden="true" className="text-lg font-bold text-orange-700 transition group-open:rotate-45">+</span>
              </summary>
              <div className="border-t border-slate-100 px-3 pb-3">
                <Part label="Warm-up" moves={day.warmup} />
                <Part label="Main" moves={day.main} />
                <Part label="Cool-down" moves={day.cooldown} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => show(day)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"><MonitorPlay className="h-4 w-4" aria-hidden="true" />Show this day on a screen</button>
                  <button type="button" onClick={() => void copy(dayToText(plan, day), `Copied ${day.title}.`)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-orange-300 px-4 py-2 text-sm font-bold text-orange-800 hover:bg-orange-50"><Copy className="h-4 w-4" aria-hidden="true" />Copy this day</button>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">Opens the Workout Planner with this day filled in. It replaces the plan saved there.</p>
              </div>
            </details>
          </li>
        ))}
      </ol>

      <Note>The plans never change, so you can follow the same week after week. Start light, keep good form, stop if anything hurts and check with a doctor first if you have a health condition. The home plans use body weight and a pair of dumbbells, so a few moves such as calf raises and curls need them.</Note>
    </section>
  );
};

export default WeeklyWorkoutPlans;
