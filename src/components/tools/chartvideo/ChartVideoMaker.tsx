import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Mic, Pause, Play, Video } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/chartvideo.ui.en.json';
import examples from '../../../locales/packs/chartvideo.examples.en.json';
import '../shops/posterFonts.css';
import { parseChart, type ChartStep, type ChartType } from '../../../lib/chartvideo/parse';
import { buildTimeline, makeRenderer, STYLES, type ChartOptions, type GroupingId, type HighlightId, type Renderer, type SortId, type StyleId } from '../../../lib/chartvideo/scene';
import type { FontId, SpeedId } from '../../../lib/sequence/scene';
import { canRecordVoice, paddedVoice, playVoice, readVoiceFile, renderVoice, startVoiceRecording, type Voice, type VoiceRecorder } from '../../../lib/sequence/voice';
import { canEncodeAac, encodeAac } from '../../../lib/globe/audio';
import { canEncodeOffline, encodeOffline } from '../../../lib/globe/encode';
import { recordCanvas, recordSupport, videoSize } from '../../../lib/globe/record';

const STORAGE_KEY = 'mdu_chart_video_v1';
type Shape = 'reel' | 'wide' | 'square' | 'portrait';
interface Saved { code: string; options: ChartOptions; shape: Shape; quality: 720 | 1080 | 2160 }
type ExampleId = keyof typeof examples;

const DEFAULTS: Saved = { code: examples.sales.code, options: { type: 'bar', style: 'clean', font: 'clean', speed: 'normal', multi: true, values: true, countUp: true, grid: true, highlight: 'max', sort: 'none', grouping: 'indian', prefix: '', suffix: '', endText: '', top: 8 }, shape: 'reel', quality: 1080 };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const MAX_CODE = 4000;

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.code === 'string') return { ...DEFAULTS, ...raw, options: { ...DEFAULTS.options, ...raw.options } } as Saved;
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** A short description of a step, shown while recording so you know what to say next. */
function describe(step: ChartStep): string {
  if (step.kind === 'pause') return '…';
  return `${step.label}${step.values.length === 1 ? `: ${step.values[0]}` : ''}`;
}

