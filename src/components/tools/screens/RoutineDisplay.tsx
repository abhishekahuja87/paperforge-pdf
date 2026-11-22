import React, { useCallback, useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { EXERCISES, imageUrl, type Exercise } from '../../../lib/fitness/exercises';
import { bool, isRecord, num, str } from '../../../lib/screens/read';
import { buildSequenceSlides, clampInt, formatDuration, totalSeconds } from '../../../lib/screens/timed';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { useScrollTo } from '../../../lib/screens/useScrollTo';
import { ExercisePicker } from '../shared/ExercisePicker';
import { LogoField } from './LogoField';
import { PresetGrid, type Preset } from './PresetGrid';
import { makeRow, readRows, RowsEditor, type Column, type FormRow } from './RowsEditor';
import { TimedPlayer } from './TimedPlayer';
import { CHECK, FIELD, LABEL, ORANGE } from './ui';

interface Saved { rows: FormRow[]; prepare: number; sound: boolean; timer: boolean; light: boolean; seconds: number; logo: string }
const KEYS = ['name', 'note', 'seconds', 'image', 'exerciseId'];
const COLUMNS: Column[] = [
  { key: 'name', label: 'Step', placeholder: 'For example Child’s pose, Add the flour, Station 1', size: 'wide' },
  { key: 'note', label: 'Cue (optional)', placeholder: 'For example Breathe slowly', size: 'wide' },
  { key: 'seconds', label: 'Seconds', type: 'number', size: 'narrow' },
  { key: 'image', label: 'Own picture (optional)', type: 'image', size: 'mid' },
];

const BY_NAME = new Map(EXERCISES.map((exercise) => [exercise.name, exercise]));
/** A step. When the name matches an exercise in the library, the step also gets that exercise's two pictures. */
const step = (name: string, note: string, seconds: number) => ({ name, note, seconds: String(seconds), image: '', exerciseId: BY_NAME.get(name)?.id ?? '' });
const SETS: Array<Preset & { steps: Array<ReturnType<typeof step>> }> = [
  { id: 'morning', label: 'Morning stretch', blurb: 'Seven gentle stretches with pictures, about 5 minutes.', steps: [
    step('Side Neck Stretch', 'Ear towards shoulder, then switch.', 30), step('Shoulder Circles', 'Slow circles, both ways.', 30), step('Standing Lateral Stretch', 'Reach over, then switch sides.', 40),
    step('Standing Toe Touches', 'Let the head hang, knees soft.', 40), step('Cat Stretch', 'Move with your breath.', 45), step("Child's Pose", 'Rest and breathe slowly.', 45), step('Torso Rotation', 'Turn gently, then switch sides.', 40)] },
  { id: 'desk', label: 'Desk break', blurb: 'Chair stretches with pictures, about 3 minutes.', steps: [
    step('Side Neck Stretch', 'Ear towards shoulder, then switch.', 30), step('Upward Stretch', 'Reach tall, then relax.', 20), step('Chair Upper Body Stretch', 'Open the chest.', 30), step('Chair Lower Back Stretch', 'Fold forward slowly.', 40), step('Chair Leg Extended Stretch', 'One leg at a time.', 40)] },
  { id: 'cooldown', label: 'Cool-down stretch', blurb: 'Slow holds with pictures for after exercise, about 4 minutes.', steps: [
    step('Quad Stretch', 'Hold your foot, then switch.', 40), step('Hamstring Stretch', 'Reach towards your toes.', 40), step('Chest And Front Of Shoulder Stretch', 'Hands clasped behind you.', 30), step('Triceps Stretch', 'Elbow up, then switch.', 30), step('Standing Gastrocnemius Calf Stretch', 'Heel down, then switch.', 40), step("Child's Pose", 'Rest and breathe.', 45)] },
  { id: 'breathing', label: 'Breathing and relaxing', blurb: 'A calm sequence with no pictures, about 6 minutes.', steps: [
    step('Settle in', 'Sit comfortably and close your eyes.', 45), step('Slow breaths', 'Breathe in for four, out for six.', 120), step('Body check', 'Notice each part, from your feet upwards.', 120), step('Gentle stretch', 'Roll the shoulders and neck.', 45), step('Open your eyes', 'Take a last slow breath.', 30)] },
  { id: 'kids', label: 'Kids’ morning routine', blurb: 'Steps with times for getting ready for school.', steps: [
    step('Wake up and stretch', 'Big stretch, then out of bed.', 120), step('Brush teeth', 'Top, bottom and front.', 120), step('Wash face', 'Splash and dry.', 60), step('Get dressed', 'Uniform, socks and shoes.', 300), step('Breakfast', 'Sit and eat well.', 600), step('Pack the bag', 'Books, bottle and lunch.', 180)] },
  { id: 'stations', label: 'Classroom stations', blurb: 'Four stations with a rotation timer.', steps: [
    step('Station 1', 'Reading corner', 300), step('Station 2', 'Maths puzzles', 300), step('Station 3', 'Writing task', 300), step('Station 4', 'Group discussion', 300)] },
];

const read = (value: unknown): Saved | null => (isRecord(value) ? { rows: readRows(value.rows, KEYS) ?? [], prepare: num(value.prepare, 10), sound: bool(value.sound, true), timer: bool(value.timer, true), light: bool(value.light, false), seconds: num(value.seconds, 30), logo: str(value.logo) } : null);

export const RoutineDisplay: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-routine-v1', { rows: [], prepare: 10, sound: true, timer: true, light: false, seconds: 30, logo: '' }, read);
  const [active, setActive] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const { ref, scroll } = useScrollTo<HTMLDivElement>();
  const close = useCallback(() => setPlaying(false), []);
  const steps = useMemo(() => saved.rows.filter((row) => (row.name ?? '').trim()).map((row) => {
    const own = row.image || undefined;
    const library = row.exerciseId ? row.exerciseId : '';
    return { name: row.name.trim(), note: row.note ?? '', seconds: clampInt(Number(row.seconds), 3, 3600, 30), image: own ?? (library ? imageUrl(library, 0) : undefined), image2: !own && library ? imageUrl(library, 1) : undefined };
  }), [saved.rows]);
  const slides = useMemo(() => buildSequenceSlides(steps, clampInt(saved.prepare, 0, 120, 10), 'Step'), [steps, saved.prepare]);
  const update = (patch: Partial<Saved>) => setSaved({ ...saved, ...patch });
  const addFromLibrary = (exercise: Exercise) => { update({ rows: [...saved.rows, makeRow({ name: exercise.name, note: '', seconds: String(saved.seconds), image: '', exerciseId: exercise.id })] }); setActive(null); };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <PresetGrid presets={SETS} active={active} hint="Pick a ready routine, then change, add or remove any step. Stretches come with pictures; your own steps can have a picture of your own or none." onPick={(id) => { const set = SETS.find((entry) => entry.id === id); if (!set) return; update({ rows: set.steps.map(makeRow) }); setActive(id); scroll(); }} />
      </section>
      <div ref={ref} className="scroll-mt-[69px]">
        <RowsEditor
          title="Steps"
          columns={COLUMNS}
          rows={saved.rows}
          onChange={(rows) => { update({ rows }); setActive(null); }}
          blank={{ name: '', note: '', seconds: String(saved.seconds), image: '', exerciseId: '' }}
          addLabel="Add your own step"
          empty="Nothing here yet. Pick a quick start above, add a stretch or exercise with pictures, or add your own step."
          thumb={(row) => (row.exerciseId ? imageUrl(row.exerciseId, 0) : undefined)}
          bulk={{ keys: ['name', 'note', 'seconds'], hint: 'One step per line: name | cue | seconds. The cue and seconds are optional.', example: 'Mix the batter | Whisk until smooth | 120\nRest | Cover the bowl | 600' }}
          extra={<ExercisePicker startGroup="stretching" label="the routine" onPick={addFromLibrary} />}
        />
      </div>
      <section className={`${calcCard} space-y-4`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={LABEL}>Seconds for each new step<input type="number" inputMode="numeric" min={3} max={3600} value={saved.seconds} onChange={(event) => update({ seconds: Number(event.target.value) })} className={FIELD} /></label>
          <label className={LABEL}>Get ready (seconds)<input type="number" inputMode="numeric" min={0} max={120} value={saved.prepare} onChange={(event) => update({ prepare: Number(event.target.value) })} className={FIELD} /></label>
        </div>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <label className={CHECK}><input type="checkbox" checked={saved.timer} onChange={(event) => update({ timer: event.target.checked })} className="h-4 w-4 accent-orange-700" />Show the big countdown</label>
          <label className={CHECK}><input type="checkbox" checked={saved.sound} onChange={(event) => update({ sound: event.target.checked })} className="h-4 w-4 accent-orange-700" />Soft beep at each change</label>
          <label className={CHECK}><input type="checkbox" checked={saved.light} onChange={(event) => update({ light: event.target.checked })} className="h-4 w-4 accent-orange-700" />Light screen for the get ready and end slides</label>
        </div>
        <LogoField logo={saved.logo} onChange={(logo) => update({ logo })} />
        <p className="text-sm font-semibold text-stone-800">{steps.length === 0 ? 'Add some steps to start.' : `${steps.length} ${steps.length === 1 ? 'step' : 'steps'}, about ${formatDuration(totalSeconds(slides))} in all.`}</p>
        <button type="button" onClick={() => setPlaying(true)} disabled={steps.length === 0} className={ORANGE}><Play className="h-4 w-4" aria-hidden="true" />Start routine</button>
        <Note>Each step shows its name, your cue, a picture if it has one, a countdown and the next step. Your routine is saved only in this browser. For exercises and stretches this is general information, not medical advice: move gently, never force a stretch and stop if something hurts.</Note>
      </section>
      {playing && <TimedPlayer slides={slides} label="Step-by-step routine" showTimer={saved.timer} sound={saved.sound} light={saved.light} logo={saved.logo || undefined} onClose={close} />}
    </div>
  );
};

export default RoutineDisplay;
