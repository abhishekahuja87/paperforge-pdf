import React, { useCallback, useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { bool, isRecord, num } from '../../../lib/screens/read';
import { buildSequenceSlides, clampInt, formatDuration, totalSeconds } from '../../../lib/screens/timed';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { useScrollTo } from '../../../lib/screens/useScrollTo';
import { PresetGrid, type Preset } from './PresetGrid';
import { makeRow, readRows, RowsEditor, type Column, type FormRow } from './RowsEditor';
import { TimedPlayer } from './TimedPlayer';
import { CHECK, FIELD, LABEL, ORANGE } from './ui';

interface Saved { rows: FormRow[]; prepare: number; sound: boolean; timer: boolean; light: boolean; seconds: number }
const COLUMNS: Column[] = [
  { key: 'name', label: 'Pose or stretch', placeholder: 'For example Child’s pose', size: 'wide' },
  { key: 'note', label: 'Cue (optional)', placeholder: 'For example Breathe slowly', size: 'wide' },
  { key: 'seconds', label: 'Seconds', type: 'number', size: 'narrow' },
];
const step = (name: string, note: string, seconds: number) => ({ name, note, seconds: String(seconds) });
const SETS: Array<Preset & { steps: Array<{ name: string; note: string; seconds: string }> }> = [
  { id: 'morning', label: 'Morning stretch', blurb: 'Eight gentle stretches to start the day, about 5 minutes.', steps: [
    step('Neck rolls', 'Slow circles, one way then the other.', 30), step('Shoulder rolls', 'Roll back, then forward.', 30), step('Side bend', 'Reach one arm over, then switch.', 40),
    step('Standing forward fold', 'Let the head hang, knees soft.', 40), step('Cat and cow', 'Move with your breath.', 45), step('Child’s pose', 'Rest and breathe slowly.', 45), step('Seated twist', 'Turn gently, then switch sides.', 40), step('Deep breaths', 'Breathe in for four, out for six.', 30)] },
  { id: 'desk', label: 'Desk break', blurb: 'Six stretches you can do in a chair, about 3 minutes.', steps: [
    step('Neck tilt', 'Ear towards shoulder, then switch.', 30), step('Shoulder shrugs', 'Lift, hold, release.', 20), step('Wrist circles', 'Both directions.', 20), step('Seated twist', 'Hold the chair back, turn gently.', 40), step('Chest opener', 'Hands behind you, lift the chest.', 30), step('Stand and reach up', 'Reach tall, then relax.', 30)] },
  { id: 'cooldown', label: 'Cool-down stretch', blurb: 'Slow holds for after exercise, about 4 minutes.', steps: [
    step('Quad stretch', 'Hold your foot, then switch.', 40), step('Hamstring stretch', 'Reach towards your toes.', 40), step('Chest stretch', 'Hands clasped behind you.', 30), step('Triceps stretch', 'Elbow up, then switch.', 30), step('Calf stretch', 'Heel down, then switch.', 40), step('Child’s pose', 'Rest and breathe.', 45)] },
];

const read = (value: unknown): Saved | null => (isRecord(value) ? { rows: readRows(value.rows, ['name', 'note', 'seconds']) ?? [], prepare: num(value.prepare, 10), sound: bool(value.sound, true), timer: bool(value.timer, true), light: bool(value.light, false), seconds: num(value.seconds, 30) } : null);

export const YogaDisplay: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-yoga-v1', { rows: [], prepare: 10, sound: true, timer: true, light: false, seconds: 30 }, read);
  const [active, setActive] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const { ref, scroll } = useScrollTo<HTMLDivElement>();
  const close = useCallback(() => setPlaying(false), []);
  const steps = useMemo(() => saved.rows.filter((row) => (row.name ?? '').trim()).map((row) => ({ name: (row.name ?? '').trim(), note: row.note ?? '', seconds: clampInt(Number(row.seconds), 5, 1800, 30) })), [saved.rows]);
  const slides = useMemo(() => buildSequenceSlides(steps, clampInt(saved.prepare, 0, 120, 10), 'Pose'), [steps, saved.prepare]);
  const update = (patch: Partial<Saved>) => setSaved({ ...saved, ...patch });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <PresetGrid presets={SETS} active={active} hint="Pick a ready sequence, then change, add or remove anything." onPick={(id) => { const set = SETS.find((entry) => entry.id === id); if (!set) return; update({ rows: set.steps.map(makeRow) }); setActive(id); scroll(); }} />
      </section>
      <div ref={ref} className="scroll-mt-[69px]">
        <RowsEditor title="Sequence" columns={COLUMNS} rows={saved.rows} onChange={(rows) => { update({ rows }); setActive(null); }} blank={{ name: '', note: '', seconds: String(saved.seconds) }} addLabel="Add a pose or stretch" empty="Nothing here yet. Pick a quick start above or add your own poses." bulk={{ keys: ['name', 'note', 'seconds'], hint: 'One per line: name | cue | seconds. The cue and seconds are optional.', example: 'Mountain pose | Stand tall | 30\nTree pose | Balance on one leg | 40' }} />
      </div>
      <section className={`${calcCard} space-y-4`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={LABEL}>Seconds for each new pose<input type="number" inputMode="numeric" min={5} max={1800} value={saved.seconds} onChange={(event) => update({ seconds: Number(event.target.value) })} className={FIELD} /></label>
          <label className={LABEL}>Get ready (seconds)<input type="number" inputMode="numeric" min={0} max={120} value={saved.prepare} onChange={(event) => update({ prepare: Number(event.target.value) })} className={FIELD} /></label>
        </div>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <label className={CHECK}><input type="checkbox" checked={saved.timer} onChange={(event) => update({ timer: event.target.checked })} className="h-4 w-4 accent-orange-700" />Show the big countdown</label>
          <label className={CHECK}><input type="checkbox" checked={saved.sound} onChange={(event) => update({ sound: event.target.checked })} className="h-4 w-4 accent-orange-700" />Soft beep at each change</label>
          <label className={CHECK}><input type="checkbox" checked={saved.light} onChange={(event) => update({ light: event.target.checked })} className="h-4 w-4 accent-orange-700" />Light screen for the get ready and end slides</label>
        </div>
        <p className="text-sm font-semibold text-stone-800">{steps.length === 0 ? 'Add some poses to start.' : `${steps.length} ${steps.length === 1 ? 'pose' : 'poses'}, about ${formatDuration(totalSeconds(slides))} in all.`}</p>
        <button type="button" onClick={() => setPlaying(true)} disabled={steps.length === 0} className={ORANGE}><Play className="h-4 w-4" aria-hidden="true" />Start class</button>
        <Note>Each pose shows its name, your cue, a countdown and the next pose. Your sequence is saved only in this browser. This is general information, not medical advice: move gently, never force a stretch and stop if something hurts.</Note>
      </section>
      {playing && <TimedPlayer slides={slides} label="Yoga and stretch class" showTimer={saved.timer} sound={saved.sound} light={saved.light} onClose={close} />}
    </div>
  );
};

export default YogaDisplay;