/** Type short lines such as Jan: 40 and save a video of a chart that builds up step by step, with an optional voice-over. Drawn and recorded on your device. */
export const ChartVideoMaker: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { code, options, shape, quality } = saved;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [fontTick, setFontTick] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(0);
  const [wasSmooth, setWasSmooth] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; size: number; extension: string; sound: boolean } | null>(null);
  const [picture, setPicture] = useState<{ url: string; name: string } | null>(null);
  const [smooth, setSmooth] = useState<{ ok: boolean; codec: string }>({ ok: false, codec: '' });
  const [fourK, setFourK] = useState(false);
  const [aac, setAac] = useState(false);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [stepTimes, setStepTimes] = useState<number[] | null>(null);
  const [fit, setFit] = useState(true);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [tapping, setTapping] = useState(false);
  const [taps, setTaps] = useState(0);
  const tapTimes = useRef<number[]>([]);
  const recorder = useRef<VoiceRecorder | null>(null);
  const heard = useRef<{ stop: () => void } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const support = useMemo(() => recordSupport(false), []);
  const supportWithSound = useMemo(() => recordSupport(true), []);
  const full = videoSize(shape, quality);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { abort.current?.abort(); recorder.current?.cancel(); heard.current?.stop(); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { if (picture) URL.revokeObjectURL(picture.url); }, [picture]);
  useEffect(() => { let live = true; void canEncodeOffline(full.width, full.height, 30).then((found) => { if (live) setSmooth(found); }); return () => { live = false; }; }, [full.width, full.height]);
  useEffect(() => { let live = true; const big = videoSize(shape, 2160); void canEncodeOffline(big.width, big.height, 30).then((found) => { if (live) setFourK(found.ok); }); return () => { live = false; }; }, [shape]);
  useEffect(() => { let live = true; void canEncodeAac().then((ok) => { if (live) setAac(ok); }); return () => { live = false; }; }, []);
  // The fonts load the first time they are used; draw again once they are here.
  useEffect(() => { let live = true; void Promise.all(['700 30px Poppins', '500 30px Poppins', '700 30px Fredoka', '500 30px Fredoka'].map((font) => document.fonts.load(font, 'AaBb'))).catch(() => undefined).then(() => { if (live) setFontTick((tick) => tick + 1); }); return () => { live = false; }; }, []);

  const deck = useMemo(() => parseChart(code, options.type), [code, options.type]);
  const stepCount = deck.steps.length;
  const validTimes = voice && stepTimes && stepTimes.length === stepCount ? stepTimes : null;
  const finale = options.highlight !== 'none' || !!options.endText.trim() || !!deck.endText;
  const timeline = useMemo(() => buildTimeline(deck, options.type, options.speed, { stepTimes: validTimes, minDuration: voice ? voice.seconds + 0.6 : 0, fitTo: voice && fit && !validTimes ? voice.seconds : undefined, finale }), [deck, options.type, options.speed, finale, validTimes, voice, fit]);
  const duration = timeline.duration;

  const reset = () => { setResult(null); setPicture(null); };
  const update = (patch: Partial<ChartOptions>) => { reset(); setSaved((current) => ({ ...current, options: { ...current.options, ...patch } })); };
  const setCode = (next: string) => { reset(); setSaved((current) => ({ ...current, code: next.slice(0, MAX_CODE) })); };

  const previewScale = Math.min(1, 640 / Math.max(full.width, full.height));
  const previewW = Math.round(full.width * previewScale), previewH = Math.round(full.height * previewScale);
  const ready = deck.steps.length > 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview: Renderer | null = useMemo(() => (ready ? makeRenderer(deck, options, previewW, previewH, timeline) : null), [deck, options, previewW, previewH, timeline, ready, fontTick]);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    if (preview) preview.paint(ctx, Math.min(time, duration)); else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = STYLES[options.style].bg; ctx.fillRect(0, 0, previewW, previewH); }
  }, [preview, time, duration, options.style, previewW, previewH]);

  // Play the preview, with the voice if there is one.
  useEffect(() => {
    if (!playing) return undefined;
    const begin = performance.now() - time * 1000;
    heard.current?.stop(); heard.current = voice ? playVoice(voice, time) : null;
    let raf = 0;
    const step = () => {
      const seconds = (performance.now() - begin) / 1000;
      if (seconds >= duration) { setPlaying(false); setTime(duration); return; }
      setTime(seconds);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); heard.current?.stop(); heard.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration]);

  // While recording a voice, the picture shows the step that was last tapped.
  useEffect(() => {
    if (!tapping) return undefined;
    let raf = 0;
    const step = () => {
      const first = timeline.starts[0]; const k = taps - 1;
      if (first !== undefined) {
        if (k < 0) setTime(Math.max(0, first - 0.01));
        else { const start = timeline.starts[k], end = timeline.ends[k]; if (start !== undefined && end !== undefined) setTime(start + Math.min((recorder.current?.elapsed() ?? 0) - (tapTimes.current[k] ?? 0), end - start - 0.001)); }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [tapping, taps, timeline]);

  const togglePlay = () => { if (playing) setPlaying(false); else { if (time >= duration - 0.05) setTime(0); setPlaying(true); } };

  const startTapping = async () => {
    setVoiceMessage(''); setPlaying(false); reset();
    if (!canRecordVoice()) { setVoiceMessage(ui.voiceUnsupported); return; }
    try { recorder.current = await startVoiceRecording(); } catch { setVoiceMessage(ui.voiceBlocked); return; }
    setVoice(null); setStepTimes(null); tapTimes.current = []; setTaps(0); setTime(0); setTapping(true);
  };
  const nextStep = () => { if (!recorder.current) return; tapTimes.current.push(recorder.current.elapsed()); setTaps(tapTimes.current.length); };
  const finishTapping = async () => {
    const active = recorder.current; if (!active) return;
    setTapping(false);
    try {
      const recorded = await active.stop(); recorder.current = null;
      // Steps that were never tapped follow the last tap, a moment apart.
      const times = [...tapTimes.current]; while (times.length < stepCount) times.push((times[times.length - 1] ?? 0.6) + 1.5);
      setVoice(recorded); setStepTimes(times); setTime(0);
    } catch { recorder.current = null; setVoiceMessage(ui.voiceReadFailed); }
  };
  const cancelTapping = () => { recorder.current?.cancel(); recorder.current = null; setTapping(false); setTime(0); };
  const addVoiceFile = async (file: File) => {
    setVoiceMessage(''); reset();
    try { const read = await readVoiceFile(file); setVoice(read); setStepTimes(null); setTime(0); } catch { setVoiceMessage(ui.voiceReadFailed); }
  };
  const removeVoice = () => { setVoice(null); setStepTimes(null); setPlaying(false); reset(); };

  const needsSmooth = quality === 2160;
  const useSmooth = smooth.ok && (!voice || aac);
  const canMake = !!preview && !tapping && (needsSmooth ? smooth.ok && (!voice || aac) : useSmooth || (voice ? supportWithSound.ok : support.ok));
  const fileBase = (deck.title || 'chart-video').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'chart-video';

  const renderAt = (target: HTMLCanvasElement) => {
    const renderer = makeRenderer(deck, options, target.width, target.height, timeline);
    const ctx = target.getContext('2d')!;
    return { renderer, paint: (seconds: number) => renderer.paint(ctx, seconds) };
  };

  const makeVideo = async () => {
    setPlaying(false); setMessage(''); setResult(null); setProgress(0); setStarted(performance.now()); setWasSmooth(useSmooth); setRecording(true);
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    const control = new AbortController(); abort.current = control;
    let lock: { release: () => Promise<void> } | null = null;
    try { lock = await (navigator as unknown as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed: carry on */ }
    try {
      const { renderer, paint } = renderAt(target);
      if (useSmooth) {
        const sound = voice ? await encodeAac(await renderVoice(voice, renderer.duration)) : undefined;
        const done = await encodeOffline({ canvas: target, codec: smooth.codec, duration: renderer.duration, fps: 30, paint, onProgress: setProgress, signal: control.signal, audio: sound });
        if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.mp4`, size: done.blob.size, extension: 'mp4', sound: !!sound });
        return;
      }
      const done = await recordCanvas({ canvas: target, duration: renderer.duration, fps: 30, paint, onProgress: setProgress, signal: control.signal, music: voice ? { buffer: await paddedVoice(voice, renderer.duration), volume: 1 } : undefined });
      if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.${done.support.extension}`, size: done.blob.size, extension: done.support.extension, sound: !!voice });
    } catch { setMessage(ui.failed); }
    finally { void lock?.release().catch(() => undefined); setRecording(false); abort.current = null; }
  };

  const savePicture = () => {
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    renderAt(target).paint(time > 0 ? Math.min(time, duration) : duration);
    target.toBlob((blob) => { if (blob) setPicture({ url: URL.createObjectURL(blob), name: `${fileBase}.png` }); }, 'image/png');
  };

  const startAgain = () => { setSaved(DEFAULTS); reset(); setMessage(''); setTime(0); setPlaying(false); removeVoice(); setVoiceMessage(''); };
  const ratio = `${full.width} / ${full.height}`;
  const currentExample = (Object.keys(examples) as ExampleId[]).find((id) => examples[id].code === code) ?? '';
  const nextItem = deck.steps[taps];
  const busy = recording || tapping;
  const secs = (value: number) => value.toFixed(1);
  const voiceNote = !voice ? '' : validTimes ? ui.voiceTimed : stepTimes ? ui.voiceChanged : ui.voiceFitted;
  const append = (line: string) => setCode(`${code.replace(/\n+$/, '')}\n${line}`);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 flex justify-center rounded-xl bg-slate-900 p-2">
          <canvas ref={canvas} width={previewW} height={previewH} style={{ aspectRatio: ratio }} className="max-h-[70vh] w-full max-w-md rounded-lg" role="img" aria-label={deck.title || ui.preview} />
        </div>
        {!preview && <p className="mt-2 text-xs text-slate-600">{ui.empty}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={togglePlay} disabled={busy || !preview} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-40">
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{playing ? ui.pause : ui.play}
          </button>
          <input type="range" min={0} max={duration} step={0.05} value={Math.min(time, duration)} disabled={busy || !preview} aria-label={ui.preview} onChange={(event) => { setPlaying(false); setTime(Number(event.target.value)); }} className="w-full accent-orange-700" />
          <span className="w-12 text-right text-xs font-semibold text-slate-700">{secs(Math.min(time, duration))}s</span>
        </div>
        {preview && <p className="mt-1 text-[11px] text-slate-500">{ui.lengthNote.replace('{seconds}', secs(duration)).replace('{steps}', String(stepCount))}</p>}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.text}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.examples}</p>
          <ChoiceButtons label={ui.examples} value={currentExample} onChange={(value) => { if (!busy) { const example = examples[value as ExampleId]; reset(); setSaved((current) => ({ ...current, code: example.code, options: { ...current.options, type: example.type as ChartType } })); } }} options={(Object.keys(examples) as ExampleId[]).map((id) => ({ value: id, label: examples[id].label }))} /></div>
        <label className="block text-xs font-semibold text-slate-700">{ui.textLabel}
          <textarea value={code} rows={10} spellCheck={false} autoCapitalize="off" autoCorrect="off" disabled={tapping} onChange={(event) => setCode(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm font-normal leading-6 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </label>
        <p className="text-[11px] text-slate-500">{ui.textHint}</p>
        {deck.issues.length > 0 && (
          <div role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900"><p className="font-semibold">{ui.errors}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">{deck.issues.map((problem, k) => <li key={`${problem.line}-${k}`}>{problem.line ? `${ui.line.replace('{n}', String(problem.line))}: ` : ''}{problem.message}</li>)}</ul></div>
        )}
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.syntax}</summary>
          <p className="mt-2 text-[11px] text-slate-500">{ui.syntaxHint}</p>
          <ul className="mt-2 space-y-3">
            {ui.syntaxItems.map((item) => (
              <li key={item.title} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-600">{item.note}</p>
                <pre className="mt-1 overflow-x-auto rounded-md bg-slate-100 p-2 font-mono text-xs text-slate-900">{item.code}</pre>
                <button type="button" disabled={busy} onClick={() => append(item.code)} className="mt-2 min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.add}</button>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.chart}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.type}</p>
          <ChoiceButtons label={ui.type} value={options.type} onChange={(value) => update({ type: value as ChartType })} options={names(ui.types)} />
          <p className="mt-1 text-[11px] text-slate-500">{ui.typeHint[options.type]}</p></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.style}</p>
          <ChoiceButtons label={ui.style} value={options.style} onChange={(value) => update({ style: value as StyleId, font: STYLES[value as StyleId].font })} options={names(ui.styles)} /></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.font}</p>
          <ChoiceButtons label={ui.font} value={options.font} onChange={(value) => update({ font: value as FontId })} options={names(ui.fonts)} /></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.speed}</p>
          <ChoiceButtons label={ui.speed} value={options.speed} onChange={(value) => update({ speed: value as SpeedId })} options={names(ui.speeds)} /></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.highlight}</p>
          <ChoiceButtons label={ui.highlight} value={options.highlight} onChange={(value) => update({ highlight: value as HighlightId })} options={names(ui.highlights)} /></div>
        {(options.type === 'bar' || options.type === 'hbar') && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.sort}</p>
          <ChoiceButtons label={ui.sort} value={options.sort} onChange={(value) => update({ sort: value as SortId })} options={names(ui.sorts)} /></div>}
        {options.type === 'race' && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.top}</p>
          <ChoiceButtons label={ui.top} value={String(options.top)} onChange={(value) => update({ top: Number(value) })} options={names(ui.tops)} /></div>}
        <Toggle label={ui.values} checked={options.values} onChange={(value) => update({ values: value })} />
        {options.values && (options.type === 'bar' || options.type === 'hbar' || options.type === 'donut') && <Toggle label={ui.countUp} checked={options.countUp} onChange={(value) => update({ countUp: value })} />}
        {(options.type === 'bar' || options.type === 'hbar' || options.type === 'line') && <Toggle label={ui.grid} checked={options.grid} onChange={(value) => update({ grid: value })} />}
        {(options.type === 'bar' || options.type === 'hbar' || options.type === 'race') && <Toggle label={ui.multi} checked={options.multi} onChange={(value) => update({ multi: value })} />}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.numbers}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.grouping}</p>
          <ChoiceButtons label={ui.grouping} value={options.grouping} onChange={(value) => update({ grouping: value as GroupingId })} options={names(ui.groupings)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-slate-700">{ui.prefix}
            <input type="text" value={options.prefix} maxLength={6} placeholder="₹" onChange={(event) => update({ prefix: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" /></label>
          <label className="block text-xs font-semibold text-slate-700">{ui.suffix}
            <input type="text" value={options.suffix} maxLength={10} placeholder="%" onChange={(event) => update({ suffix: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" /></label>
        </div>
        <label className="block text-xs font-semibold text-slate-700">{ui.endText}
          <input type="text" value={options.endText} maxLength={80} placeholder={ui.endPlaceholder} onChange={(event) => update({ endText: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" /></label>
        <p className="text-[11px] text-slate-500">{ui.numbersHint}</p>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.voice}</h2>
        <p className="text-[11px] text-slate-500">{ui.voiceHint}</p>
        {tapping ? (
          <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-3" role="group" aria-label={ui.voiceTapTitle}>
            <p className="text-sm font-bold text-slate-900">{ui.voiceTapTitle}</p>
            <p className="text-xs text-slate-700" role="status">{taps === 0 ? ui.voiceReady : ui.voiceStep.replace('{done}', String(taps)).replace('{total}', String(stepCount))}</p>
            {nextItem && taps < stepCount && <p className="rounded-lg bg-white p-2 text-xs text-slate-800">{describe(nextItem)}</p>}
            <div className="flex flex-wrap gap-2">
              {taps < stepCount
                ? <button type="button" onClick={nextStep} className="min-h-14 flex-1 rounded-xl bg-orange-700 px-4 text-base font-bold text-white hover:bg-orange-800">{ui.voiceNext}</button>
                : <button type="button" onClick={() => void finishTapping()} className="min-h-14 flex-1 rounded-xl bg-orange-700 px-4 text-base font-bold text-white hover:bg-orange-800">{ui.voiceFinish}</button>}
              {taps < stepCount && taps > 0 && <button type="button" onClick={() => void finishTapping()} className="min-h-14 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.voiceFinish}</button>}
              <button type="button" onClick={cancelTapping} className="min-h-14 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.voiceCancel}</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void startTapping()} disabled={recording || !preview || stepCount === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-40"><Mic className="h-4 w-4" aria-hidden="true" />{ui.voiceRecord}</button>
            <label className={`inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 ${recording ? 'pointer-events-none opacity-40' : ''}`}>{ui.voiceFile}
              <input type="file" accept="audio/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addVoiceFile(file); }} /></label>
          </div>
        )}
        {voiceMessage && <Note>{voiceMessage}</Note>}
        {voice && !tapping && (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-800">{voiceNote.replace('{name}', voice.name).replace('{seconds}', secs(voice.seconds))}</p>
            {!validTimes && <Toggle label={ui.voiceFit} checked={fit} onChange={setFit} />}
            {!aac && !supportWithSound.ok && <Note>{ui.voiceNoSound}</Note>}
            <button type="button" onClick={removeVoice} disabled={recording} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.voiceRemove}</button>
          </div>
        )}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.shape}</h2>
        <ChoiceButtons label={ui.shape} value={shape} onChange={(value) => { setSaved({ ...saved, shape: value as Shape }); reset(); }} options={names(ui.shapes)} />
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
          <ChoiceButtons label={ui.quality} value={String(quality)} onChange={(value) => { setSaved({ ...saved, quality: value === '2160' ? 2160 : value === '1080' ? 1080 : 720 }); reset(); }} options={names(ui.qualities).filter((item) => item.value !== '2160' || fourK || quality === 2160)} />
          {quality === 2160 && <p className="mt-1 text-[11px] text-slate-500">{ui.fourKHint}</p>}</div>
        <p className="text-[11px] text-slate-500">{ui.tip}</p>
        <p className="text-[11px] text-slate-500">{ui.credit}</p>
      </section>

      <section className={`${card} space-y-3`}>
        {!canMake && preview && !tapping && <Note>{ui.noRecord}</Note>}
        {recording && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round(progress * 100)}%` }} /></div><p className="text-xs text-slate-700">{wasSmooth ? ui.keepOpenSmooth.replace('{done}', String(Math.round(progress * 100))).replace('{left}', progress > 0.03 ? String(Math.max(1, Math.round(((performance.now() - started) / 1000) * (1 - progress) / progress))) : '…') : ui.keepOpen}</p></>}
        {recording
          ? <button type="button" onClick={() => abort.current?.abort()} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.cancel}</button>
          : <MainActionButton onClick={() => void makeVideo()} disabled={!canMake}><Video className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
        {message && <Note>{message}</Note>}
        {result && (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-3">
            <video src={result.url} controls playsInline className="mx-auto max-h-[70vh] w-full max-w-md rounded-lg bg-black" style={{ aspectRatio: ratio }} />
            <p className="text-xs text-slate-700">{result.extension === 'mp4' ? (wasSmooth ? ui.smoothNote : ui.mp4Note) : ui.webmNote}</p>
            <SaveResult href={result.url} name={result.name} label={ui.ready} saveLabel={ui.saveVideo} detail={formatBytes(result.size)} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={savePicture} disabled={busy || !preview} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40"><ImageIcon className="h-4 w-4" aria-hidden="true" />{ui.makePicture}</button>
          {picture && <div className="w-full"><SaveResult href={picture.url} name={picture.name} label={ui.pictureReady} saveLabel={ui.savePicture} /></div>}
          <ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={busy} />
        </div>
      </section>
    </div>
  );
};

export default ChartVideoMaker;
