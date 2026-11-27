import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import ui from '../../../locales/packs/speakcaptions.ui.en.json';
import starters from '../../../locales/packs/speakcaptions.examples.en.json';
import { cuesFromSpeech } from '../../../lib/captions/cues';
import type { CaptionOptions } from '../../../lib/captions/scene';
import { LANGUAGES, speechSupported, startListening, type Heard, type Listening, type SpeechProblem } from '../../../lib/speech/recognize';
import { startVoiceRecording, type Voice, type VoiceRecorder } from '../../../lib/sequence/voice';
import { CaptionVideoPanel } from './CaptionVideoPanel';

const STORAGE_KEY = 'mdu_speak_captions_v1';
interface Saved { lang: string; words: number; nudge: number }
type StarterId = keyof typeof starters;
const DEFAULTS: Saved = { lang: 'en-IN', words: 3, nudge: 0 };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const rowInput = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
const smallButton = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.lang === 'string') return { ...DEFAULTS, ...raw } as Saved;
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** Speak, and the words appear as timed captions. Save SRT and WebVTT files or a captions video. Speech is turned into text by the browser's own service, which the page says plainly. */
export const SpeakCaptions: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { lang, words, nudge } = saved;
  const [segments, setSegments] = useState<Heard[]>([]);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [listening, setListening] = useState(false);
  const [now, setNow] = useState(0);
  const [problem, setProblem] = useState('');
  const [preset, setPreset] = useState<{ id: number; options: Partial<CaptionOptions> }>({ id: 0, options: {} });
  const recorder = useRef<VoiceRecorder | null>(null);
  const session = useRef<Listening | null>(null);
  const begin = useRef(0);
  const supported = useMemo(() => speechSupported(), []);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { session.current?.stop(); recorder.current?.cancel(); }, []);
  useEffect(() => {
    if (!listening) return undefined;
    let raf = 0; const step = () => { setNow(recorder.current ? recorder.current.elapsed() : (performance.now() - begin.current) / 1000); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [listening]);

  const message = (kind: SpeechProblem) => (kind === 'blocked' ? ui.blocked : kind === 'network' ? ui.network : ui.other);
  const start = async () => {
    setProblem(''); setSegments([]); setVoice(null);
    begin.current = performance.now();
    try { recorder.current = await startVoiceRecording(); } catch { recorder.current = null; setProblem(ui.noRecording); }
    begin.current = performance.now();
    const elapsed = () => (recorder.current ? recorder.current.elapsed() : (performance.now() - begin.current) / 1000);
    session.current = startListening({ lang, elapsed, onChange: setSegments, onProblem: (kind) => { setProblem(message(kind)); void stop(); } });
    setListening(true);
  };
  const stop = async () => {
    session.current?.stop(); session.current = null; setListening(false);
    const active = recorder.current; recorder.current = null;
    if (active) { try { setVoice(await active.stop()); } catch { setProblem(ui.noRecording); } }
  };
  useEffect(() => { if (!listening && segments.length === 0 && voice && !problem) setProblem(ui.nothing); }, [listening, segments.length, voice, problem]);

  const trySample = () => {
    setProblem(''); setVoice(null);
    setSegments(ui.sampleSentences.map((text, k) => ({ text, start: 0.5 + k * 3.2, end: 3.3 + k * 3.2 })));
  };
  const applyStarter = (id: StarterId) => { if (listening) return; const s = starters[id]; setSaved((current) => ({ ...current, lang: s.lang, words: s.words })); setPreset((current) => ({ id: current.id + 1, options: s.options as Partial<CaptionOptions> })); };
  const edit = (k: number, text: string) => setSegments((current) => current.map((item, index) => (index === k ? { ...item, text } : item)));
  const removeRow = (k: number) => setSegments((current) => current.filter((_, index) => index !== k));
  const startAgain = () => { session.current?.stop(); session.current = null; recorder.current?.cancel(); recorder.current = null; setListening(false); setSegments([]); setVoice(null); setProblem(''); setSaved(DEFAULTS); };

  const shifted = useMemo(() => segments.map((item) => ({ ...item, start: Math.max(0, item.start + nudge), end: Math.max(0.3, item.end + nudge) })), [segments, nudge]);
  const cues = useMemo(() => cuesFromSpeech(shifted, words), [shifted, words]);
  const last = segments.length ? Math.max(...segments.map((item) => item.end)) : 0;
  const duration = voice ? Math.max(voice.seconds, last + 0.5) : last + 1.5;
  const secs = (value: number) => value.toFixed(1);
  const lastWords = segments.slice(-3);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value="" onChange={(value) => applyStarter(value as StarterId)} options={(Object.keys(starters) as StarterId[]).map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{ui.startersHint}</p></div>
        <label className="block text-xs font-semibold text-slate-700">{ui.language}
          <select value={lang} disabled={listening} onChange={(event) => setSaved({ ...saved, lang: event.target.value })} className={rowInput}>{names(LANGUAGES).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <p className="text-[11px] text-slate-500">{ui.languageHint}</p>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.wordsPer}</p>
          <ChoiceButtons label={ui.wordsPer} value={String(words)} onChange={(value) => setSaved({ ...saved, words: Number(value) })} options={names(ui.wordsPers)} />
          <p className="mt-1 text-[11px] text-slate-500">{ui.wordsHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.speak}</h2>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3" role="note">
          <p className="text-sm font-bold text-amber-900">{ui.privacyTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900">{ui.privacy.replace('{siteName}', 'this site')}</p>
        </div>
        {!supported && <Note>{ui.unsupported}</Note>}
        {listening ? (
          <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-3" role="group" aria-label={ui.speak}>
            <p className="text-sm font-bold text-slate-900" role="status">{ui.listening.replace('{seconds}', secs(now))}</p>
            <p className="text-[11px] text-slate-600">{ui.listeningHint}</p>
            {lastWords.map((item, k) => <p key={`${segments.length - lastWords.length + k}`} className="rounded-lg bg-white p-2 text-sm text-slate-900">{item.text}</p>)}
            <button type="button" onClick={() => void stop()} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 text-base font-bold text-white hover:bg-orange-800"><Square className="h-5 w-5" aria-hidden="true" />{ui.stop}</button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void start()} disabled={!supported} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-40"><Mic className="h-4 w-4" aria-hidden="true" />{ui.begin}</button>
            <button type="button" onClick={trySample} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.trySample}</button>
          </div>
        )}
        {!listening && <p className="text-[11px] text-slate-500">{ui.sampleHint}</p>}
        {problem && <Note>{problem}</Note>}
      </section>

      {segments.length > 0 && !listening && (
        <section className={`${card} space-y-3`}>
          <h2 className={heading}>{ui.check}</h2>
          <p className="text-[11px] text-slate-500">{ui.checkHint}</p>
          <p className="text-xs text-slate-700">{ui.heardCount.replace('{count}', String(segments.length)).replace('{seconds}', secs(duration))}</p>
          <ul className="space-y-2">
            {segments.map((item, k) => (
              <li key={k} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="block text-xs font-semibold text-slate-700">{ui.rowLabel.replace('{n}', String(k + 1))} ({secs(item.start)}–{secs(item.end)} s)
                  <input type="text" value={item.text} onChange={(event) => edit(k, event.target.value)} className={rowInput} /></label>
                <button type="button" onClick={() => removeRow(k)} className={`${smallButton} mt-2`} aria-label={ui.removeRow.replace('{n}', String(k + 1))}>{ui.removeRow.replace('{n}', String(k + 1))}</button>
              </li>
            ))}
          </ul>
          <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.more}</summary>
            <div className="mt-3 space-y-2"><p className="text-xs font-semibold text-slate-700">{ui.nudge}</p>
              <ChoiceButtons label={ui.nudge} value={String(nudge)} onChange={(value) => setSaved({ ...saved, nudge: Number(value) })} options={names(ui.nudges)} />
              <p className="text-[11px] text-slate-500">{ui.nudgeHint}</p></div>
          </details>
          <p className="text-[11px] text-slate-500">{ui.scripts}</p>
        </section>
      )}

      <CaptionVideoPanel storageKey="mdu_speak_captions_style_v1" cues={cues} voice={voice} duration={duration} fileBase="speak-captions" disabled={listening} preset={preset} />

      <section className={`${card} space-y-3`}>
        <ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={listening} />
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default SpeakCaptions;
