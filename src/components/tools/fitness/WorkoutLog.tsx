import React, { useMemo, useState } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { calcCard, Note, SelectField } from '../../finance/ui';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { EXERCISES } from '../../../lib/fitness/exercises';
import { exercisesUsed, isRecord, parseSets, progressFor, setsToText, volume, type LogEntry } from '../../../lib/fitness/log';
import { estimateOneRepMax, formatWeight } from '../../../lib/fitness/strength';
import { newKey, todayIso } from '../../../lib/fitness/workout';
import { ConfirmButton } from '../shared/ConfirmButton';
import { chipClass, ghostButton, primaryButton, smallInput } from '../shared/toolStyles';

interface Saved { unit: 'kg' | 'lb'; entries: LogEntry[] }
const DEFAULT: Saved = { unit: 'kg', entries: [] };
const BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));
const nameOf = (id: string): string => BY_ID.get(id)?.name ?? id;

const read = (value: unknown): Saved | null => {
  const v = value as Partial<Saved> | null;
  if (!v || !Array.isArray(v.entries)) return null;
  const entries = v.entries.filter((entry): entry is LogEntry => !!entry && typeof entry.id === 'string' && typeof entry.date === 'string' && typeof entry.exerciseId === 'string' && Array.isArray(entry.sets)).slice(-2000);
  return { unit: v.unit === 'lb' ? 'lb' : 'kg', entries };
};

