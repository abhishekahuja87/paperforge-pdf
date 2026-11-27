import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Music, Pause, Play, Video } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/audioclip.ui.en.json';
import starters from '../../../locales/packs/audioclip.examples.en.json';
import '../shops/posterFonts.css';
import { CLIP_LOOKS, makeAnalyser, makeClipRenderer, type ClipLookId, type ClipOptions, type CoverShapeId, type Pic, type VisualId } from '../../../lib/audioclip/scene';
import type { FontId } from '../../../lib/sequence/scene';
import { paddedVoice, playVoice, readVoiceFile, renderVoice, type Voice } from '../../../lib/sequence/voice';
import { canEncodeAac, encodeAac } from '../../../lib/globe/audio';
import { canEncodeOffline, encodeOffline } from '../../../lib/globe/encode';
import { recordCanvas, recordSupport, videoSize } from '../../../lib/globe/record';
import { inputClass } from '../../common/styles';

const STORAGE_KEY = 'mdu_audio_clip_v1';
const MAX_CLIP = 180;
type Shape = 'reel' | 'wide' | 'square' | 'portrait';
interface Saved { title: string; subtitle: string; words: string; options: ClipOptions; shape: Shape; quality: 720 | 1080 | 2160 }
type StarterId = keyof typeof starters;

const DEFAULTS: Saved = { title: starters.podcast.title, subtitle: starters.podcast.subtitle, words: '', options: { look: 'night', font: 'clean', visual: 'bars', bars: 40, coverShape: 'rounded', progress: true, timeText: true }, shape: 'reel', quality: 1080 };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.title === 'string') return { ...DEFAULTS, ...raw, options: { ...DEFAULTS.options, ...raw.options } } as Saved;
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

async function readCover(file: File): Promise<Pic> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  return { source: canvas, width: canvas.width, height: canvas.height };
}

/** A short chord progression made in the page, so the tool can be tried without an audio file. */
async function sampleSound(): Promise<Voice> {
  const rate = 44100, seconds = 12; const offline = new OfflineAudioContext(1, rate * seconds, rate);
  const chords = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 392]];
  chords.forEach((notes, k) => notes.forEach((hz, n) => {
    const osc = offline.createOscillator(); const gain = offline.createGain(); osc.type = n === 0 ? 'triangle' : 'sine'; osc.frequency.value = hz; const at = k * 3;
    gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(0.16, at + 0.08); gain.gain.exponentialRampToValueAtTime(0.001, at + 2.9);
    for (let beat = 0; beat < 6; beat += 1) { gain.gain.setValueAtTime(0.16, at + beat * 0.5); gain.gain.exponentialRampToValueAtTime(0.04, at + beat * 0.5 + 0.45); }
    osc.connect(gain); gain.connect(offline.destination); osc.start(at); osc.stop(at + 3);
  }));
  const buffer = await offline.startRendering();
  return { buffer, name: ui.sampleName, seconds: buffer.duration };
}

/** Copies a part of an audio buffer, so the video holds only the part you chose. */
function trimBuffer(buffer: AudioBuffer, start: number, end: number): AudioBuffer {
  const from = Math.max(0, Math.floor(start * buffer.sampleRate)), to = Math.min(buffer.length, Math.floor(end * buffer.sampleRate)); const length = Math.max(1, to - from);
  const out = new AudioBuffer({ length, numberOfChannels: buffer.numberOfChannels, sampleRate: buffer.sampleRate });
  for (let c = 0; c < buffer.numberOfChannels; c += 1) out.copyToChannel(buffer.getChannelData(c).slice(from, to) as Float32Array<ArrayBuffer>, c);
  return out;
}

