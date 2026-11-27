import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Mic, Pause, Play, Video } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/slides.ui.en.json';
import examples from '../../../locales/packs/slides.examples.en.json';
import '../shops/posterFonts.css';
import { parseDeck, type StepInfo } from '../../../lib/slides/parse';
import { buildTimeline, makeRenderer, type LayoutId, type Pic, type RevealId, type Renderer, type SlideOptions } from '../../../lib/slides/scene';
import { STYLES, type StyleId } from '../../../lib/slides/styles';
import { drawIcon, ICON_NAMES } from '../../../lib/slides/icons';
import type { FontId, SpeedId } from '../../../lib/sequence/scene';
import { canRecordVoice, paddedVoice, playVoice, readVoiceFile, renderVoice, startVoiceRecording, type Voice, type VoiceRecorder } from '../../../lib/sequence/voice';
import { canEncodeAac, encodeAac } from '../../../lib/globe/audio';
import { canEncodeOffline, encodeOffline } from '../../../lib/globe/encode';
import { recordCanvas, recordSupport, videoSize } from '../../../lib/globe/record';

const STORAGE_KEY = 'mdu_slides_video_v1';
type Shape = 'reel' | 'wide' | 'square' | 'portrait';
interface Saved { code: string; options: SlideOptions; shape: Shape; quality: 720 | 1080 | 2160 }
type ExampleId = keyof typeof examples;

const DEFAULTS: Saved = { code: examples.shipping.code, options: { style: 'clean', font: 'clean', speed: 'normal', layout: 'auto', reveal: 'pop', zoom: true, boxes: true }, shape: 'reel', quality: 1080 };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const MAX_CODE = 6000;

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.code === 'string') return { ...DEFAULTS, ...raw, options: { ...DEFAULTS.options, ...raw.options } } as Saved;
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** A short description of a step, shown while recording so you know what to say next. */
function describe(step: StepInfo): string {
  const label: Record<StepInfo['kind'], string> = { left: 'Left', right: 'Right', center: 'Middle', arrow: 'Arrow', bullet: 'Point', big: 'Big', down: 'Arrow down', pause: 'Pause' };
  return `${label[step.kind]}${step.text ? `: ${step.text.replace(/\n/g, ' ')}` : ''}`;
}

/** One icon, drawn small on its own canvas for the icon list. */
const IconPreview: React.FC<{ name: string; style: StyleId }> = ({ name, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, 96, 96); drawIcon(ctx, name, 48, 48, 72, { line: '#1f2937', fill: '#fdba74', detail: '#ffffff' }); void style;
  }, [name, style]);
  return <canvas ref={ref} width={96} height={96} className="h-12 w-12" aria-hidden="true" />;
};

interface Added { name: string; label: string; pic: Pic; url: string }
const MAX_PICTURES = 6;

/** Reads a photo and shrinks it to at most 1000 px on its long side, so it stays light in memory. */
async function readPicture(file: File): Promise<Omit<Added, 'name'>> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const url = await new Promise<string>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject(new Error('No picture'))), 'image/jpeg', 0.85));
  return { label: file.name, pic: { source: canvas, width: canvas.width, height: canvas.height }, url };
}

