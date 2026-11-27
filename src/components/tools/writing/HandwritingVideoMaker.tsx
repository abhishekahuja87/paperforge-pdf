import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Pause, Play, Video } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons, fieldClass } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/writing.ui.en.json';
import '../shops/posterFonts.css';
import { BACKGROUNDS, INK_COLOURS, makeRenderer, MAX_LINES, MAX_LINE_LENGTH, buildScene, type BackgroundId, type FontId, type Renderer, type SceneData, type SpeedId, type UnderlineId, type WriteOptions } from '../../../lib/writing/scene';
import { canEncodeOffline, encodeOffline } from '../../../lib/globe/encode';
import { recordCanvas, recordSupport, videoSize } from '../../../lib/globe/record';

const STORAGE_KEY = 'mdu_writing_video_v1';
type Shape = 'reel' | 'wide' | 'square' | 'portrait';
interface Saved { options: WriteOptions; shape: Shape; quality: 720 | 1080 | 2160 }

const DEFAULTS: Saved = {
  options: { lines: ['How shipping works', 'Factory in China', 'Port of Colombo', 'Mumbai port'], fontId: 'script', ink: BACKGROUNDS.whiteboard.ink, background: 'whiteboard', speed: 'normal', pen: true, bigFirst: true, underline: 'wave' },
  shape: 'reel', quality: 1080,
};
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && Array.isArray(raw.options?.lines)) return { ...DEFAULTS, ...raw, options: { ...DEFAULTS.options, ...raw.options } } as Saved;
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** Type some lines and a pen writes them by hand, ready to save as a short video clip. Drawn and recorded on your device. */
export const HandwritingVideoMaker: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { options, shape, quality } = saved;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState<SceneData | null>(null);
  const [preparing, setPreparing] = useState('');
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
  const abort = useRef<AbortController | null>(null);
  const support = useMemo(() => recordSupport(false), []);
  const full = videoSize(shape, quality);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { abort.current?.abort(); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { if (picture) URL.revokeObjectURL(picture.url); }, [picture]);
  useEffect(() => { let live = true; void canEncodeOffline(full.width, full.height, 30).then((found) => { if (live) setSmooth(found); }); return () => { live = false; }; }, [full.width, full.height]);
  useEffect(() => { let live = true; const big = videoSize(shape, 2160); void canEncodeOffline(big.width, big.height, 30).then((found) => { if (live) setFourK(found.ok); }); return () => { live = false; }; }, [shape]);

  const update = (patch: Partial<WriteOptions>) => { setResult(null); setPicture(null); setSaved((current) => ({ ...current, options: { ...current.options, ...patch } })); };
  const linesKey = options.lines.join('\n');

  // Trace the text when the words or the font change (slow part), a moment after typing stops.
  useEffect(() => {
    let live = true;
    const timer = window.setTimeout(() => {
      void buildScene(options, (done, total) => { if (live) setPreparing(ui.preparing.replace('{done}', String(done)).replace('{total}', String(total))); }).then((built) => { if (live) { setScene(built); setPreparing(''); } });
    }, 350);
    return () => { live = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, options.fontId]);

  const previewScale = Math.min(1, 640 / Math.max(full.width, full.height));
  const previewW = Math.round(full.width * previewScale), previewH = Math.round(full.height * previewScale);
  const preview: Renderer | null = useMemo(() => (scene && scene.lines.length ? makeRenderer(scene, options, previewW, previewH) : null), [scene, options, previewW, previewH]);
  const duration = preview?.duration ?? 2;

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    if (preview) preview.paint(ctx, Math.min(time, duration)); else { ctx.fillStyle = BACKGROUNDS[options.background].fill; ctx.fillRect(0, 0, previewW, previewH); }
  }, [preview, time, duration, options.background, previewW, previewH]);

  useEffect(() => {
    if (!playing) return undefined;
    const begin = performance.now() - time * 1000;
    let raf = 0;
    const step = () => {
      const seconds = (performance.now() - begin) / 1000;
      if (seconds >= duration) { setPlaying(false); setTime(duration); return; }
      setTime(seconds);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration]);

  const togglePlay = () => { if (playing) setPlaying(false); else { if (time >= duration - 0.05) setTime(0); setPlaying(true); } };
  const needsSmooth = quality === 2160;
  const canMake = !!preview && (needsSmooth ? smooth.ok : support.ok || smooth.ok);
  const useSmooth = smooth.ok;
  const fileBase = (options.lines[0] ?? 'handwriting').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'handwriting';

  const renderAt = (target: HTMLCanvasElement) => {
    const renderer = makeRenderer(scene!, options, target.width, target.height);
    const ctx = target.getContext('2d')!;
    return { renderer, paint: (seconds: number) => renderer.paint(ctx, seconds) };
  };

  const makeVideo = async () => {
    if (!scene) return;
    setPlaying(false); setMessage(''); setResult(null); setProgress(0); setStarted(performance.now()); setWasSmooth(useSmooth); setRecording(true);
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    const control = new AbortController(); abort.current = control;
    let lock: { release: () => Promise<void> } | null = null;
    try { lock = await (navigator as unknown as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed: carry on */ }
    try {
      const { renderer, paint } = renderAt(target);
      if (useSmooth) {
        const done = await encodeOffline({ canvas: target, codec: smooth.codec, duration: renderer.duration, fps: 30, paint, onProgress: setProgress, signal: control.signal });
        if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.mp4`, size: done.blob.size, extension: 'mp4' });
        return;
      }
      const done = await recordCanvas({ canvas: target, duration: renderer.duration, fps: 30, paint, onProgress: setProgress, signal: control.signal });
      if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.${done.support.extension}`, size: done.blob.size, extension: done.support.extension });
    } catch { setMessage(ui.failed); }
    finally { void lock?.release().catch(() => undefined); setRecording(false); abort.current = null; }
  };

  const savePicture = () => {
    if (!scene) return;
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    renderAt(target).renderer.paint(target.getContext('2d')!, duration);
    target.toBlob((blob) => { if (blob) setPicture({ url: URL.createObjectURL(blob), name: `${fileBase}.png` }); }, 'image/png');
  };

  const reset = () => { setSaved(DEFAULTS); setResult(null); setPicture(null); setMessage(''); setTime(0); };
  const ratio = `${full.width} / ${full.height}`;
  const textValue = options.lines.join('\n');

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 flex justify-center rounded-xl bg-slate-900 p-2">
          <canvas ref={canvas} width={previewW} height={previewH} style={{ aspectRatio: ratio }} className="max-h-[70vh] w-full max-w-md rounded-lg" role="img" aria-label={options.lines[0] ?? ui.empty} />
        </div>
        {preparing && <p className="mt-2 text-xs text-slate-600" role="status">{preparing}</p>}
        {!preview && !preparing && <p className="mt-2 text-xs text-slate-600">{ui.empty}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={togglePlay} disabled={recording || !preview} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-40">
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{playing ? ui.pause : ui.play}
          </button>
          <input type="range" min={0} max={duration} step={0.05} value={Math.min(time, duration)} disabled={recording || !preview} aria-label={ui.preview} onChange={(event) => { setPlaying(false); setTime(Number(event.target.value)); }} className="w-full accent-orange-700" />
          <span className="w-12 text-right text-xs font-semibold text-slate-700">{Math.min(time, duration).toFixed(1)}s</span>
        </div>
        {preview && <p className="mt-1 text-[11px] text-slate-500">{ui.lengthNote.replace('{seconds}', duration.toFixed(1))}</p>}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.text}</h2>
        <label className="block text-xs font-semibold text-slate-700">{ui.text}
          <textarea value={textValue} rows={5} placeholder={ui.textPlaceholder} onChange={(event) => { const lines = event.target.value.split('\n').slice(0, MAX_LINES).map((line) => line.slice(0, MAX_LINE_LENGTH)); update({ lines }); }} className={`${fieldClass} font-normal`} />
        </label>
        <p className="text-[11px] text-slate-500">{ui.textHint}</p>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.look}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.font}</p>
          <ChoiceButtons label={ui.font} value={options.fontId} onChange={(value) => update({ fontId: value as FontId })} options={names(ui.fonts)} /></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.background}</p>
          <ChoiceButtons label={ui.background} value={options.background} onChange={(value) => update({ background: value as BackgroundId, ink: BACKGROUNDS[value as BackgroundId].ink })} options={names(ui.backgrounds)} />
          <p className="mt-1 text-[11px] text-slate-500">{ui.backgroundHint}</p></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.ink}</p>
          <div role="group" aria-label={ui.ink} className="flex flex-wrap gap-2">
            {INK_COLOURS.map((colour) => <button key={colour} type="button" aria-label={colour} aria-pressed={options.ink === colour} onClick={() => update({ ink: colour })} className={`h-10 w-10 rounded-full border-2 ${options.ink === colour ? 'border-orange-600 ring-2 ring-orange-200' : 'border-slate-300'}`} style={{ background: colour }} />)}
          </div></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.speed}</p>
          <ChoiceButtons label={ui.speed} value={options.speed} onChange={(value) => update({ speed: value as SpeedId })} options={names(ui.speeds)} /></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.underline}</p>
          <ChoiceButtons label={ui.underline} value={options.underline} onChange={(value) => update({ underline: value as UnderlineId })} options={names(ui.underlines)} /></div>
        <Toggle label={ui.pen} checked={options.pen} onChange={(value) => update({ pen: value })} />
        <Toggle label={ui.bigFirst} checked={options.bigFirst} onChange={(value) => update({ bigFirst: value })} />
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.shape}</h2>
        <ChoiceButtons label={ui.shape} value={shape} onChange={(value) => { setSaved({ ...saved, shape: value as Shape }); setResult(null); setPicture(null); }} options={names(ui.shapes)} />
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
          <ChoiceButtons label={ui.quality} value={String(quality)} onChange={(value) => { setSaved({ ...saved, quality: value === '2160' ? 2160 : value === '1080' ? 1080 : 720 }); setResult(null); setPicture(null); }} options={names(ui.qualities).filter((item) => item.value !== '2160' || fourK || quality === 2160)} />
          {quality === 2160 && <p className="mt-1 text-[11px] text-slate-500">{ui.fourKHint}</p>}</div>
        <p className="text-[11px] text-slate-500">{ui.tip}</p>
        <p className="text-[11px] text-slate-500">{ui.credit}</p>
      </section>

      <section className={`${card} space-y-3`}>
        {!canMake && preview && <Note>{ui.noRecord}</Note>}
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
          <ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={reset} disabled={recording} />
        </div>
      </section>
    </div>
  );
};

export default HandwritingVideoMaker;
