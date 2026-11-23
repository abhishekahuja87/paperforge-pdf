import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Pause, Play, RotateCcw, X } from 'lucide-react';
import { EXERCISES, GROUPS } from '../../../lib/fitness/exercises';
import { ExercisePictures } from '../shared/ExercisePictures';
import { BLOCKS, formatClock, formatDuration, formatPlanDate, type Timing, type WorkoutPlan } from '../../../lib/fitness/workout';
import { FLIP_CSS } from '../shared/flipCss';
import { THEME_STYLES } from '../../../lib/screens/themes';
import type { ShowOptions } from './WorkoutPlayer';

const BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));
const GROUP_LABEL = new Map(GROUPS.map((group) => [group.id, group.label]));

interface Props { plan: WorkoutPlan; timing: Timing; show: ShowOptions; onClose: () => void }

/** Everything on one screen: the three parts side by side with small pictures, a time on each exercise and a session clock. No descriptions. */
export const WorkoutBoard: React.FC<Props> = ({ plan, timing, show, onClose }) => {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const lastTick = useRef(Date.now());

  const total = useMemo(() => BLOCKS.reduce((sum, block) => sum + plan.blocks[block.id].length, 0), [plan]);
  const doneCount = done.size;

  // One timer tick for both the session clock and the exercise countdown, based on real elapsed time.
  useEffect(() => {
    if (!running && activeKey === null) return undefined;
    lastTick.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const step = Math.min(1, (now - lastTick.current) / 1000);
      lastTick.current = now;
      if (running) setElapsed((value) => value + step);
      if (activeKey !== null) setLeft((value) => value - step);
    }, 250);
    return () => window.clearInterval(id);
  }, [running, activeKey]);

  useEffect(() => {
    if (activeKey !== null && left <= 0) {
      setDone((current) => new Set(current).add(activeKey));
      setActiveKey(null);
    }
  }, [activeKey, left]);

  useEffect(() => {
    const root = rootRef.current;
    let active = true;
    let lock: WakeLockSentinel | null = null;
    const takeLock = async () => {
      try { lock = (await navigator.wakeLock?.request('screen')) ?? null; } catch { lock = null; }
    };
    void takeLock();
    const onVisible = () => { if (document.visibilityState === 'visible') void takeLock(); };
    const onFullscreen = () => { if (!document.fullscreenElement) closeRef.current(); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('keydown', onKey);
    try { void root?.requestFullscreen?.().then(() => { if (active) document.addEventListener('fullscreenchange', onFullscreen); }).catch(() => undefined); } catch { /* the overlay still fills the window */ }
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('keydown', onKey);
      void lock?.release().catch(() => undefined);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, []);

  const toggleDone = useCallback((key: string) => {
    setDone((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
    setActiveKey((current) => (current === key ? null : current));
  }, []);
  const toggleTimer = useCallback((key: string) => {
    if (activeKey === key) { setActiveKey(null); return; }
    setDone((current) => { if (!current.has(key)) return current; const next = new Set(current); next.delete(key); return next; });
    setActiveKey(key);
    setLeft(timing.work);
    setRunning(true);
  }, [activeKey, timing.work]);
  const reset = () => { setDone(new Set()); setActiveKey(null); setElapsed(0); setRunning(false); };

  const style = THEME_STYLES[show.theme];
  const dark = !style.onLight;
  const { surface, muted, accent, card, btn } = style;
  const header = [show.title ? plan.title.trim() : '', show.place ? plan.place.trim() : '', show.date ? formatPlanDate(plan.date) : ''].filter(Boolean);
  const perExercise = timing.work + timing.rest;

  return (
    <div ref={rootRef} role="dialog" aria-modal="true" aria-label="Workout on one screen" className={`fixed inset-0 z-[100] flex flex-col ${surface}`}>
      <style>{FLIP_CSS}</style>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[clamp(1.1rem,2.6vw,2rem)] font-black leading-tight">{header[0] ?? 'Workout'}</h2>
          {header.length > 1 && <p className={`truncate text-xs font-semibold sm:text-sm ${muted}`}>{header.slice(1).join('  ·  ')}</p>}
        </div>
        <p className={`text-xs font-semibold sm:text-sm ${muted}`}>{doneCount} of {total} done</p>
        {show.timer && (
          <div className="flex items-center gap-2">
            <span className="text-[clamp(1.4rem,3vw,2.4rem)] font-black tabular-nums" aria-label="Session time">{formatClock(elapsed)}</span>
            <button type="button" aria-label={running ? 'Pause session clock' : 'Start session clock'} onClick={() => setRunning((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-700 text-white hover:bg-orange-800">
              {running ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        )}
        <button type="button" aria-label="Start again" onClick={reset} className={`flex h-10 w-10 items-center justify-center rounded-full ${btn}`}><RotateCcw className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" aria-label="Close" onClick={onClose} className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold ${btn}`}><X className="h-4 w-4" aria-hidden="true" />Close</button>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto px-4 pb-4 sm:px-6 lg:grid-cols-3">
        {BLOCKS.map((block) => {
          const items = plan.blocks[block.id];
          return (
            <section key={block.id} className={`flex min-h-0 flex-col rounded-2xl border p-3 ${card}`} aria-label={block.label}>
              <h3 className="flex items-baseline justify-between gap-2 pb-2">
                <span className={`text-sm font-black uppercase tracking-wide ${accent}`}>{block.label}</span>
                <span className={`text-xs font-semibold ${muted}`}>{items.length} · {formatDuration(items.length * perExercise)}</span>
              </h3>
              {items.length === 0 ? <p className={`text-sm ${muted}`}>Nothing here.</p> : (
                <ul className="space-y-1.5 overflow-y-auto">
                  {items.map((item) => {
                    const exercise = item.exerciseId ? BY_ID.get(item.exerciseId) : undefined;
                    const isDone = done.has(item.key);
                    const isActive = activeKey === item.key;
                    return (
                      <li key={item.key} className={`flex items-center gap-2 rounded-xl border p-1.5 ${isActive ? 'border-orange-500 bg-orange-500/10' : dark ? 'border-white/10' : 'border-stone-200'} ${isDone ? 'opacity-50' : ''}`}>
                        <button type="button" aria-pressed={isDone} aria-label={`${isDone ? 'Mark not done' : 'Mark done'}: ${item.name}`} onClick={() => toggleDone(item.key)} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${isDone ? 'border-green-500 bg-green-500 text-white' : dark ? 'border-white/30' : 'border-stone-300'}`}>
                          {isDone && <Check className="h-5 w-5" aria-hidden="true" />}
                        </button>
                        {show.pictures && exercise && (
                          <span className="relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-stone-200">
                            <ExercisePictures id={exercise.id} lazy />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm font-bold leading-tight sm:text-base ${isDone ? 'line-through' : ''}`}>{item.name}</span>
                          {(item.detail.trim() || (show.muscles && exercise)) && (
                            <span className={`block truncate text-xs ${muted}`}>{[item.detail.trim(), show.muscles && exercise ? GROUP_LABEL.get(exercise.group) : ''].filter(Boolean).join(' · ')}</span>
                          )}
                        </span>
                        {show.timer && (
                          <button type="button" aria-label={isActive ? `Stop timer: ${item.name}` : `Start ${timing.work} second timer: ${item.name}`} onClick={() => toggleTimer(item.key)} className={`flex h-9 min-w-[3.6rem] shrink-0 items-center justify-center gap-1 rounded-full px-2 text-sm font-black tabular-nums ${isActive ? 'bg-orange-700 text-white' : btn}`}>
                            {isActive ? formatClock(Math.max(0, left)) : <><Play className="h-3.5 w-3.5" aria-hidden="true" />{timing.work}s</>}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default WorkoutBoard;
