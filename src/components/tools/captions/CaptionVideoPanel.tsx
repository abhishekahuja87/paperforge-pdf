import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Pause, Play, Video } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/captions.ui.en.json';
import '../shops/posterFonts.css';
import { toSrt, toVtt, type Cue } from '../../../lib/captions/cues';
import { CAPTION_LOOKS, makeCaptionRenderer, type AnimationId, type CaptionLookId, type CaptionOptions, type Pic, type PositionId, type SizeId } from '../../../lib/captions/scene';
import type { FontId } from '../../../lib/sequence/scene';
import { paddedVoice, playVoice, renderVoice, type Voice } from '../../../lib/sequence/voice';
import { canEncodeAac, encodeAac } from '../../../lib/globe/audio';
import { canEncodeOffline, encodeOffline } from '../../../lib/globe/encode';
import { recordCanvas, recordSupport, videoSize } from '../../../lib/globe/record';

type Shape = 'reel' | 'wide' | 'square' | 'portrait';
interface Saved { options: CaptionOptions; shape: Shape; quality: 720 | 1080 | 2160 }
const DEFAULTS: Saved = { options: { look: 'night', font: 'clean', position: 'middle', size: 'medium', animation: 'fade', highlight: false, boxed: false }, shape: 'reel', quality: 1080 };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));

function load(key: string): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? 'null') as Partial<Saved> | null;
    if (raw && raw.options) return { ...DEFAULTS, ...raw, options: { ...DEFAULTS.options, ...raw.options } } as Saved;
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

async function readBackground(file: File): Promise<{ pic: Pic }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  return { pic: { source: canvas, width: canvas.width, height: canvas.height } };
}

interface Props {
  /** Where the look and shape are remembered on this device. */
  storageKey: string;
  cues: Cue[];
  /** The sound to put in the video, if there is any. */
  voice: Voice | null;
  /** Length of the video in seconds. */
  duration: number;
  fileBase: string;
  /** Called when a video, picture or file has been made stale by a change, so the page can hide an old result. */
  disabled?: boolean;
  /** When the id changes, these look options are applied, for the quick starters of the page that uses this panel. */
  preset?: { id: number; options: Partial<CaptionOptions> };
}