/** A small line chart of one exercise's progress. */
const Sparkline: React.FC<{ values: number[]; label: string }> = ({ values, label }) => {
  if (values.length < 2) return null;
  const width = 240, height = 56, pad = 6;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const points = values.map((value, i) => `${pad + (i * (width - 2 * pad)) / (values.length - 1)},${height - pad - ((value - min) / span) * (height - 2 * pad)}`).join(' ');
  return <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="h-14 w-full max-w-[16rem]"><polyline points={points} fill="none" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

export const WorkoutLog: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-workout-log-v1', DEFAULT, read);
  const [date, setDate] = useState(todayIso());
  const [query, setQuery] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [setsText, setSetsText] = useState('');
  const [notice, setNotice] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((exercise) => !q || exercise.name.toLowerCase().includes(q)).slice(0, 40);
  }, [query]);
  const chosen = exerciseId && matches.some((exercise) => exercise.id === exerciseId) ? exerciseId : (matches[0]?.id ?? '');
  const sets = parseSets(setsText);
  const bodyweight = BY_ID.get(chosen)?.equipment === 'bodyweight';

  const add = () => {
    if (!chosen || sets.length === 0) { setNotice('Choose an exercise and write at least one set, such as 60x8.'); return; }
    setSaved({ ...saved, entries: [...saved.entries, { id: newKey(), date, exerciseId: chosen, sets }] });
    setSetsText('');
    setNotice(`Saved ${nameOf(chosen)}.`);
  };
  const remove = (id: string) => setSaved({ ...saved, entries: saved.entries.filter((entry) => entry.id !== id) });

  const sorted = useMemo(() => [...saved.entries].sort((x, y) => y.date.localeCompare(x.date)), [saved.entries]);
  const used = useMemo(() => exercisesUsed(saved.entries), [saved.entries]);
  const days = useMemo(() => new Set(saved.entries.map((entry) => entry.date)).size, [saved.entries]);
  const totalVolume = useMemo(() => saved.entries.reduce((sum, entry) => sum + volume(entry.sets), 0), [saved.entries]);

  const copy = async () => {
    const lines = ['Date,Exercise,Sets', ...sorted.map((entry) => `${entry.date},"${nameOf(entry.exerciseId).replace(/"/g, '""')}","${setsToText(entry.sets)} ${saved.unit}"`)];
    try { await navigator.clipboard.writeText(lines.join('\n')); setNotice('Copied your log as CSV. Paste it into a spreadsheet.'); } catch { setNotice('Could not copy here.'); }
  };

  return (
    <section className={`${calcCard} space-y-5`}>
      <div role="group" aria-label="Unit" className="flex gap-2">
        {(['kg', 'lb'] as const).map((entry) => <button key={entry} type="button" aria-pressed={saved.unit === entry} onClick={() => setSaved({ ...saved, unit: entry })} className={chipClass(saved.unit === entry)}>{entry === 'kg' ? 'Kilograms' : 'Pounds'}</button>)}
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 p-3">
        <h2 className="text-sm font-bold text-slate-900">Log a set of exercises</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">Date<input type="date" value={date} max={todayIso()} onChange={(event) => setDate(event.target.value || todayIso())} className={smallInput} /></label>
          <label className="block text-xs font-semibold text-slate-700">Find an exercise<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type squat, row, plank..." className={smallInput} /></label>
        </div>
        <SelectField label="Exercise" value={chosen} onChange={setExerciseId} options={matches.length ? matches.map((exercise) => ({ value: exercise.id, label: exercise.name })) : [{ value: '', label: 'No exercise matches' }]} />
        <label className="block text-xs font-semibold text-slate-700">
          Sets, as weight x reps
          <input value={setsText} onChange={(event) => setSetsText(event.target.value)} placeholder={bodyweight ? '0x15, 0x12, 0x10' : '60x8, 60x8, 65x6'} className={smallInput} />
          <span className="mt-1 block font-normal text-slate-500">Separate sets with commas. {bodyweight ? 'For body weight moves write 0 as the weight, such as 0x15.' : `Weight is in ${saved.unit}.`}{sets.length ? ` ${sets.length} ${sets.length === 1 ? 'set' : 'sets'} read.` : ''}</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={add} className={primaryButton}>Save to my log</button>
          {notice && <span role="status" className="text-xs text-slate-600">{notice}</span>}
        </div>
      </div>

      {saved.entries.length === 0 ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Your log is empty. It stays on this device, so nobody else sees it.</p> : (
        <>
          <p className="text-xs text-slate-600">{saved.entries.length} entries on {days} {days === 1 ? 'day' : 'days'}. Total lifted: {formatWeight(totalVolume)} {saved.unit}.</p>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Progress by exercise</h2>
            <ul className="mt-2 space-y-3">
              {used.map((id) => {
                const points = progressFor(saved.entries, id);
                if (points.length === 0) return null;
                const last = points[points.length - 1];
                const record = isRecord(points);
                return (
                  <li key={id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-bold text-slate-900">{nameOf(id)}{record && <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-800">New best</span>}</p>
                    <p className="text-xs text-slate-600">Best set on {last.date}: {last.best.weight > 0 ? `${formatWeight(last.best.weight)} ${saved.unit} × ${last.best.reps} (about ${formatWeight(estimateOneRepMax(last.best.weight, last.best.reps))} ${saved.unit} for one rep)` : `${last.best.reps} reps`}</p>
                    <Sparkline values={points.map((point) => point.score)} label={`${nameOf(id)} progress over ${points.length} days`} />
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">History</h2>
            <ul className="mt-2 divide-y divide-slate-100">
              {sorted.slice(0, 60).map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{nameOf(entry.exerciseId)}</span>
                    <span className="block text-xs text-slate-600">{entry.date} · {setsToText(entry.sets)} {saved.unit}</span>
                  </span>
                  <button type="button" onClick={() => remove(entry.id)} aria-label={`Delete ${nameOf(entry.exerciseId)} on ${entry.date}`} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
            {sorted.length > 60 && <p className="text-[11px] text-slate-500">Showing the latest 60 of {sorted.length}. Copy as CSV to see them all.</p>}
          </div>
          <button type="button" onClick={() => void copy()} className={ghostButton}><Copy className="h-4 w-4" aria-hidden="true" />Copy my log as CSV</button>
          <ConfirmButton label="Clear my whole log" confirmLabel="Tap again to delete everything" onConfirm={() => { setSaved({ ...saved, entries: [] }); setNotice('Your log is empty.'); }} icon={<Trash2 className="h-4 w-4" aria-hidden="true" />} />
        </>
      )}
      <Note>Your log is saved only in this browser on this device. Clearing site data or switching browsers removes it, so copy it as CSV now and then to keep a backup.</Note>
    </section>
  );
};

export default WorkoutLog;
