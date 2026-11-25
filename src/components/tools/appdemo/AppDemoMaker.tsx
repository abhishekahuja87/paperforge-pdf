import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Mic, Pause, Play, Video } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/appdemo.ui.en.json';
import starters from '../../../locales/packs/appdemo.examples.en.json';
import '../shops/posterFonts.css';
import { buildTimeline, DEMO_LOOKS, makeRenderer, type DemoLookId, type DemoOptions, type DeviceId, type HideSizeId, type LabelId, type MarkStyleId, type Pic, type Renderer, type Screen, type TransitionId } from '../../../lib/appdemo/scene';
import { makeSamples } from '../../../lib/appdemo/samples';
import type { FontId, SpeedId } from '../../../lib/sequence/scene';
import { canRecordVoice, paddedVoice, playVoice, readVoiceFile, renderVoice, startVoiceRecording, type Voice, type VoiceRecorder } from '../../../lib/sequence/voice';
import { canEncodeAac, encodeAac } from '../../../lib/globe/audio';
import { canEncodeOffline, encodeOffline } from '../../../lib/globe/encode';
import { recordCanvas, recordSupport, videoSize } from '../../../lib/globe/record';

const STORAGE_KEY = 'mdu_app_demo_v1';
const MAX_SCREENS = 8;
type Shape = 'reel' | 'wide' | 'square' | 'portrait';
interface Saved { options: DemoOptions; shape: Shape; quality: 720 | 1080 | 2160 }
interface Item { id: number; name: string; pic: Pic; url: string; label: string; seconds: number; mark: Screen['mark']; hide: Screen['hide']; mode: 'mark' | 'hide' }
type StarterId = keyof typeof starters;

const DEFAULTS: Saved = { options: { look: 'clean', font: 'clean', speed: 'normal', device: 'phone', transition: 'slide', label: 'card', scroll: true }, shape: 'reel', quality: 1080 };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const inputClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
const smallButton = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';
const blank = { mark: { style: 'none', x: 0.5, y: 0.35, zoom: false } as Screen['mark'], hide: { on: false, x: 0.5, y: 0.5, size: 'wide' } as Screen['hide'] };

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && raw.options) return { ...DEFAULTS, ...raw, options: { ...DEFAULTS.options, ...raw.options } } as Saved;
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

const toUrl = (canvas: HTMLCanvasElement) => new Promise<string>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject(new Error('No picture'))), 'image/jpeg', 0.8));

/** Reads a screenshot and shrinks it to at most 1000 px wide and 8000 px tall, so a long page stays light in memory. */
async function readScreenshot(file: File): Promise<{ pic: Pic; url: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / bitmap.width, 8000 / bitmap.height);
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  return { pic: { source: canvas, width: canvas.width, height: canvas.height }, url: await toUrl(canvas) };
}

