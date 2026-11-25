import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Music, Pause, Play, Video } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import ui from '../../../locales/packs/beforeafter.ui.en.json';
import starters from '../../../locales/packs/beforeafter.examples.en.json';
import '../shops/posterFonts.css';
import { makeRenderer, samplePics, totalSeconds, type AccentId, type BeforeAfterOptions, type FitId, type LengthId, type Pic, type RevealId } from '../../../lib/beforeafter/scene';
import { canEncodeAac, encodeAac, readMusic, renderMusic, type Music as MusicTrack } from '../../../lib/globe/audio';
import { canEncodeOffline, encodeOffline } from '../../../lib/globe/encode';
import { recordCanvas, recordSupport, videoSize } from '../../../lib/globe/record';

const STORAGE_KEY = 'mdu_before_after_v1';
type ShapeId = 'reel' | 'square' | 'portrait' | 'wide';
interface Saved extends BeforeAfterOptions { shape: ShapeId; quality: 720 | 1080 }
type StarterId = keyof typeof starters;
const STARTER_IDS = Object.keys(starters) as StarterId[];
const DEFAULTS: Saved = { reveal: 'wipe', fit: 'fill', labels: true, title: starters.makeover.title, length: 'medium', accent: 'orange', shape: 'reel', quality: 1080 };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const inputClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';
const words = { before: ui.tagBefore, after: ui.tagAfter };

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.reveal === 'string') return { ...DEFAULTS, ...raw };
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

async function readPic(file: File): Promise<Pic> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  return { source: canvas, width: canvas.width, height: canvas.height };
}