/** Add an audio clip and save a video with moving sound bars, a cover picture, a title and optional words. Made on your device. */
export const AudioClipMaker: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { title, subtitle, words, options, shape, quality } = saved;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [fontTick, setFontTick] = useState(0);
  const [audio, setAudio] = useState<Voice | null>(null);
  const [cover, setCover] = useState<Pic | null>(null);
  const [soundMessage, setSoundMessage] = useState('');
  const [coverMessage, setCoverMessage] = useState('');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
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
  const heard = useRef<{ stop: () => void } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const support = useMemo(() => recordSupport(false), []);
  const supportWithSound = useMemo(() => recordSupport(true), []);
  const full = videoSize(shape, quality);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { abort.current?.abort(); heard.current?.stop(); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { if (picture) URL.revokeObjectURL(picture.url); }, [picture]);
  useEffect(() => { let live = true; void canEncodeOffline(full.width, full.height, 30).then((found) => { if (live) setSmooth(found); }); return () => { live = false; }; }, [full.width, full.height]);
  useEffect(() => { let live = true; const big = videoSize(shape, 2160); void canEncodeOffline(big.width, big.height, 30).then((found) => { if (live) setFourK(found.ok); }); return () => { live = false; }; }, [shape]);
  useEffect(() => { let live = true; void canEncodeAac().then((ok) => { if (live) setAac(ok); }); return () => { live = false; }; }, []);
  useEffect(() => { let live = true; void Promise.all(['700 30px Poppins', '500 30px Poppins', '700 30px Fredoka', '500 30px Fredoka'].map((font) => document.fonts.load(font, 'AaBb'))).catch(() => undefined).then(() => { if (live) setFontTick((tick) => tick + 1); }); return () => { live = false; }; }, []);

  const reset = () => { setResult(null); setPicture(null); };
  const update = (patch: Partial<ClipOptions>) => { reset(); setSaved((current) => ({ ...current, options: { ...current.options, ...patch } })); };
  const setText = (patch: Partial<Saved>) => { reset(); setSaved((current) => ({ ...current, ...patch })); };

  const start = Math.max(0, Math.min(trimStart, (audio?.seconds ?? 0) - 0.5));
  const endAt = audio ? Math.min(audio.seconds, trimEnd > start + 0.5 ? trimEnd : audio.seconds, start + MAX_CLIP) : 0;
  const duration = audio ? Math.max(1, endAt - start) : 0;
  const clip = useMemo<Voice | null>(() => (audio ? { buffer: trimBuffer(audio.buffer, start, start + duration), name: audio.name, seconds: duration } : null), [audio, start, duration]);
  const analyser = useMemo(() => (clip ? makeAnalyser(clip.buffer, 0, duration) : null), [clip, duration]);
  const lines = useMemo(() => words.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 40), [words]);
  const text = useMemo(() => ({ title, subtitle, lines }), [title, subtitle, lines]);

  const previewScale = Math.min(1, 640 / Math.max(full.width, full.height));
  const previewW = Math.round(full.width * previewScale), previewH = Math.round(full.height * previewScale);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview = useMemo(() => (analyser ? makeClipRenderer(text, options, previewW, previewH, duration, analyser, cover) : null), [analyser, text, options, previewW, previewH, duration, cover, fontTick]);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    if (preview) preview.paint(ctx, Math.min(time, duration)); else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = CLIP_LOOKS[options.look].bg[0]; ctx.fillRect(0, 0, previewW, previewH); }
  }, [preview, time, duration, options.look, previewW, previewH]);

  useEffect(() => {
    if (!playing || !clip) return undefined;
    const begin = performance.now() - time * 1000;
    heard.current?.stop(); heard.current = playVoice(clip, time);
    let raf = 0;
    const step = () => { const seconds = (performance.now() - begin) / 1000; if (seconds >= duration) { setPlaying(false); setTime(duration); return; } setTime(seconds); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); heard.current?.stop(); heard.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration, clip]);

  const togglePlay = () => { if (playing) setPlaying(false); else { if (time >= duration - 0.05) setTime(0); setPlaying(true); } };
  const takeAudio = (voice: Voice) => { setAudio(voice); setTrimStart(0); setTrimEnd(0); setTime(0); setPlaying(false); reset(); };
  const addAudio = async (file: File) => { setSoundMessage(''); try { takeAudio(await readVoiceFile(file)); } catch { setSoundMessage(ui.audioFailed); } };
  const addSample = async () => { setSoundMessage(''); try { takeAudio(await sampleSound()); } catch { setSoundMessage(ui.audioFailed); } };
  const addCover = async (file: File) => { setCoverMessage(''); try { setCover(await readCover(file)); reset(); } catch { setCoverMessage(ui.coverFailed); } };
  const applyStarter = (id: StarterId) => { const s = starters[id]; reset(); setSaved((current) => ({ ...current, title: s.title, subtitle: s.subtitle, words: s.words, options: { ...current.options, look: s.look as ClipLookId, font: CLIP_LOOKS[s.look as ClipLookId].font, visual: s.visual as VisualId, coverShape: s.shape as CoverShapeId } })); };

  const needsSmooth = quality === 2160;
  const useSmooth = smooth.ok && aac;
  const canMake = !!preview && (needsSmooth ? smooth.ok && aac : useSmooth || supportWithSound.ok || support.ok);
  const fileBase = (title || 'audio-clip').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'audio-clip';

  const makeVideo = async () => {
    if (!clip || !analyser) return;
    setPlaying(false); setMessage(''); setResult(null); setProgress(0); setStarted(performance.now()); setWasSmooth(useSmooth); setRecording(true);
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    const control = new AbortController(); abort.current = control;
    let lock: { release: () => Promise<void> } | null = null;
    try { lock = await (navigator as unknown as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed: carry on */ }
    try {
      const renderer = makeClipRenderer(text, options, target.width, target.height, duration, analyser, cover); const ctx = target.getContext('2d')!; const paint = (seconds: number) => renderer.paint(ctx, seconds);
      if (useSmooth) {
        const sound = await encodeAac(await renderVoice(clip, duration));
        const done = await encodeOffline({ canvas: target, codec: smooth.codec, duration, fps: 30, paint, onProgress: setProgress, signal: control.signal, audio: sound });
        if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.mp4`, size: done.blob.size, extension: 'mp4' });
        return;
      }
      const done = await recordCanvas({ canvas: target, duration, fps: 30, paint, onProgress: setProgress, signal: control.signal, music: { buffer: await paddedVoice(clip, duration), volume: 1 } });
      if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.${done.support.extension}`, size: done.blob.size, extension: done.support.extension });
    } catch { setMessage(ui.failed); }
    finally { void lock?.release().catch(() => undefined); setRecording(false); abort.current = null; }
  };

  const savePicture = () => {
    if (!analyser) return;
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    makeClipRenderer(text, options, target.width, target.height, duration, analyser, cover).paint(target.getContext('2d')!, time > 0 ? Math.min(time, duration) : Math.min(duration / 2, 3));
    target.toBlob((blob) => { if (blob) setPicture({ url: URL.createObjectURL(blob), name: `${fileBase}.png` }); }, 'image/png');
  };

  const startAgain = () => { setSaved(DEFAULTS); setAudio(null); setCover(null); setTrimStart(0); setTrimEnd(0); reset(); setMessage(''); setSoundMessage(''); setCoverMessage(''); setTime(0); setPlaying(false); };
  const ratio = `${full.width} / ${full.height}`;
  const secs = (value: number) => value.toFixed(1);
  const longAudio = !!audio && audio.seconds > MAX_CLIP;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={(Object.keys(starters) as StarterId[]).find((id) => starters[id].title === title) ?? ''} onChange={(value) => applyStarter(value as StarterId)} options={(Object.keys(starters) as StarterId[]).map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{ui.startersHint}</p></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">{ui.titleLabel}
            <input type="text" value={title} maxLength={80} placeholder={ui.titlePlaceholder} onChange={(event) => setText({ title: event.target.value })} className={inputClass} /></label>
          <label className="block text-xs font-semibold text-slate-700">{ui.subtitleLabel}
            <input type="text" value={subtitle} maxLength={80} placeholder={ui.subtitlePlaceholder} onChange={(event) => setText({ subtitle: event.target.value })} className={inputClass} /></label>
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.sound}</h2>
        <p className="text-[11px] text-slate-500">{ui.soundHint.replace('{max}', String(MAX_CLIP))}</p>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 ${recording ? 'pointer-events-none opacity-40' : ''}`}><Music className="h-4 w-4" aria-hidden="true" />{ui.addAudio}
            <input type="file" accept="audio/*,video/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addAudio(file); }} /></label>
          <button type="button" onClick={() => void addSample()} disabled={recording} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.useSample}</button>
          {audio && <button type="button" onClick={() => { setAudio(null); setPlaying(false); reset(); }} disabled={recording} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.removeAudio}</button>}
        </div>
        {soundMessage && <Note>{soundMessage}</Note>}
        {audio && <p className="text-xs text-slate-800">{ui.soundAdded.replace('{name}', audio.name).replace('{seconds}', secs(audio.seconds))}</p>}
        {longAudio && <Note>{ui.tooLong.replace('{max}', String(MAX_CLIP))}</Note>}
      </section>

      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 flex justify-center rounded-xl bg-slate-900 p-2">
          <canvas ref={canvas} width={previewW} height={previewH} style={{ aspectRatio: ratio }} className="max-h-[70vh] w-full max-w-md rounded-lg" role="img" aria-label={title || ui.preview} />
        </div>
        {!preview && <p className="mt-2 text-xs text-slate-600">{ui.empty}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={togglePlay} disabled={recording || !preview} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-40">
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{playing ? ui.pause : ui.play}
          </button>
          <input type="range" min={0} max={Math.max(duration, 1)} step={0.05} value={Math.min(time, Math.max(duration, 1))} disabled={recording || !preview} aria-label={ui.preview} onChange={(event) => { setPlaying(false); setTime(Number(event.target.value)); }} className="w-full accent-orange-700" />
          <span className="w-12 text-right text-xs font-semibold text-slate-700">{secs(Math.min(time, duration))}s</span>
        </div>
        {preview && <p className="mt-1 text-[11px] text-slate-500">{ui.lengthNote.replace('{seconds}', secs(duration))}</p>}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.words}</h2>
        <label className="block text-xs font-semibold text-slate-700">{ui.wordsLabel}
          <textarea value={words} rows={4} spellCheck={false} placeholder={ui.wordsPlaceholder} onChange={(event) => setText({ words: event.target.value.slice(0, 1500) })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-normal leading-6 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </label>
        <p className="text-[11px] text-slate-500">{ui.wordsHint}</p>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.finish}</h2>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.more}</summary>
          <div className="mt-3 space-y-4">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.look}</p>
              <ChoiceButtons label={ui.look} value={options.look} onChange={(value) => update({ look: value as ClipLookId, font: CLIP_LOOKS[value as ClipLookId].font })} options={names(ui.looks)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.visual}</p>
              <ChoiceButtons label={ui.visual} value={options.visual} onChange={(value) => update({ visual: value as VisualId })} options={names(ui.visuals)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.visualHint}</p></div>
            {options.visual !== 'wave' && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.barCount}</p>
              <ChoiceButtons label={ui.barCount} value={String(options.bars)} onChange={(value) => update({ bars: Number(value) as 24 | 40 | 64 })} options={names(ui.barCounts)} /></div>}
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.coverShape}</p>
              <ChoiceButtons label={ui.coverShape} value={options.coverShape} onChange={(value) => update({ coverShape: value as CoverShapeId })} options={names(ui.coverShapes)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.font}</p>
              <ChoiceButtons label={ui.font} value={options.font} onChange={(value) => update({ font: value as FontId })} options={names(ui.fonts)} /></div>
            <Toggle label={ui.progress} checked={options.progress} onChange={(value) => update({ progress: value })} />
            <Toggle label={ui.timeText} checked={options.timeText} onChange={(value) => update({ timeText: value })} />
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.cover}</p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.coverAdd}
                  <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addCover(file); }} /></label>
                {cover && <button type="button" onClick={() => { setCover(null); reset(); }} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.coverRemove}</button>}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{ui.coverHint}</p>
              {coverMessage && <Note>{coverMessage}</Note>}</div>
            {audio && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.trim}</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-slate-700">{ui.trimStart}
                  <input type="number" min={0} max={Math.max(0, audio.seconds - 1)} step={0.5} value={trimStart} onChange={(event) => { const v = Number(event.target.value); if (Number.isFinite(v)) { setTrimStart(Math.max(0, v)); reset(); } }} className={inputClass} /></label>
                <label className="block text-xs font-semibold text-slate-700">{ui.trimEnd}
                  <input type="number" min={0} max={audio.seconds} step={0.5} value={trimEnd > 0 ? trimEnd : Math.round(audio.seconds * 10) / 10} onChange={(event) => { const v = Number(event.target.value); if (Number.isFinite(v)) { setTrimEnd(Math.max(0, v)); reset(); } }} className={inputClass} /></label>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{ui.trimHint}</p></div>}
          </div>
        </details>
        <ChoiceButtons label={ui.shape} value={shape} onChange={(value) => { setSaved({ ...saved, shape: value as Shape }); reset(); }} options={names(ui.shapes)} />
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
          <ChoiceButtons label={ui.quality} value={String(quality)} onChange={(value) => { setSaved({ ...saved, quality: value === '2160' ? 2160 : value === '1080' ? 1080 : 720 }); reset(); }} options={names(ui.qualities).filter((item) => item.value !== '2160' || fourK || quality === 2160)} />
          {quality === 2160 && <p className="mt-1 text-[11px] text-slate-500">{ui.fourKHint}</p>}</div>
        <p className="text-[11px] text-slate-500">{ui.tip}</p>
      </section>

      <section className={`${card} space-y-3`}>
        {!canMake && preview && <Note>{ui.noRecord}</Note>}
        {preview && !aac && !supportWithSound.ok && <Note>{ui.noSound}</Note>}
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
          <button type="button" onClick={savePicture} disabled={recording || !preview} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40"><ImageIcon className="h-4 w-4" aria-hidden="true" />{ui.makePicture}</button>
          {picture && <div className="w-full"><SaveResult href={picture.url} name={picture.name} label={ui.pictureReady} saveLabel={ui.savePicture} /></div>}
          <ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={recording} />
        </div>
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default AudioClipMaker;