/** Type slides as short lines (left, arrow, right, bullets, big text, pictures) and save a video where they build up step by step, with an optional voice-over. Drawn and recorded on your device. */
export const ExplainerVideoMaker: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { code, options, shape, quality } = saved;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [fontTick, setFontTick] = useState(0);
  const [added, setAdded] = useState<Added[]>([]);
  const addedRef = useRef<Added[]>([]);
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
  useEffect(() => { addedRef.current = added; }, [added]);
  useEffect(() => () => { abort.current?.abort(); recorder.current?.cancel(); heard.current?.stop(); addedRef.current.forEach((item) => URL.revokeObjectURL(item.url)); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { if (picture) URL.revokeObjectURL(picture.url); }, [picture]);
  useEffect(() => { let live = true; void canEncodeOffline(full.width, full.height, 30).then((found) => { if (live) setSmooth(found); }); return () => { live = false; }; }, [full.width, full.height]);
  useEffect(() => { let live = true; const big = videoSize(shape, 2160); void canEncodeOffline(big.width, big.height, 30).then((found) => { if (live) setFourK(found.ok); }); return () => { live = false; }; }, [shape]);
  useEffect(() => { let live = true; void canEncodeAac().then((ok) => { if (live) setAac(ok); }); return () => { live = false; }; }, []);
  // The fonts load the first time they are used; draw again once they are here.
  useEffect(() => { let live = true; void Promise.all(['500 30px Poppins', '500 30px Fredoka'].map((font) => document.fonts.load(font, 'AaBb'))).catch(() => undefined).then(() => { if (live) setFontTick((tick) => tick + 1); }); return () => { live = false; }; }, []);

  const imageNames = useMemo(() => added.map((item) => item.name), [added]);
  const deck = useMemo(() => parseDeck(code, imageNames), [code, imageNames]);
  const images = useMemo(() => new Map(added.map((item) => [item.name, item.pic])), [added]);
  const stepCount = deck.steps.length;
  const validTimes = voice && stepTimes && stepTimes.length === stepCount ? stepTimes : null;
  const timeline = useMemo(() => buildTimeline(deck, options.speed, { stepTimes: validTimes, minDuration: voice ? voice.seconds + 0.6 : 0, fitTo: voice && fit && !validTimes ? voice.seconds : undefined }), [deck, options.speed, validTimes, voice, fit]);
  const duration = timeline.duration;

  const reset = () => { setResult(null); setPicture(null); };
  const update = (patch: Partial<SlideOptions>) => { reset(); setSaved((current) => ({ ...current, options: { ...current.options, ...patch } })); };
  const setCode = (next: string) => { reset(); setSaved((current) => ({ ...current, code: next.slice(0, MAX_CODE) })); };

  const previewScale = Math.min(1, 640 / Math.max(full.width, full.height));
  const previewW = Math.round(full.width * previewScale), previewH = Math.round(full.height * previewScale);
  const ready = deck.steps.length > 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview: Renderer | null = useMemo(() => (ready ? makeRenderer(deck, options, images, previewW, previewH, timeline) : null), [deck, options, images, previewW, previewH, timeline, ready, fontTick]);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    if (preview) preview.paint(ctx, Math.min(time, duration)); else { ctx.fillStyle = (Array.isArray(STYLES[options.style].bg) ? STYLES[options.style].bg[0] : STYLES[options.style].bg as string); ctx.fillRect(0, 0, previewW, previewH); }
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

  const [pictureMessage, setPictureMessage] = useState('');
  const addPicture = async (file: File) => {
    setPictureMessage('');
    if (added.length >= MAX_PICTURES) { setPictureMessage(ui.picturesFull); return; }
    try {
      const read = await readPicture(file); reset();
      setAdded((list) => { let n = list.length + 1; while (list.some((item) => item.name === `photo${n}`)) n += 1; return [...list, { ...read, name: `photo${n}` }]; });
    } catch { setPictureMessage(ui.pictureFailed); }
  };
  const removePicture = (name: string) => { reset(); setAdded((list) => { list.filter((item) => item.name === name).forEach((item) => URL.revokeObjectURL(item.url)); return list.filter((item) => item.name !== name); }); };

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
  const fileBase = (deck.slides[0]?.title || 'explainer-video').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'explainer-video';

  const renderAt = (target: HTMLCanvasElement) => {
    const renderer = makeRenderer(deck, options, images, target.width, target.height, timeline);
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
    renderAt(target).paint(duration);
    target.toBlob((blob) => { if (blob) setPicture({ url: URL.createObjectURL(blob), name: `${fileBase}.png` }); }, 'image/png');
  };

  const startAgain = () => { setSaved(DEFAULTS); setAdded((list) => { list.forEach((item) => URL.revokeObjectURL(item.url)); return []; }); setPictureMessage(''); reset(); setMessage(''); setTime(0); setPlaying(false); removeVoice(); setVoiceMessage(''); };
  const ratio = `${full.width} / ${full.height}`;
  const currentExample = (Object.keys(examples) as ExampleId[]).find((id) => examples[id].code === code) ?? '';
  const nextItem = deck.steps[taps];
  const busy = recording || tapping;
  const secs = (value: number) => value.toFixed(1);
  const voiceNote = !voice ? '' : validTimes ? ui.voiceTimed : stepTimes ? ui.voiceChanged : ui.voiceFitted;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 flex justify-center rounded-xl bg-slate-900 p-2">
          <canvas ref={canvas} width={previewW} height={previewH} style={{ aspectRatio: ratio }} className="max-h-[70vh] w-full max-w-md rounded-lg" role="img" aria-label={deck.slides[0]?.title || ui.preview} />
        </div>
        {!preview && <p className="mt-2 text-xs text-slate-600">{ui.empty}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={togglePlay} disabled={busy || !preview} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-40">
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{playing ? ui.pause : ui.play}
          </button>
          <input type="range" min={0} max={duration} step={0.05} value={Math.min(time, duration)} disabled={busy || !preview} aria-label={ui.preview} onChange={(event) => { setPlaying(false); setTime(Number(event.target.value)); }} className="w-full accent-orange-700" />
          <span className="w-12 text-right text-xs font-semibold text-slate-700">{secs(Math.min(time, duration))}s</span>
        </div>
        {preview && <p className="mt-1 text-[11px] text-slate-500">{ui.lengthNote.replace('{seconds}', secs(duration)).replace('{steps}', String(stepCount)).replace('{slides}', String(deck.slides.filter((slide) => slide.firstStep >= 0).length))}{preview.crowded.length ? ` ${ui.crowdedNote.replace('{n}', preview.crowded.map((k) => k + 1).join(', '))}` : ''}</p>}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.text}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.examples}</p>
          <ChoiceButtons label={ui.examples} value={currentExample} onChange={(value) => { if (!busy) setCode(examples[value as ExampleId].code); }} options={(Object.keys(examples) as ExampleId[]).map((id) => ({ value: id, label: examples[id].label }))} /></div>
        <label className="block text-xs font-semibold text-slate-700">{ui.textLabel}
          <textarea value={code} rows={12} spellCheck={false} autoCapitalize="off" autoCorrect="off" disabled={tapping} onChange={(event) => setCode(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm font-normal leading-6 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
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
                <button type="button" disabled={busy} onClick={() => setCode(`${code.replace(/\n+$/, '')}\n${item.code}`)} className="mt-2 min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.add}</button>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.look}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.style}</p>
          <ChoiceButtons label={ui.style} value={options.style} onChange={(value) => update({ style: value as StyleId, font: STYLES[value as StyleId].font })} options={names(ui.styles)} /></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.layout}</p>
          <ChoiceButtons label={ui.layout} value={options.layout} onChange={(value) => update({ layout: value as LayoutId })} options={names(ui.layouts)} />
          <p className="mt-1 text-[11px] text-slate-500">{ui.layoutHint}</p></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.reveal}</p>
          <ChoiceButtons label={ui.reveal} value={options.reveal} onChange={(value) => update({ reveal: value as RevealId })} options={names(ui.reveals)} /></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.font}</p>
          <ChoiceButtons label={ui.font} value={options.font} onChange={(value) => update({ font: value as FontId })} options={names(ui.fonts)} /></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.speed}</p>
          <ChoiceButtons label={ui.speed} value={options.speed} onChange={(value) => update({ speed: value as SpeedId })} options={names(ui.speeds)} /></div>
        <Toggle label={ui.zoom} checked={options.zoom} onChange={(value) => update({ zoom: value })} />
        <Toggle label={ui.boxes} checked={options.boxes} onChange={(value) => update({ boxes: value })} />
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.icons}</h2>
        <p className="text-[11px] text-slate-500">{ui.iconsHint}</p>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {ICON_NAMES.map((name) => (
            <li key={name}><button type="button" disabled={busy} onClick={() => setCode(`${code.replace(/\n+$/, '')}\nicon: ${name} ${ui.iconCaption}`)} aria-label={`${ui.addIcon} ${name}`} className="flex min-h-14 w-full flex-col items-center rounded-xl border border-slate-200 bg-white p-1 hover:bg-slate-50 disabled:opacity-40"><IconPreview name={name} style={options.style} /><span className="text-[11px] font-semibold text-slate-700">{name}</span></button></li>
          ))}
        </ul>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.pictures}</h2>
        <p className="text-[11px] text-slate-500">{ui.picturesHint}</p>
        <label className={`inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 ${busy || added.length >= MAX_PICTURES ? 'pointer-events-none opacity-40' : ''}`}>{ui.addPicture}
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addPicture(file); }} /></label>
        {pictureMessage && <Note>{pictureMessage}</Note>}
        <ul className="space-y-2">
          {added.map((item) => (
            <li key={item.name} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <img src={item.url} alt={item.label} className="h-12 w-12 rounded-lg object-cover" />
              <span className="min-w-0 flex-1 text-xs font-semibold text-slate-800"><span className="block truncate">{item.name}</span><span className="block truncate font-normal text-slate-500">{item.label}</span></span>
              {(['left', 'center', 'right'] as const).map((zone) => <button key={zone} type="button" disabled={busy} onClick={() => setCode(`${code.replace(/\n+$/, '')}\n${zone}-image: ${item.name}`)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.useOn[zone]}</button>)}
              <button type="button" disabled={busy} onClick={() => removePicture(item.name)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.removePicture}</button>
            </li>
          ))}
        </ul>
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

export default ExplainerVideoMaker;
