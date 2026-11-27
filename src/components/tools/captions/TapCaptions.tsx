import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Play, Square } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import ui from '../../../locales/packs/tapcaptions.ui.en.json';
import starters from '../../../locales/packs/tapcaptions.examples.en.json';
import { cuesFromTimes, splitLines } from '../../../lib/captions/cues';
import { playVoice, readVoiceFile, type Voice } from '../../../lib/sequence/voice';
import { CaptionVideoPanel } from './CaptionVideoPanel';

const STORAGE_KEY = 'mdu_tap_captions_v1';
const MAX_SCRIPT = 6000;
interface Saved { script: string; shift: number; hold: number }
type StarterId = keyof typeof starters;
const DEFAULTS: Saved = { script: starters.reel.script, shift: 0.2, hold: 0 };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const inputClass = 'min-h-10 w-24 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
const smallButton = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.script === 'string') return { ...DEFAULTS, ...raw } as Saved;
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** Add your own words and your audio, tap each time a new line begins, and save subtitle files with those exact times, or a captions video. Everything stays on your device. */
export const TapCaptions: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { script, shift, hold } = saved;
  const [voice, setVoice] = useState<Voice | null>(null);
  const [timerOnly, setTimerOnly] = useState(false);
  const [soundMessage, setSoundMessage] = useState('');
  const [times, setTimes] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(0);
  const begin = useRef(0);
  const heard = useRef<{ stop: () => void } | null>(null);

  const lines = useMemo(() => splitLines(script), [script]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { heard.current?.stop(); }, []);

  const stopRun = () => { setRunning(false); heard.current?.stop(); heard.current = null; };
  const startFrom = (from: number) => {
    heard.current?.stop(); begin.current = performance.now() - from * 1000; heard.current = voice ? playVoice(voice, from) : null; setNow(from); setRunning(true);
  };
  const elapsed = () => (performance.now() - begin.current) / 1000;

  useEffect(() => {
    if (!running) return undefined;
    let raf = 0;
    const step = () => { const t = elapsed(); if (voice && t >= voice.seconds) { stopRun(); setNow(voice.seconds); return; } setNow(t); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, voice]);

  const tap = () => { if (!running) return; const t = elapsed(); setTimes((current) => (current.length < lines.length ? [...current, t] : current)); };
  const undo = () => {
    if (times.length === 0) return;
    const next = times.slice(0, -1); setTimes(next);
    if (running) startFrom(Math.max(0, (next[next.length - 1] ?? 0) - 0.5));
  };
  useEffect(() => {
    if (!running) return undefined;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null; if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.code === 'Space') { event.preventDefault(); target?.blur?.(); tap(); }
    };
    // A focused button would also click on the key coming up, which would tap twice or press Undo.
    const onUp = (event: KeyboardEvent) => { const target = event.target as HTMLElement | null; if (event.code === 'Space' && !(target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) event.preventDefault(); };
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onUp); return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onUp); };
  });

  const addSound = async (file: File) => {
    setSoundMessage(''); stopRun();
    try { const read = await readVoiceFile(file); setVoice(read); setTimerOnly(false); setTimes([]); } catch { setSoundMessage(ui.audioFailed); }
  };
  const removeSound = () => { stopRun(); setVoice(null); setTimerOnly(false); setTimes([]); };
  const setScript = (next: string) => { stopRun(); setSaved((current) => ({ ...current, script: next.slice(0, MAX_SCRIPT) })); setTimes((current) => current.slice(0, splitLines(next).length)); };
  const useStarter = (id: StarterId) => { setScript(starters[id].script); setTimes([]); };
  const nudge = (k: number, by: number) => setTimes((current) => current.map((value, index) => (index === k ? Math.max(0, Math.round((value + by) * 10) / 10) : value)));
  const setTime = (k: number, value: number) => setTimes((current) => current.map((old, index) => (index === k ? Math.max(0, value) : old)));

  const ready = !!voice || timerOnly;
  const total = voice ? voice.seconds : times.length > 0 ? (times[times.length - 1] ?? 0) + 3.5 : 0;
  const cues = useMemo(() => cuesFromTimes(lines, times, { shift, hold, total: voice ? voice.seconds : 0 }), [lines, times, shift, hold, voice]);
  const fileBase = ((voice?.name ?? 'captions').replace(/\.[a-z0-9]+$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)) || 'captions';
  const current = times.length > 0 ? lines[times.length - 1] : undefined; const upNext = lines[times.length];
  const startAgain = () => { stopRun(); setSaved(DEFAULTS); setVoice(null); setTimerOnly(false); setTimes([]); setSoundMessage(''); };
  const secs = (value: number) => value.toFixed(1);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={(Object.keys(starters) as StarterId[]).find((id) => starters[id].script === script) ?? ''} onChange={(value) => useStarter(value as StarterId)} options={(Object.keys(starters) as StarterId[]).map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{ui.startersHint}</p></div>
        <label className="block text-xs font-semibold text-slate-700">{ui.scriptLabel}
          <textarea value={script} rows={8} spellCheck={false} disabled={running} placeholder={ui.scriptPlaceholder} onChange={(event) => setScript(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-normal leading-6 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </label>
        <p className="text-[11px] text-slate-500">{ui.scriptHint} {ui.lineCount.replace('{count}', String(lines.length))}</p>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.help}</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-slate-700">{ui.helpItems.map((item) => <li key={item}>{item}</li>)}</ol>
        </details>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.sound}</h2>
        <p className="text-[11px] text-slate-500">{ui.soundHint}</p>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 ${running ? 'pointer-events-none opacity-40' : ''}`}><Mic className="h-4 w-4" aria-hidden="true" />{ui.addAudio}
            <input type="file" accept="audio/*,video/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addSound(file); }} /></label>
          <button type="button" disabled={running} onClick={() => { setVoice(null); setTimerOnly(true); setTimes([]); }} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.noAudio}</button>
          {ready && <button type="button" disabled={running} onClick={removeSound} className={smallButton}>{ui.removeSound}</button>}
        </div>
        {soundMessage && <Note>{soundMessage}</Note>}
        {voice && <p className="text-xs text-slate-800">{ui.soundAdded.replace('{name}', voice.name).replace('{seconds}', secs(voice.seconds))}</p>}
        {timerOnly && <p className="text-xs text-slate-800">{ui.soundNone}</p>}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.tap}</h2>
        {lines.length === 0 ? <Note>{ui.needLines}</Note> : (
          <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
            <p className="text-xs text-slate-700" role="status">{!running ? (times.length >= lines.length ? ui.tapDone : ui.tapReady) : times.length >= lines.length ? ui.tapDone : `${secs(now)} s`}</p>
            {current && <p className="rounded-lg bg-white p-2 text-xs text-slate-800">{ui.tapNow.replace('{line}', current)}</p>}
            {upNext && <p className="rounded-lg bg-white p-2 text-sm font-semibold text-slate-900">{ui.tapUp.replace('{line}', upNext)}</p>}
            <div className="flex flex-wrap gap-2">
              {!running
                ? <button type="button" disabled={!ready} onClick={() => startFrom(times.length > 0 ? Math.max(0, (times[times.length - 1] ?? 0) - 0.5) : 0)} className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 text-base font-bold text-white hover:bg-orange-800 disabled:opacity-40"><Play className="h-5 w-5" aria-hidden="true" />{ui.begin}</button>
                : <button type="button" onClick={tap} disabled={times.length >= lines.length} className="min-h-14 flex-1 rounded-xl bg-orange-700 px-4 text-base font-bold text-white hover:bg-orange-800 disabled:opacity-40">{ui.tapNext}</button>}
              {running && <button type="button" onClick={stopRun} className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50"><Square className="h-4 w-4" aria-hidden="true" />{ui.stop}</button>}
              <button type="button" onClick={undo} disabled={times.length === 0} className="min-h-14 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.undo}</button>
              <button type="button" onClick={() => { stopRun(); setTimes([]); }} disabled={times.length === 0 && !running} className="min-h-14 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.again}</button>
            </div>
          </div>
        )}
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.more}</summary>
          <div className="mt-3 space-y-4">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.shift}</p>
              <ChoiceButtons label={ui.shift} value={String(shift)} onChange={(value) => setSaved({ ...saved, shift: Number(value) })} options={names(ui.shifts)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.shiftHint}</p></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.hold}</p>
              <ChoiceButtons label={ui.hold} value={String(hold)} onChange={(value) => setSaved({ ...saved, hold: Number(value) })} options={names(ui.holds)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.holdHint}</p></div>
          </div>
        </details>
      </section>

      {lines.length > 0 && (
        <section className={`${card} space-y-3`}>
          <h2 className={heading}>{ui.timesTitle}</h2>
          <p className="text-[11px] text-slate-500">{ui.timesHint}</p>
          <ul className="space-y-2">
            {lines.map((line, k) => (
              <li key={`${k}-${line}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-900">{k + 1}. {line}</p>
                {k < times.length ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => nudge(k, -0.1)} disabled={running} className={smallButton} aria-label={`${ui.earlier} ${k + 1}`}>− 0.1</button>
                    <input type="number" step={0.1} min={0} value={Math.round((times[k] ?? 0) * 10) / 10} disabled={running} aria-label={ui.timeOf.replace('{n}', String(k + 1))} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setTime(k, value); }} className={inputClass} />
                    <button type="button" onClick={() => nudge(k, 0.1)} disabled={running} className={smallButton} aria-label={`${ui.later} ${k + 1}`}>+ 0.1</button>
                  </div>
                ) : <p className="mt-1 text-[11px] text-slate-500">{ui.notTapped}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <CaptionVideoPanel storageKey="mdu_tap_captions_style_v1" cues={cues} voice={voice} duration={total} fileBase={fileBase} disabled={running} />

      <section className={`${card} space-y-3`}>
        <ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={running} />
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default TapCaptions;