/** Add a before photo and an after photo and save a short video that reveals the change, with a title and tags. Made on your device. */
export const BeforeAfterMaker: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { shape, quality, ...options } = saved;
  const [before, setBefore] = useState<Pic | null>(null);
  const [after, setAfter] = useState<Pic | null>(null);
  const [music, setMusic] = useState<MusicTrack | null>(null);
  const [photoMessage, setPhotoMessage] = useState('');
  const [musicMessage, setMusicMessage] = useState('');
  const [fontTick, setFontTick] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [making, setMaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [smooth, setSmooth] = useState<{ ok: boolean; codec: string }>({ ok: false, codec: '' });
  const [aac, setAac] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const abort = useRef<AbortController | null>(null);
  const output = useResultFile();
  const full = videoSize(shape, quality);
  const duration = totalSeconds(options.length);
  const support = useMemo(() => recordSupport(!!music), [music]);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => { let live = true; void canEncodeOffline(full.width, full.height, 30).then((found) => { if (live) setSmooth(found); }); return () => { live = false; }; }, [full.width, full.height]);
  useEffect(() => { let live = true; void canEncodeAac().then((ok) => { if (live) setAac(ok); }); return () => { live = false; }; }, []);
  useEffect(() => { let live = true; void Promise.all(['700 30px Poppins'].map((font) => document.fonts.load(font, 'AaBb'))).catch(() => undefined).then(() => { if (live) setFontTick((tick) => tick + 1); }); return () => { live = false; }; }, []);

  const previewScale = Math.min(1, 540 / Math.max(full.width, full.height));
  const previewW = Math.round(full.width * previewScale), previewH = Math.round(full.height * previewScale);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderer = useMemo(() => (before && after ? makeRenderer(before, after, options, words, previewW, previewH) : null), [before, after, options.reveal, options.fit, options.labels, options.title, options.length, options.accent, previewW, previewH, fontTick]);

  useEffect(() => {
    const element = canvas.current, ctx = element?.getContext('2d'); if (!element || !ctx) return;
    element.width = previewW; element.height = previewH;
    if (renderer) renderer.paint(ctx, Math.min(time, duration)); else { ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, 0, previewW, previewH); }
  }, [renderer, time, duration, previewW, previewH]);

  useEffect(() => {
    if (!playing || !renderer) return undefined;
    const begin = performance.now() - (time >= duration - 0.05 ? 0 : time) * 1000; let raf = 0;
    const step = () => { const seconds = (performance.now() - begin) / 1000; if (seconds >= duration) { setPlaying(false); setTime(duration); return; } setTime(seconds); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, renderer, duration]);

  const change = (patch: Partial<Saved>) => { output.clear(); setMessage(''); setSaved((current) => ({ ...current, ...patch })); };
  const addPhoto = async (side: 'before' | 'after', file: File) => {
    setPhotoMessage('');
    try { const pic = await readPic(file); if (side === 'before') setBefore(pic); else setAfter(pic); output.clear(); setTime(0); setPlaying(false); } catch { setPhotoMessage(ui.readFailed); }
  };
  const addSample = () => { const pics = samplePics(); setBefore(pics.before); setAfter(pics.after); setPhotoMessage(''); output.clear(); setTime(0); setPlaying(false); };
  const addMusic = async (file: File) => { setMusicMessage(''); try { setMusic(await readMusic(file)); output.clear(); } catch { setMusicMessage(ui.musicFailed); } };
  const useStarter = (id: StarterId) => { const s = starters[id]; change({ reveal: s.reveal as RevealId, length: s.length as LengthId, title: s.title, labels: s.labels, accent: s.accent as AccentId }); setTime(0); };
  const activeStarter = STARTER_IDS.find((id) => (['reveal', 'length', 'title', 'labels', 'accent'] as const).every((field) => starters[id][field] === saved[field])) ?? '';

  const useOffline = smooth.ok && (!music || aac);
  const canMake = !!before && !!after && (useOffline || support.ok);
  const makeVideo = async () => {
    if (!before || !after) return;
    setPlaying(false); setMessage(''); output.clear(); setProgress(0); setMaking(true);
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    const control = new AbortController(); abort.current = control;
    let lock: { release: () => Promise<void> } | null = null;
    try { lock = await (navigator as unknown as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed: carry on */ }
    try {
      const made = makeRenderer(before, after, options, words, target.width, target.height); const ctx = target.getContext('2d')!; const paint = (seconds: number) => made.paint(ctx, seconds);
      if (useOffline) {
        const sound = music ? await encodeAac(await renderMusic(music, duration, 0.8)) : undefined;
        const done = await encodeOffline({ canvas: target, codec: smooth.codec, duration, fps: 30, paint, onProgress: setProgress, signal: control.signal, audio: sound });
        if (done) output.set(done.blob, generateFileName('before-after', 'mp4'), { key: 'mp4', detail: formatBytes(done.blob.size) });
        return;
      }
      const done = await recordCanvas({ canvas: target, duration, fps: 30, paint, onProgress: setProgress, signal: control.signal, music: music ? { buffer: music.buffer, volume: 0.8 } : undefined });
      if (done) output.set(done.blob, generateFileName('before-after', done.support.extension), { key: done.support.extension, detail: formatBytes(done.blob.size) });
    } catch { setMessage(ui.failed); }
    finally { void lock?.release().catch(() => undefined); setMaking(false); abort.current = null; }
  };

  const startAgain = () => { abort.current?.abort(); setBefore(null); setAfter(null); setMusic(null); setTime(0); setPlaying(false); setMessage(''); setPhotoMessage(''); setMusicMessage(''); output.clear(); setSaved(DEFAULTS); };
  const picker = (side: 'before' | 'after', pic: Pic | null) => (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-slate-700">{side === 'before' ? ui.before : ui.after}</p>
      <label className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-100 ${making ? 'pointer-events-none opacity-40' : ''}`}>
        {pic ? <ThumbView pic={pic} /> : <ImagePlus className="h-6 w-6" aria-hidden="true" />}
        <span>{pic ? ui.replace : ui.choose}</span>
        <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addPhoto(side, file); }} />
      </label>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => useStarter(value as StarterId)} options={STARTER_IDS.map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? starters[activeStarter].hint : ui.startersHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.photos}</h2>
        <p className="text-[11px] text-slate-500">{ui.photosHint}</p>
        <div className="grid grid-cols-2 gap-3">{picker('before', before)}{picker('after', after)}</div>
        <button type="button" onClick={addSample} disabled={making} className={buttonClass}>{ui.sampleButton}</button>
        {photoMessage && <Note>{photoMessage}</Note>}
        <label className="block text-xs font-semibold text-slate-700">{ui.titleLabel}
          <input type="text" value={options.title} maxLength={50} placeholder={ui.titlePlaceholder} onChange={(event) => change({ title: event.target.value })} className={inputClass} /></label>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.reveal}</p>
          <ChoiceButtons label={ui.reveal} value={options.reveal} onChange={(value) => change({ reveal: value as RevealId })} options={names(ui.reveals)} /></div>
      </section>

      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        {!renderer && <p className="mt-2 text-xs text-slate-600">{ui.previewEmpty}</p>}
        <div className={renderer ? 'mt-3 space-y-2' : 'hidden'}>
          <div className="flex justify-center rounded-xl bg-slate-900 p-2"><canvas ref={canvas} role="img" aria-label={ui.photoCanvas} className="h-auto max-h-[70vh] w-auto max-w-full rounded" style={{ aspectRatio: `${previewW} / ${previewH}` }} /></div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { if (playing) setPlaying(false); else { if (time >= duration - 0.05) setTime(0); setPlaying(true); } }} className={buttonClass}>{playing ? <><Pause className="h-4 w-4" aria-hidden="true" />{ui.pause}</> : <><Play className="h-4 w-4" aria-hidden="true" />{ui.play}</>}</button>
            <input type="range" min={0} max={duration} step={0.05} value={Math.min(time, duration)} onChange={(event) => { setPlaying(false); setTime(Number(event.target.value)); }} className="w-full accent-orange-700" aria-label={ui.scrub} />
          </div>
        </div>
      </section>

      <section className={card}>
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
          <div className="mt-3 space-y-3">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.length}</p>
              <ChoiceButtons label={ui.length} value={options.length} onChange={(value) => change({ length: value as LengthId })} options={names(ui.lengths)} /></div>
            <Toggle label={ui.tags} checked={options.labels} onChange={(value) => change({ labels: value })} />
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.accent}</p>
              <ChoiceButtons label={ui.accent} value={options.accent} onChange={(value) => change({ accent: value as AccentId })} options={names(ui.accents)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.fit}</p>
              <ChoiceButtons label={ui.fit} value={options.fit} onChange={(value) => change({ fit: value as FitId })} options={names(ui.fits)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.shape}</p>
              <ChoiceButtons label={ui.shape} value={shape} onChange={(value) => change({ shape: value as ShapeId })} options={names(ui.shapes)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
              <ChoiceButtons label={ui.quality} value={String(quality)} onChange={(value) => change({ quality: value === '720' ? 720 : 1080 })} options={names(ui.qualities)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.music}</p>
              <p className="mb-2 text-[11px] text-slate-500">{ui.musicHint}</p>
              <div className="flex flex-wrap gap-2">
                <label className={`${buttonClass} cursor-pointer`}><Music className="h-4 w-4" aria-hidden="true" />{ui.addMusic}
                  <input type="file" accept="audio/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addMusic(file); }} /></label>
                {music && <button type="button" onClick={() => { setMusic(null); output.clear(); }} className={buttonClass}>{ui.removeMusic}</button>}
              </div>
              {music && <p className="mt-1 text-xs text-slate-800">{ui.musicAdded.replace('{name}', music.name)}</p>}
              {musicMessage && <Note>{musicMessage}</Note>}</div>
          </div>
        </details>
      </section>

      <section className={`${card} space-y-3`}>
        {!canMake && !!before && !!after && <Note>{ui.noRecord}</Note>}
        {making && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round(progress * 100)}%` }} /></div><p className="text-xs text-slate-700">{ui.making.replace('{done}', String(Math.round(progress * 100)))} {ui.keepOpen}</p></>}
        {making
          ? <button type="button" onClick={() => abort.current?.abort()} className={`${buttonClass} w-full`}>{ui.cancel}</button>
          : <MainActionButton onClick={() => void makeVideo()} disabled={!canMake}><Video className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
        {message && <Note>{message}</Note>}
        {output.result && (
          <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-3">
            <video src={output.result.url} controls playsInline className="mx-auto max-h-[70vh] w-full max-w-md rounded-lg bg-black" style={{ aspectRatio: `${full.width} / ${full.height}` }} />
            <p className="text-xs text-slate-700">{output.result.key === 'mp4' ? ui.mp4Note : ui.webmNote}</p>
            <SaveResult href={output.result.url} name={output.result.name} label={ui.ready} saveLabel={ui.saveVideo} detail={output.result.detail} />
          </div>
        )}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={making} /></div>
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

/** A small picture of a photo the person added. */
const ThumbView: React.FC<{ pic: Pic }> = ({ pic }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = ref.current, ctx = element?.getContext('2d'); if (!element || !ctx) return;
    const scale = 160 / Math.max(pic.width, pic.height); element.width = Math.max(1, Math.round(pic.width * scale)); element.height = Math.max(1, Math.round(pic.height * scale));
    ctx.drawImage(pic.source, 0, 0, element.width, element.height);
  }, [pic]);
  return <canvas ref={ref} className="max-h-24 w-auto max-w-full rounded" aria-hidden="true" />;
};

export default BeforeAfterMaker;