/** Add screenshots and save a demo video: they sit in a phone or laptop frame, with a tap circle, arrow or box where you point, a zoom, smooth scrolling, a cover over private details and a line of words. Made on your device. */
export const AppDemoMaker: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { options, shape, quality } = saved;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [fontTick, setFontTick] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const nextId = useRef(1);
  const [notice, setNotice] = useState('');
  const [adding, setAdding] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(0);
  const [wasSmooth, setWasSmooth] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; size: number; extension: string } | null>(null);
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
  useEffect(() => () => { abort.current?.abort(); recorder.current?.cancel(); heard.current?.stop(); itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url)); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { if (picture) URL.revokeObjectURL(picture.url); }, [picture]);
  useEffect(() => { let live = true; void canEncodeOffline(full.width, full.height, 30).then((found) => { if (live) setSmooth(found); }); return () => { live = false; }; }, [full.width, full.height]);
  useEffect(() => { let live = true; const big = videoSize(shape, 2160); void canEncodeOffline(big.width, big.height, 30).then((found) => { if (live) setFourK(found.ok); }); return () => { live = false; }; }, [shape]);
  useEffect(() => { let live = true; void canEncodeAac().then((ok) => { if (live) setAac(ok); }); return () => { live = false; }; }, []);
  useEffect(() => { let live = true; void Promise.all(['700 30px Poppins', '500 30px Poppins', '700 30px Fredoka', '500 30px Fredoka'].map((font) => document.fonts.load(font, 'AaBb'))).catch(() => undefined).then(() => { if (live) setFontTick((tick) => tick + 1); }); return () => { live = false; }; }, []);

  const screens = useMemo<Screen[]>(() => items.map((item) => ({ pic: item.pic, label: item.label.trim(), seconds: item.seconds, mark: item.mark, hide: item.hide })), [items]);
  const stepCount = screens.length;
  const validTimes = voice && stepTimes && stepTimes.length === stepCount ? stepTimes : null;
  const timeline = useMemo(() => buildTimeline(screens, options, { stepTimes: validTimes, minDuration: voice ? voice.seconds + 0.6 : 0, fitTo: voice && fit && !validTimes ? voice.seconds : undefined }), [screens, options, validTimes, voice, fit]);
  const duration = timeline.duration;

  const reset = () => { setResult(null); setPicture(null); };
  const update = (patch: Partial<DemoOptions>) => { reset(); setSaved((current) => ({ ...current, options: { ...current.options, ...patch } })); };
  const setList = (next: Item[]) => { const kept = next.slice(0, MAX_SCREENS); next.slice(MAX_SCREENS).forEach((item) => URL.revokeObjectURL(item.url)); itemsRef.current = kept; setItems(kept); setStepTimes(null); reset(); };
  const change = (id: number, patch: Partial<Item>) => setList(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const previewScale = Math.min(1, 640 / Math.max(full.width, full.height));
  const previewW = Math.round(full.width * previewScale), previewH = Math.round(full.height * previewScale);
  const ready = items.length > 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview: Renderer | null = useMemo(() => (ready ? makeRenderer(screens, options, previewW, previewH, timeline) : null), [screens, options, previewW, previewH, timeline, ready, fontTick]);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    if (preview) preview.paint(ctx, Math.min(time, duration)); else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = DEMO_LOOKS[options.look].bg[0]; ctx.fillRect(0, 0, previewW, previewH); }
  }, [preview, time, duration, options.look, previewW, previewH]);

  useEffect(() => {
    if (!playing) return undefined;
    const begin = performance.now() - time * 1000;
    heard.current?.stop(); heard.current = voice ? playVoice(voice, time) : null;
    let raf = 0;
    const step = () => { const seconds = (performance.now() - begin) / 1000; if (seconds >= duration) { setPlaying(false); setTime(duration); return; } setTime(seconds); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); heard.current?.stop(); heard.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration]);

  useEffect(() => {
    if (!tapping) return undefined;
    let raf = 0;
    const step = () => {
      const first = timeline.starts[0]; const k = taps - 1;
      if (first !== undefined) {
        if (k < 0) setTime(Math.max(0, first - 0.01));
        else { const start = timeline.starts[k], endAt = timeline.ends[k]; if (start !== undefined && endAt !== undefined) setTime(start + Math.min((recorder.current?.elapsed() ?? 0) - (tapTimes.current[k] ?? 0), endAt - start - 0.001)); }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [tapping, taps, timeline]);

  const togglePlay = () => { if (playing) setPlaying(false); else { if (time >= duration - 0.05) setTime(0); setPlaying(true); } };

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setNotice(''); setAdding(true); const room = MAX_SCREENS - itemsRef.current.length; const chosen = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > room) setNotice(ui.tooMany.replace('{max}', String(MAX_SCREENS)));
    const added: Item[] = [];
    for (const file of chosen) {
      try { const read = await readScreenshot(file); added.push({ id: nextId.current++, name: file.name, pic: read.pic, url: read.url, label: '', seconds: 0, mark: { ...blank.mark }, hide: { ...blank.hide }, mode: 'mark' }); } catch { setNotice(ui.screenFailed.replace('{name}', file.name)); }
    }
    if (added.length) setList([...itemsRef.current, ...added]);
    setAdding(false);
  };
  const addSamples = async () => {
    setNotice(''); setAdding(true);
    try {
      const room = MAX_SCREENS - itemsRef.current.length; const added: Item[] = [];
      for (const sample of makeSamples().slice(0, Math.max(0, room))) { const c = sample.pic.source as HTMLCanvasElement; added.push({ id: nextId.current++, name: `${ui.sample} ${added.length + 1}`, pic: sample.pic, url: await toUrl(c), label: '', seconds: 0, mark: { ...sample.mark }, hide: { ...blank.hide }, mode: 'mark' }); }
      if (added.length) setList([...itemsRef.current, ...added]);
    } finally { setAdding(false); }
  };
  const remove = (id: number) => { const gone = items.find((item) => item.id === id); if (gone) URL.revokeObjectURL(gone.url); setList(items.filter((item) => item.id !== id)); };
  const move = (index: number, by: number) => { const to = index + by; if (to < 0 || to >= items.length) return; const next = [...items]; const [item] = next.splice(index, 1); next.splice(to, 0, item!); setList(next); };
  const place = (item: Item, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect(); const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    if (item.mode === 'mark') change(item.id, { mark: { ...item.mark, x, y, style: item.mark.style === 'none' ? 'tap' : item.mark.style } });
    else change(item.id, { hide: { ...item.hide, x, y, on: true } });
  };

  const useStarter = (id: StarterId) => {
    if (busy) return; const s = starters[id]; reset();
    setSaved((current) => ({ ...current, options: { ...current.options, device: s.device as DeviceId, look: s.look as DemoLookId, font: DEMO_LOOKS[s.look as DemoLookId].font, transition: s.transition as TransitionId, label: s.label_style as LabelId, speed: s.speed as SpeedId } }));
    setHints(s.hints);
  };
  const fillHints = () => setList(items.map((item, k) => (item.label.trim() ? item : { ...item, label: hints[k] ?? '' })));

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
      const times = [...tapTimes.current]; while (times.length < stepCount) times.push((times[times.length - 1] ?? 0.6) + 2.5);
      setVoice(recorded); setStepTimes(times); setTime(0);
    } catch { recorder.current = null; setVoiceMessage(ui.voiceReadFailed); }
  };
  const cancelTapping = () => { recorder.current?.cancel(); recorder.current = null; setTapping(false); setTime(0); };
  const addVoiceFile = async (file: File) => { setVoiceMessage(''); reset(); try { const read = await readVoiceFile(file); setVoice(read); setStepTimes(null); setTime(0); } catch { setVoiceMessage(ui.voiceReadFailed); } };
  const removeVoice = () => { setVoice(null); setStepTimes(null); setPlaying(false); reset(); };

  const needsSmooth = quality === 2160;
  const useSmooth = smooth.ok && (!voice || aac);
  const canMake = !!preview && !tapping && (needsSmooth ? smooth.ok && (!voice || aac) : useSmooth || (voice ? supportWithSound.ok : support.ok));
  const fileBase = 'app-demo';

  const renderAt = (target: HTMLCanvasElement) => { const renderer = makeRenderer(screens, options, target.width, target.height, timeline); const ctx = target.getContext('2d')!; return { renderer, paint: (seconds: number) => renderer.paint(ctx, seconds) }; };

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
        if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.mp4`, size: done.blob.size, extension: 'mp4' });
        return;
      }
      const done = await recordCanvas({ canvas: target, duration: renderer.duration, fps: 30, paint, onProgress: setProgress, signal: control.signal, music: voice ? { buffer: await paddedVoice(voice, renderer.duration), volume: 1 } : undefined });
      if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.${done.support.extension}`, size: done.blob.size, extension: done.support.extension });
    } catch { setMessage(ui.failed); }
    finally { void lock?.release().catch(() => undefined); setRecording(false); abort.current = null; }
  };

  const savePicture = () => {
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    renderAt(target).paint(time > 0 ? Math.min(time, duration) : Math.min(duration, (timeline.starts[Math.min(1, stepCount - 1)] ?? 0) + 2));
    target.toBlob((blob) => { if (blob) setPicture({ url: URL.createObjectURL(blob), name: `${fileBase}.png` }); }, 'image/png');
  };

  const startAgain = () => { itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url)); itemsRef.current = []; setItems([]); setHints([]); setSaved(DEFAULTS); reset(); setMessage(''); setNotice(''); setTime(0); setPlaying(false); removeVoice(); setVoiceMessage(''); };
  const ratio = `${full.width} / ${full.height}`;
  const busy = recording || tapping;
  const secs = (value: number) => value.toFixed(1);
  const voiceNote = !voice ? '' : validTimes ? ui.voiceTimed : stepTimes ? ui.voiceChanged : ui.voiceFitted;
  const nextScreen = screens[taps];
  const describe = (screen: Screen, k: number) => screen.label || `${ui.screen} ${k + 1}`;
  const hasEmptySentence = hints.length > 0 && items.some((item) => !item.label.trim());
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value="" onChange={(value) => useStarter(value as StarterId)} options={(Object.keys(starters) as StarterId[]).map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{ui.startersHint}</p></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.frame}</p>
          <ChoiceButtons label={ui.frame} value={options.device} onChange={(value) => update({ device: value as DeviceId })} options={names(ui.frames)} />
          <p className="mt-1 text-[11px] text-slate-500">{ui.frameHint[options.device]}</p></div>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 ${busy || adding || items.length >= MAX_SCREENS ? 'pointer-events-none opacity-40' : ''}`}><ImageIcon className="h-4 w-4" aria-hidden="true" />{ui.addScreens}
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { const files = event.target.files; void addFiles(files).finally(() => { event.target.value = ''; }); }} /></label>
          <button type="button" onClick={() => void addSamples()} disabled={busy || adding || items.length >= MAX_SCREENS} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.useSamples}</button>
          {hasEmptySentence && <button type="button" onClick={fillHints} disabled={busy} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.fillHints}</button>}
        </div>
        <p className="text-[11px] text-slate-500">{ui.screensHint.replace('{max}', String(MAX_SCREENS))}</p>
        {notice && <Note>{notice}</Note>}
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.help}</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-slate-700">{ui.helpItems.map((item) => <li key={item}>{item}</li>)}</ol>
        </details>
      </section>

      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 flex justify-center rounded-xl bg-slate-900 p-2">
          <canvas ref={canvas} width={previewW} height={previewH} style={{ aspectRatio: ratio }} className="max-h-[70vh] w-full max-w-md rounded-lg" role="img" aria-label={ui.preview} />
        </div>
        {!preview && <p className="mt-2 text-xs text-slate-600">{ui.empty}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={togglePlay} disabled={busy || !preview} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-40">
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{playing ? ui.pause : ui.play}
          </button>
          <input type="range" min={0} max={duration} step={0.05} value={Math.min(time, duration)} disabled={busy || !preview} aria-label={ui.preview} onChange={(event) => { setPlaying(false); setTime(Number(event.target.value)); }} className="w-full accent-orange-700" />
          <span className="w-12 text-right text-xs font-semibold text-slate-700">{secs(Math.min(time, duration))}s</span>
        </div>
        {preview && <p className="mt-1 text-[11px] text-slate-500">{ui.lengthNote.replace('{seconds}', secs(duration)).replace('{count}', String(stepCount))}</p>}
      </section>

      {items.length > 0 && (
        <section className={`${card} space-y-3`}>
          <h2 className={heading}>{ui.screensTitle}</h2>
          <p className="text-[11px] text-slate-500">{ui.pointerHint}</p>
          <ul className="space-y-3">
            {items.map((item, k) => (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex gap-3">
                  <button type="button" onClick={(event) => place(item, event)} disabled={tapping} aria-label={ui.pictureButton} className="relative h-36 w-20 flex-none cursor-crosshair overflow-hidden rounded-lg border border-slate-300 bg-white">
                    <img src={item.url} alt={item.name} className="h-full w-full object-fill" draggable={false} />
                    {item.hide.on && <span className="absolute rounded-sm border border-slate-600 bg-slate-500/60" style={{ left: `${item.hide.x * 100}%`, top: `${item.hide.y * 100}%`, width: item.hide.size === 'small' ? '22%' : item.hide.size === 'block' ? '42%' : '80%', height: item.hide.size === 'block' ? '18%' : item.hide.size === 'small' ? '5%' : '7%', transform: 'translate(-50%, -50%)' }} />}
                    {item.mark.style !== 'none' && <span className="absolute h-3 w-3 rounded-full border-2 border-white bg-orange-600 shadow" style={{ left: `${item.mark.x * 100}%`, top: `${item.mark.y * 100}%`, transform: 'translate(-50%, -50%)' }} />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">{ui.sentence.replace('{n}', String(k + 1))}
                      <input type="text" value={item.label} maxLength={90} disabled={tapping} placeholder={hints[k] ?? ui.sentencePlaceholder} onChange={(event) => change(item.id, { label: event.target.value })} className={inputClass} /></label>
                    <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.pointer}</p>
                      <ChoiceButtons label={ui.pointer} value={item.mode} onChange={(value) => change(item.id, { mode: value as 'mark' | 'hide' })} options={names(ui.pointers)} /></div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-slate-700">{ui.markStyle}
                    <select value={item.mark.style} disabled={tapping} onChange={(event) => change(item.id, { mark: { ...item.mark, style: event.target.value as MarkStyleId, zoom: event.target.value === 'none' ? false : item.mark.zoom } })} className={inputClass}>{names(ui.marks).map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
                  <label className="block text-xs font-semibold text-slate-700">{ui.seconds}
                    <select value={item.seconds} disabled={tapping || !!validTimes} onChange={(event) => change(item.id, { seconds: Number(event.target.value) })} className={inputClass}>{[0, 2, 3, 4, 5, 6, 8].map((value) => <option key={value} value={value}>{value === 0 ? ui.auto : `${value}s`}</option>)}</select></label>
                </div>
                <div className="mt-2 space-y-2">
                  {item.mark.style !== 'none' && <Toggle label={ui.zoom} checked={item.mark.zoom} onChange={(value) => change(item.id, { mark: { ...item.mark, zoom: value } })} />}
                  <Toggle label={ui.hide} checked={item.hide.on} onChange={(value) => change(item.id, { hide: { ...item.hide, on: value } })} />
                  {item.hide.on && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.hideSize}</p>
                    <ChoiceButtons label={ui.hideSize} value={item.hide.size} onChange={(value) => change(item.id, { hide: { ...item.hide, size: value as HideSizeId } })} options={names(ui.hideSizes)} /></div>}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => move(k, -1)} disabled={busy || k === 0} className={smallButton}>{ui.up}</button>
                  <button type="button" onClick={() => move(k, 1)} disabled={busy || k === items.length - 1} className={smallButton}>{ui.down}</button>
                  <button type="button" onClick={() => remove(item.id)} disabled={busy} className={smallButton}>{ui.remove}</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.voice}</h2>
        <p className="text-[11px] text-slate-500">{ui.voiceHint}</p>
        {tapping ? (
          <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-3" role="group" aria-label={ui.voiceTapTitle}>
            <p className="text-sm font-bold text-slate-900">{ui.voiceTapTitle}</p>
            <p className="text-xs text-slate-700" role="status">{taps === 0 ? ui.voiceReady : ui.voiceStep.replace('{done}', String(taps)).replace('{total}', String(stepCount))}</p>
            {nextScreen && taps < stepCount && <p className="rounded-lg bg-white p-2 text-xs text-slate-800">{describe(nextScreen, taps)}</p>}
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
            <button type="button" onClick={removeVoice} disabled={recording} className={smallButton}>{ui.voiceRemove}</button>
          </div>
        )}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.finish}</h2>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.more}</summary>
          <div className="mt-3 space-y-4">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.lookLabel}</p>
              <ChoiceButtons label={ui.lookLabel} value={options.look} onChange={(value) => update({ look: value as DemoLookId, font: DEMO_LOOKS[value as DemoLookId].font })} options={names(ui.looks)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.labelStyle}</p>
              <ChoiceButtons label={ui.labelStyle} value={options.label} onChange={(value) => update({ label: value as LabelId })} options={names(ui.labels)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.transition}</p>
              <ChoiceButtons label={ui.transition} value={options.transition} onChange={(value) => update({ transition: value as TransitionId })} options={names(ui.transitions).filter((t) => t.value !== 'cut')} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.font}</p>
              <ChoiceButtons label={ui.font} value={options.font} onChange={(value) => update({ font: value as FontId })} options={names(ui.fonts)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.speed}</p>
              <ChoiceButtons label={ui.speed} value={options.speed} onChange={(value) => update({ speed: value as SpeedId })} options={names(ui.speeds)} /></div>
            <div><Toggle label={ui.scroll} checked={options.scroll} onChange={(value) => update({ scroll: value })} /><p className="mt-1 text-[11px] text-slate-500">{ui.scrollHint}</p></div>
          </div>
        </details>
        <ChoiceButtons label={ui.shape} value={shape} onChange={(value) => { setSaved({ ...saved, shape: value as Shape }); reset(); }} options={names(ui.shapes)} />
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
          <ChoiceButtons label={ui.quality} value={String(quality)} onChange={(value) => { setSaved({ ...saved, quality: value === '2160' ? 2160 : value === '1080' ? 1080 : 720 }); reset(); }} options={names(ui.qualities).filter((item) => item.value !== '2160' || fourK || quality === 2160)} />
          {quality === 2160 && <p className="mt-1 text-[11px] text-slate-500">{ui.fourKHint}</p>}</div>
        <p className="text-[11px] text-slate-500">{ui.tip}</p>
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
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default AppDemoMaker;
