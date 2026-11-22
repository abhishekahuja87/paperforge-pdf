import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { beep } from '../../../lib/screens/beep';
import { clockText, examStateAt, hms, pad2, time12, type ExamState } from '../../../lib/screens/clock';
import { bool, isRecord, num, oneOf, str } from '../../../lib/screens/read';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { ThemePicker } from '../shared/ThemePicker';
import { THEME_STYLES } from '../../../lib/screens/themes';
import { readTheme, type Theme } from '../../../lib/screens/timed';
import { LogoField } from './LogoField';
import { PresetGrid, type Preset } from './PresetGrid';
import { ScreenShell } from './ScreenShell';
import { CHECK, FIELD, LABEL, ORANGE } from './ui';

type StartMode = 'press' | 'clock';
interface Saved { title: string; subject: string; startMode: StartMode; startTime: string; minutes: number; warn: number; rules: string; sound: boolean; theme: Theme; logo: string }
const RULES = 'Write your name and roll number first.\nRead all the questions before you start.\nMobile phones must be switched off and kept away.\nRaise your hand if you need anything.';
const DEFAULTS: Saved = { title: 'Unit Test', subject: '', startMode: 'press', startTime: '10:00', minutes: 60, warn: 10, rules: RULES, sound: true, theme: 'dark', logo: '' };
const PRESETS: Array<Preset & { values: Partial<Saved> }> = [
  { id: 'board', label: 'Three-hour exam', blurb: '180 minutes with a 15 minute warning.', values: { title: 'Final Examination', minutes: 180, warn: 15 } },
  { id: 'test', label: 'Class test', blurb: '60 minutes with a 10 minute warning.', values: { title: 'Class Test', minutes: 60, warn: 10 } },
  { id: 'unit', label: 'Short test', blurb: '40 minutes with a 5 minute warning.', values: { title: 'Unit Test', minutes: 40, warn: 5 } },
  { id: 'quiz', label: 'Quick quiz', blurb: '20 minutes with a 5 minute warning.', values: { title: 'Quick Quiz', minutes: 20, warn: 5 } },
];
const read = (value: unknown): Saved | null => (isRecord(value) ? { title: str(value.title, DEFAULTS.title), subject: str(value.subject), startMode: oneOf(value.startMode, ['press', 'clock'] as const, 'press'), startTime: str(value.startTime, DEFAULTS.startTime), minutes: num(value.minutes, 60), warn: num(value.warn, 10), rules: str(value.rules, RULES), sound: bool(value.sound, true), theme: readTheme(value.theme, value.light), logo: str(value.logo) } : null);