/** Preview, look, subtitle files and the video itself for a list of captions. Shared by the tools that make captions. Drawn and recorded on your device. */
export const CaptionVideoPanel: React.FC<Props> = ({ storageKey, cues, voice, duration, fileBase, disabled, preset }) => {
  const [saved, setSaved] = useState<Saved>(() => load(storageKey));
  const { options, shape, quality } = saved;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [fontTick, setFontTick] = useState(0);
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
  const [background, setBackground] = useState<Pic | null>(null);
  const [backgroundNote, setBackgroundNote] = useState('');
  const heard = useRef<{ stop: () => void } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const support = useMemo(() => recordSupport(false), []);
  const supportWithSound = useMemo(() => recordSupport(true), []);
  const full = videoSize(shape, quality);

  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved, storageKey]);
  useEffect(() => () => { abort.current?.abort(); heard.current?.stop(); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { if (picture) URL.revokeObjectURL(picture.url); }, [picture]);
  useEffect(() => { let live = true; void canEncodeOffline(full.width, full.height, 30).then((found) => { if (live) setSmooth(found); }); return () => { live = false; }; }, [full.width, full.height]);
  useEffect(() => { let live = true; const big = videoSize(shape, 2160); void canEncodeOffline(big.width, big.height, 30).then((found) => { if (live) setFourK(found.ok); }); return () => { live = false; }; }, [shape]);
  useEffect(() => { let live = true; void canEncodeAac().then((ok) => { if (live) setAac(ok); }); return () => { live = false; }; }, []);
  useEffect(() => { let live = true; void Promise.all(['700 30px Poppins', '700 30px Fredoka'].map((font) => document.fonts.load(font, 'AaBb'))).catch(() => undefined).then(() => { if (live) setFontTick((tick) => tick + 1); }); return () => { live = false; }; }, []);

  const reset = () => { setResult(null); setPicture(null); };
  useEffect(() => { reset(); }, [cues, voice]);
  useEffect(() => { if (preset && preset.id > 0) setSaved((current) => ({ ...current, options: { ...current.options, ...preset.options } })); }, [preset?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const update = (patch: Partial<CaptionOptions>) => { reset(); setSaved((current) => ({ ...current, options: { ...current.options, ...patch } })); };
  const total = Math.max(duration, 1);
  const previewScale = Math.min(1, 640 / Math.max(full.width, full.height));
  const previewW = Math.round(full.width * previewScale), previewH = Math.round(full.height * previewScale);
  const ready = cues.length > 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview = useMemo(() => (ready ? makeCaptionRenderer(cues, options, previewW, previewH, total, background) : null), [cues, options, previewW, previewH, total, background, ready, fontTick]);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    if (preview) preview.paint(ctx, Math.min(time, total)); else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = CAPTION_LOOKS[options.look].bg[0]; ctx.fillRect(0, 0, previewW, previewH); }
  }, [preview, time, total, options.look, previewW, previewH]);

  useEffect(() => {
    if (!playing) return undefined;
    const begin = performance.now() - time * 1000;
    heard.current?.stop(); heard.current = voice ? playVoice(voice, time) : null;
    let raf = 0;
    const step = () => { const seconds = (performance.now() - begin) / 1000; if (seconds >= total) { setPlaying(false); setTime(total); return; } setTime(seconds); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); heard.current?.stop(); heard.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, total]);

  const togglePlay = () => { if (playing) setPlaying(false); else { if (time >= total - 0.05) setTime(0); setPlaying(true); } };
  const needsSmooth = quality === 2160;
  const useSmooth = smooth.ok && (!voice || aac);
  const canMake = !!preview && !disabled && (needsSmooth ? smooth.ok && (!voice || aac) : useSmooth || (voice ? supportWithSound.ok : support.ok));

  const makeVideo = async () => {
    setPlaying(false); setMessage(''); setResult(null); setProgress(0); setStarted(performance.now()); setWasSmooth(useSmooth); setRecording(true);
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    const control = new AbortController(); abort.current = control;
    let lock: { release: () => Promise<void> } | null = null;
    try { lock = await (navigator as unknown as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed: carry on */ }
    try {
      const renderer = makeCaptionRenderer(cues, options, target.width, target.height, total, background); const ctx = target.getContext('2d')!; const paint = (seconds: number) => renderer.paint(ctx, seconds);
      if (useSmooth) {
        const sound = voice ? await encodeAac(await renderVoice(voice, total)) : undefined;
        const done = await encodeOffline({ canvas: target, codec: smooth.codec, duration: total, fps: 30, paint, onProgress: setProgress, signal: control.signal, audio: sound });
        if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.mp4`, size: done.blob.size, extension: 'mp4' });
        return;
      }
      const done = await recordCanvas({ canvas: target, duration: total, fps: 30, paint, onProgress: setProgress, signal: control.signal, music: voice ? { buffer: await paddedVoice(voice, total), volume: 1 } : undefined });
      if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.${done.support.extension}`, size: done.blob.size, extension: done.support.extension });
    } catch { setMessage(ui.failed); }
    finally { void lock?.release().catch(() => undefined); setRecording(false); abort.current = null; }
  };

  const savePicture = () => {
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    const renderer = makeCaptionRenderer(cues, options, target.width, target.height, total, background);
    renderer.paint(target.getContext('2d')!, time > 0 ? Math.min(time, total) : (cues[0]?.start ?? 0) + 0.5);
    target.toBlob((blob) => { if (blob) setPicture({ url: URL.createObjectURL(blob), name: `${fileBase}.png` }); }, 'image/png');
  };

  const files = useMemo(() => {
    if (cues.length === 0) return null;
    return { srt: URL.createObjectURL(new Blob([toSrt(cues)], { type: 'application/x-subrip' })), vtt: URL.createObjectURL(new Blob([toVtt(cues)], { type: 'text/vtt' })) };
  }, [cues]);
  useEffect(() => () => { if (files) { URL.revokeObjectURL(files.srt); URL.revokeObjectURL(files.vtt); } }, [files]);

  const addBackground = async (file: File) => { setBackgroundNote(''); try { const read = await readBackground(file); setBackground(read.pic); reset(); } catch { setBackgroundNote(ui.backgroundFailed); } };
  const ratio = `${full.width} / ${full.height}`;
  const secs = (value: number) => value.toFixed(1);
  return (
    <div className="space-y-4">
      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 flex justify-center rounded-xl bg-slate-900 p-2">
          <canvas ref={canvas} width={previewW} height={previewH} style={{ aspectRatio: ratio }} className="max-h-[70vh] w-full max-w-md rounded-lg" role="img" aria-label={ui.preview} />
        </div>
        {!preview && <p className="mt-2 text-xs text-slate-600">{ui.empty}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={togglePlay} disabled={recording || !preview || disabled} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-40">
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{playing ? ui.pause : ui.play}
          </button>
          <input type="range" min={0} max={total} step={0.05} value={Math.min(time, total)} disabled={recording || !preview || disabled} aria-label={ui.preview} onChange={(event) => { setPlaying(false); setTime(Number(event.target.value)); }} className="w-full accent-orange-700" />
          <span className="w-12 text-right text-xs font-semibold text-slate-700">{secs(Math.min(time, total))}s</span>
        </div>
        {preview && <p className="mt-1 text-[11px] text-slate-500">{ui.lengthNote.replace('{seconds}', secs(total)).replace('{count}', String(cues.length))}</p>}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.subtitles}</h2>
        <p className="text-[11px] text-slate-500">{ui.subtitlesHint}</p>
        {files ? (
          <div className="space-y-2">
            <SaveResult href={files.srt} name={`${fileBase}.srt`} label={ui.srtReady} saveLabel={ui.saveSrt} />
            <SaveResult href={files.vtt} name={`${fileBase}.vtt`} label={ui.vttReady} saveLabel={ui.saveVtt} />
          </div>
        ) : <p className="text-xs text-slate-600">{ui.empty}</p>}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.videoTitle}</h2>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.more}</summary>
          <div className="mt-3 space-y-4">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.look}</p>
              <ChoiceButtons label={ui.look} value={options.look} onChange={(value) => update({ look: value as CaptionLookId, font: CAPTION_LOOKS[value as CaptionLookId].font })} options={names(ui.looks)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.position}</p>
              <ChoiceButtons label={ui.position} value={options.position} onChange={(value) => update({ position: value as PositionId })} options={names(ui.positions)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.size}</p>
              <ChoiceButtons label={ui.size} value={options.size} onChange={(value) => update({ size: value as SizeId })} options={names(ui.sizes)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.font}</p>
              <ChoiceButtons label={ui.font} value={options.font} onChange={(value) => update({ font: value as FontId })} options={names(ui.fonts)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.animation}</p>
              <ChoiceButtons label={ui.animation} value={options.animation} onChange={(value) => update({ animation: value as AnimationId })} options={names(ui.animations)} /></div>
            <Toggle label={ui.highlight} checked={options.highlight} onChange={(value) => update({ highlight: value })} />
            <Toggle label={ui.boxed} checked={options.boxed} onChange={(value) => update({ boxed: value })} />
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.background}</p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.backgroundAdd}
                  <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addBackground(file); }} /></label>
                {background && <button type="button" onClick={() => { setBackground(null); reset(); }} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.backgroundRemove}</button>}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{ui.backgroundHint}</p>
              {backgroundNote && <Note>{backgroundNote}</Note>}</div>
          </div>
        </details>
        <ChoiceButtons label={ui.shape} value={shape} onChange={(value) => { setSaved({ ...saved, shape: value as Shape }); reset(); }} options={names(ui.shapes)} />
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
          <ChoiceButtons label={ui.quality} value={String(quality)} onChange={(value) => { setSaved({ ...saved, quality: value === '2160' ? 2160 : value === '1080' ? 1080 : 720 }); reset(); }} options={names(ui.qualities).filter((item) => item.value !== '2160' || fourK || quality === 2160)} />
          {quality === 2160 && <p className="mt-1 text-[11px] text-slate-500">{ui.fourKHint}</p>}</div>
        <p className="text-[11px] text-slate-500">{ui.tip}</p>
        {!canMake && preview && !disabled && <Note>{ui.noRecord}</Note>}
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
        </div>
      </section>
    </div>
  );
};

export default CaptionVideoPanel;