const nowTime = (): string => { const now = new Date(); return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`; };

/** The screen on the wall of an exam hall: a big clock, the time left, the start and end times and the rules. */
const ExamScreen: React.FC<{ saved: Saved; startAt: Date; minutes: number; warn: number; onClose: () => void }> = ({ saved, startAt, minutes, warn, onClose }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 250); return () => window.clearInterval(id); }, []);
  const state = examStateAt(now, startAt, minutes, warn) as ExamState;
  const lastPhase = useRef(state.phase);
  useEffect(() => {
    if (saved.sound && lastPhase.current !== state.phase) beep(state.phase === 'over' ? 440 : 880, state.phase === 'over' ? 900 : 400);
    lastPhase.current = state.phase;
  }, [state.phase, saved.sound]);

  const style = THEME_STYLES[saved.theme];
  const surface = state.phase === 'over' ? 'bg-red-800 text-white' : state.phase === 'warning' ? 'bg-amber-600 text-white' : style.surface;
  const alert = state.phase === 'over' || state.phase === 'warning';
  const muted = alert ? 'text-white/85' : style.muted;
  const label = state.phase === 'before' ? 'Exam starts in' : state.phase === 'over' ? 'Time is up' : state.phase === 'warning' ? `Last ${warn} minutes` : 'Time left';
  const rules = saved.rules.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  return (
    <ScreenShell surface={`${surface} transition-colors duration-500`} label="Exam hall display" onClose={onClose} logo={saved.logo || undefined}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5 sm:px-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words text-[clamp(1.6rem,4.5vw,3.6rem)] font-black leading-tight">{saved.title.trim() || 'Examination'}</h2>
            {saved.subject.trim() && <p className={`text-[clamp(1rem,2.4vw,2rem)] font-semibold ${muted}`}>{saved.subject.trim()}</p>}
          </div>
          <p className="text-[clamp(1.4rem,4vw,3.2rem)] font-bold tabular-nums" aria-label="Current time">{clockText(now, true)}</p>
        </div>
        <div className="m-auto flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-[clamp(1.2rem,3.4vw,2.8rem)] font-bold uppercase tracking-widest">{label}</p>
          {state.phase !== 'over' && <p className="text-[clamp(4rem,20vw,16rem)] font-black leading-none tabular-nums" aria-live="off">{hms(state.remainingMs)}</p>}
          {state.phase === 'over' && <p className="text-[clamp(2.4rem,10vw,8rem)] font-black leading-none">Pens down</p>}
          <p className={`text-[clamp(1rem,2.4vw,2rem)] ${muted}`}>Starts {time12(`${pad2(state.start.getHours())}:${pad2(state.start.getMinutes())}`)} · Ends {time12(`${pad2(state.end.getHours())}:${pad2(state.end.getMinutes())}`)} · {minutes} minutes</p>
        </div>
        {rules.length > 0 && (
          <ul className={`mx-auto grid w-full max-w-6xl gap-x-8 gap-y-1 pb-2 text-[clamp(0.95rem,2vw,1.6rem)] sm:grid-cols-2 ${muted}`}>
            {rules.map((rule, index) => <li key={index} className="flex gap-2"><span aria-hidden="true">•</span><span>{rule}</span></li>)}
          </ul>
        )}
      </div>
    </ScreenShell>
  );
};

export const ExamHall: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-exam-hall-v1', DEFAULTS, read);
  const [active, setActive] = useState<string | null>(null);
  const [startAt, setStartAt] = useState<Date | null>(null);
  const close = useCallback(() => setStartAt(null), []);
  const update = (patch: Partial<Saved>) => setSaved({ ...saved, ...patch });
  const minutes = Math.min(600, Math.max(1, Math.round(saved.minutes) || 60));
  const warn = Math.min(minutes, Math.max(0, Math.round(saved.warn) || 0));
  const clockStart = (() => {
    const [h, m] = saved.startTime.split(':').map(Number);
    if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) return null;
    const date = new Date(); date.setHours(h, m, 0, 0); return date;
  })();
  const start = () => setStartAt(saved.startMode === 'clock' ? clockStart : new Date());

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <PresetGrid presets={PRESETS} active={active} hint="Pick a length, then change anything below." onPick={(id) => { const preset = PRESETS.find((entry) => entry.id === id); if (!preset) return; update(preset.values); setActive(id); }} />
      </section>
      <section className={`${calcCard} space-y-4`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={LABEL}>Exam name<input type="text" value={saved.title} onChange={(event) => { update({ title: event.target.value }); setActive(null); }} className={FIELD} /></label>
          <label className={LABEL}>Subject, class or paper (optional)<input type="text" value={saved.subject} onChange={(event) => update({ subject: event.target.value })} placeholder="For example Maths, Class 10" className={FIELD} /></label>
          <label className={LABEL}>Length (minutes)<input type="number" inputMode="numeric" min={1} max={600} value={saved.minutes} onChange={(event) => { update({ minutes: Number(event.target.value) }); setActive(null); }} className={FIELD} /></label>
          <label className={LABEL}>Warning for the last (minutes, 0 for none)<input type="number" inputMode="numeric" min={0} max={600} value={saved.warn} onChange={(event) => update({ warn: Number(event.target.value) })} className={FIELD} /></label>
        </div>
        <div role="radiogroup" aria-label="When the exam starts" className="grid gap-2 sm:grid-cols-2">
          {([['press', 'Start when I press the button', 'The clock starts the moment you tap Start the exam.'], ['clock', 'Start at a set time', 'The screen counts down to the start time you choose.']] as const).map(([id, label, blurb]) => (
            <label key={id} className={`cursor-pointer rounded-xl border p-3 transition ${saved.startMode === id ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white hover:border-orange-300'}`}>
              <input type="radio" name="exam-start" value={id} checked={saved.startMode === id} onChange={() => update({ startMode: id })} className="sr-only" />
              <span className="block text-sm font-bold text-stone-900">{label}</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-stone-600">{blurb}</span>
            </label>
          ))}
        </div>
        {saved.startMode === 'clock' && (
          <label className={`${LABEL} max-w-xs`}>Start time today<input type="time" value={saved.startTime} onChange={(event) => update({ startTime: event.target.value })} className={FIELD} />
            <button type="button" onClick={() => update({ startTime: nowTime() })} className="mt-1 text-[11px] font-semibold text-orange-800 underline">Use the time now</button>
          </label>
        )}
        <label className={LABEL}>Rules shown on the screen (one per line)
          <textarea rows={5} value={saved.rules} onChange={(event) => update({ rules: event.target.value })} className={FIELD} />
        </label>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <label className={CHECK}><input type="checkbox" checked={saved.sound} onChange={(event) => update({ sound: event.target.checked })} className="h-4 w-4 accent-orange-700" />Beep when the exam starts, the warning begins and time is up</label>
        </div>
        <ThemePicker name="exam-theme" value={saved.theme} onChange={(theme) => update({ theme })} />
        <LogoField logo={saved.logo} onChange={(logo) => update({ logo })} label="School or centre logo in the corner (optional)" />
        <button type="button" onClick={start} disabled={saved.startMode === 'clock' && !clockStart} className={ORANGE}><Play className="h-4 w-4" aria-hidden="true" />Start the exam screen</button>
        <Note>The screen shows the current time, the time left, when the exam started and ends, and your rules. It turns amber for the last minutes and red when time is up. Your settings are saved only in this browser. Check the clock on the device against the hall clock before you begin.</Note>
      </section>
      {startAt && <ExamScreen saved={saved} startAt={startAt} minutes={minutes} warn={warn} onClose={close} />}
    </div>
  );
};

export default ExamHall;
