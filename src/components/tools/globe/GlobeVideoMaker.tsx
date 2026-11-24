import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Image as ImageIcon, Pause, Play, Plus, Trash2, Video } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { formatBytes } from '../../../lib/browserTools';
import { SaveResult } from '../../common/SaveResult';
import rawWorld from '../../../data/globe/world.json';
import rawPlaces from '../../../data/globe/places.json';
import ui from '../../../locales/packs/globe.ui.en.json';
import { decodeWorld, type RawWorld, type RawPlaces } from '../../../lib/globe/world';
import { buildPlaces, parseCoordinates, searchPlaces, stopFromCoordinates, stopFromPlace, type PlaceEntry } from '../../../lib/globe/places';
import { GLOBE_STYLES, styleById } from '../../../lib/globe/styles';
import { buildTimeline } from '../../../lib/globe/timeline';
import { renderGlobe } from '../../../lib/globe/draw';
import { recordCanvas, recordSupport, videoSize } from '../../../lib/globe/record';
import type { GlobeOptions, ShapeId, Stop } from '../../../lib/globe/types';

const STORAGE_KEY = 'mdu_globe_video_v1';
const MAX_STOPS = 5;

interface Saved { stops: Stop[]; options: GlobeOptions; shape: ShapeId; quality: 720 | 1080 }

const DEFAULT_OPTIONS: GlobeOptions = { styleId: 'earth', motion: 'fly', line: 'glow', arc: 'lifted', mover: 'plane', pin: 'pin', highlight: true, labels: true, caption: '', seconds: 10 };

const world = decodeWorld(rawWorld as unknown as RawWorld);
const places = buildPlaces(world, rawPlaces as unknown as RawPlaces);
const find = (name: string) => stopFromPlace(searchPlaces(places, name, 1)[0]!);
const defaultSaved = (): Saved => ({ stops: [find('India'), find('United States')], options: { ...DEFAULT_OPTIONS }, shape: 'reel', quality: 720 });

const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));

function load(): Saved {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Saved | null;
    if (parsed && Array.isArray(parsed.stops) && parsed.stops.length >= 2 && parsed.stops.length <= MAX_STOPS && parsed.options) {
      return { ...defaultSaved(), ...parsed, options: { ...DEFAULT_OPTIONS, ...parsed.options } };
    }
  } catch { /* storage blocked or damaged: use the defaults */ }
  return defaultSaved();
}

/** One place picker: search box with suggestions, plus the name shown on the video. */
const StopEditor: React.FC<{ title: string; stop: Stop; onChange: (stop: Stop) => void; onRemove?: () => void }> = ({ title, stop, onChange, onRemove }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => (query.trim() ? searchPlaces(places, query, 6) : []), [query]);
  const coords = useMemo(() => parseCoordinates(query), [query]);
  const choose = (entry: PlaceEntry) => { onChange(stopFromPlace(entry)); setQuery(''); setOpen(false); };
  const chooseCoords = () => { if (coords) { onChange(stopFromCoordinates(coords.lat, coords.lon)); setQuery(''); setOpen(false); } };
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-900">{title}: <span className="font-semibold text-slate-700">{stop.label}</span></p>
        {onRemove && <button type="button" onClick={onRemove} aria-label={ui.removeStop} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>}
      </div>
      <label className="mt-2 block text-xs font-semibold text-slate-700">{ui.search}
        <input value={query} placeholder={ui.searchPlaceholder} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); if (coords) chooseCoords(); else if (matches[0]) choose(matches[0]); } }}
          className={fieldClass} autoComplete="off" />
      </label>
      {open && query.trim() && (
        <ul className="mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
          {coords && <li><button type="button" onClick={chooseCoords} className="block min-h-11 w-full px-3 py-2 text-left hover:bg-orange-50">{coords.lat.toFixed(2)}, {coords.lon.toFixed(2)}</button></li>}
          {matches.map((entry) => (
            <li key={`${entry.name}-${entry.lat}-${entry.lon}`}><button type="button" onClick={() => choose(entry)} className="block min-h-11 w-full px-3 py-2 text-left hover:bg-orange-50"><span className="font-semibold text-slate-900">{entry.name}</span>{entry.sub && <span className="text-slate-500">, {entry.sub}</span>}{entry.kind === 'country' && <span className="ml-2 text-[11px] text-slate-500">country</span>}</button></li>
          ))}
          {!coords && matches.length === 0 && <li className="px-3 py-2 text-xs text-slate-600">{ui.noMatch}</li>}
        </ul>
      )}
      <label className="mt-2 block text-xs font-semibold text-slate-700">{ui.labelOnVideo}
        <input value={stop.label} maxLength={40} onChange={(event) => onChange({ ...stop, label: event.target.value })} className={fieldClass} />
      </label>
    </div>
  );
};

/** Small picture of one look, drawn once when the page opens. */
const StyleThumb: React.FC<{ id: string; chosen: boolean; onPick: () => void }> = ({ id, chosen, onPick }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    renderGlobe(ctx, { width: 96, height: 96, frame: { lon: 20, lat: 20, zoom: 1.05, routes: [], pins: [], glow: [], head: null, caption: 0, time: 0 }, stops: [], world, style: styleById(id), options: { line: 'solid', arc: 'lifted', mover: 'none', pin: 'pin', highlight: false, labels: false, caption: '' }, overlay: false });
  }, [id]);
  return (
    <button type="button" aria-pressed={chosen} onClick={onPick} className={`rounded-xl border p-1.5 text-center ${chosen ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
      <canvas ref={ref} width={96} height={96} className="mx-auto h-16 w-16 rounded-lg" aria-hidden="true" />
      <span className="mt-1 block text-[11px] font-semibold text-slate-800">{(ui.styles as Record<string, string>)[id]}</span>
    </button>
  );
};

/** Make a video of a globe that flies from one place to another. Drawn and recorded on your device. */
export const GlobeVideoMaker: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { stops, options, shape, quality } = saved;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; size: number; slow: number; extension: string } | null>(null);
  const [picture, setPicture] = useState<{ url: string; name: string } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const support = useMemo(() => recordSupport(), []);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { abort.current?.abort(); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { if (picture) URL.revokeObjectURL(picture.url); }, [picture]);

  const update = (patch: Partial<GlobeOptions>) => { setPicture(null); setSaved((current) => ({ ...current, options: { ...current.options, ...patch } })); setResult(null); };
  const setStops = (next: Stop[]) => { setPicture(null); setSaved((current) => ({ ...current, stops: next })); setResult(null); setTime(0); };
  const setStop = (index: number, stop: Stop) => setStops(stops.map((item, i) => (i === index ? stop : item)));

  // Each stop needs a few seconds to be shown well, so more stops means a longer minimum.
  const minSeconds = Math.max(5, 3 * (stops.length - 1) + 2);
  const seconds = Math.min(30, Math.max(options.seconds, minSeconds));
  const timeline = useMemo(() => buildTimeline(stops, { ...options, seconds }), [stops, options, seconds]);
  const same = stops.some((a, i) => stops.some((b, j) => i !== j && Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01 && Math.abs(i - j) === 1));

  // Preview size: short side 480 pixels.
  const full = videoSize(shape, quality);
  const previewScale = 480 / Math.min(full.width, full.height);
  const previewW = Math.round(full.width * previewScale), previewH = Math.round(full.height * previewScale);

  const paint = useCallback((target: HTMLCanvasElement, seconds: number) => {
    const ctx = target.getContext('2d');
    if (!ctx) return;
    renderGlobe(ctx, { width: target.width, height: target.height, frame: timeline.frameAt(seconds), stops, world, style: styleById(options.styleId), options });
  }, [timeline, stops, options]);

  useEffect(() => { if (canvas.current && !playing) paint(canvas.current, time); }, [paint, time, playing, previewW, previewH]);

  useEffect(() => {
    if (!playing || !canvas.current) return undefined;
    let raf = 0; const begin = performance.now() - time * 1000;
    const step = () => {
      const seconds = (performance.now() - begin) / 1000;
      if (seconds >= timeline.duration) { setPlaying(false); setTime(timeline.duration); return; }
      paint(canvas.current!, seconds); setTime(seconds);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, paint, timeline.duration]);

  const togglePlay = () => { if (playing) setPlaying(false); else { if (time >= timeline.duration - 0.05) setTime(0); setPlaying(true); } };

  const fileBase = `globe-${stops[0]!.label}-to-${stops[stops.length - 1]!.label}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const makeVideo = async () => {
    setPlaying(false); setMessage(''); setResult(null); setProgress(0); setRecording(true);
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    const control = new AbortController(); abort.current = control;
    let lock: { release: () => Promise<void> } | null = null;
    try { lock = await (navigator as unknown as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed: carry on */ }
    try {
      const done = await recordCanvas({ canvas: target, duration: timeline.duration, fps: 30, paint: (seconds) => paint(target, seconds), onProgress: setProgress, signal: control.signal });
      if (done) {
        const fps = done.frames / timeline.duration;
        setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.${done.support.extension}`, size: done.blob.size, extension: done.support.extension, slow: fps < 27 ? Math.round(fps) : 0 });
      }
    } catch { setMessage(ui.failed); }
    finally { void lock?.release().catch(() => undefined); setRecording(false); abort.current = null; }
  };

  const savePicture = () => {
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    paint(target, time);
    target.toBlob((blob) => { if (blob) setPicture({ url: URL.createObjectURL(blob), name: `${fileBase}.png` }); }, 'image/png');
  };

  const addStop = () => { if (stops.length < MAX_STOPS) setStops([...stops.slice(0, -1), find('Dubai'), stops[stops.length - 1]!]); };
  const swap = () => setStops([...stops].reverse());
  const reset = () => { try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage blocked */ } setSaved(defaultSaved()); setResult(null); setTime(0); setMessage(''); };
  const ratio = `${full.width} / ${full.height}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 flex justify-center rounded-xl bg-slate-900 p-2">
          <canvas ref={canvas} width={previewW} height={previewH} style={{ aspectRatio: ratio }} className="max-h-[70vh] w-full max-w-md rounded-lg" role="img" aria-label={`${stops[0]!.label} to ${stops[stops.length - 1]!.label}`} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button type="button" onClick={togglePlay} disabled={recording} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-40">
            {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}{playing ? ui.pause : ui.play}
          </button>
          <input type="range" min={0} max={timeline.duration} step={0.05} value={time} disabled={recording} aria-label={ui.preview} onChange={(event) => { setPlaying(false); setTime(Number(event.target.value)); }} className="w-full accent-orange-700" />
          <span className="w-12 text-right text-xs font-semibold text-slate-700">{time.toFixed(1)}s</span>
        </div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.places}</h2>
        <p className="text-xs text-slate-600">{ui.placesHint}</p>
        {stops.map((stop, index) => (
          <StopEditor key={index} title={index === 0 ? ui.stopA : index === stops.length - 1 ? ui.stopB : ui.stopMid} stop={stop} onChange={(next) => setStop(index, next)} onRemove={index > 0 && index < stops.length - 1 ? () => setStops(stops.filter((_, i) => i !== index)) : undefined} />
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={swap} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50"><ArrowUp className="h-4 w-4" aria-hidden="true" /><ArrowDown className="-ml-3 h-4 w-4" aria-hidden="true" />{ui.swap}</button>
          {stops.length < MAX_STOPS && <button type="button" onClick={addStop} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50"><Plus className="h-4 w-4" aria-hidden="true" />{ui.addStop}</button>}
        </div>
        {same && <Note>{ui.sameStops}</Note>}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.look}</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {GLOBE_STYLES.map((style) => <StyleThumb key={style.id} id={style.id} chosen={options.styleId === style.id} onPick={() => update({ styleId: style.id })} />)}
        </div>
        <div className="space-y-3">
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.motion}</p><ChoiceButtons label={ui.motion} value={options.motion} onChange={(value) => update({ motion: value as GlobeOptions['motion'] })} options={names(ui.motions)} /></div>
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.line}</p><ChoiceButtons label={ui.line} value={options.line} onChange={(value) => update({ line: value as GlobeOptions['line'] })} options={names(ui.lines)} /></div>
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.arc}</p><ChoiceButtons label={ui.arc} value={options.arc} onChange={(value) => update({ arc: value as GlobeOptions['arc'] })} options={names(ui.arcs)} /></div>
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.mover}</p><ChoiceButtons label={ui.mover} value={options.mover} onChange={(value) => update({ mover: value as GlobeOptions['mover'] })} options={names(ui.movers)} /></div>
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.pin}</p><ChoiceButtons label={ui.pin} value={options.pin} onChange={(value) => update({ pin: value as GlobeOptions['pin'] })} options={names(ui.pins)} /></div>
          <Toggle label={ui.highlight} hint={ui.highlightHint} checked={options.highlight} onChange={(value) => update({ highlight: value })} />
          <Toggle label={ui.labels} checked={options.labels} onChange={(value) => update({ labels: value })} />
          <label className="block text-xs font-semibold text-slate-700">{ui.caption}
            <input value={options.caption} maxLength={60} placeholder={ui.captionPlaceholder} onChange={(event) => update({ caption: event.target.value })} className={fieldClass} />
          </label>
        </div>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.shape}</h2>
        <ChoiceButtons label={ui.shape} value={shape} onChange={(value) => { setSaved({ ...saved, shape: value as ShapeId }); setResult(null); setPicture(null); }} options={names(ui.shapes)} />
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
          <ChoiceButtons label={ui.quality} value={String(quality)} onChange={(value) => { setSaved({ ...saved, quality: value === '1080' ? 1080 : 720 }); setResult(null); setPicture(null); }} options={names(ui.qualities)} /></div>
        <label className="block text-xs font-semibold text-slate-700"><span className="flex justify-between"><span>{ui.seconds}</span><span className="font-bold text-slate-900">{seconds} s</span></span>
          <input type="range" min={minSeconds} max={30} step={1} value={seconds} onChange={(event) => update({ seconds: Number(event.target.value) })} className="mt-1 w-full accent-orange-700" />
        </label>
        <p className="text-[11px] text-slate-500">{ui.fps}</p>
      </section>

      <section className={`${card} space-y-3`}>
        {!support.ok && <Note>{ui.noRecord}</Note>}
        {recording && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round(progress * 100)}%` }} /></div><p className="text-xs text-slate-700">{ui.keepOpen}</p></>}
        {recording
          ? <button type="button" onClick={() => abort.current?.abort()} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.cancel}</button>
          : <MainActionButton onClick={() => void makeVideo()} disabled={!support.ok || same}><Video className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
        {message && <Note>{message}</Note>}
        {result && (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-3">
            <video src={result.url} controls playsInline className="mx-auto max-h-[70vh] w-full max-w-md rounded-lg bg-black" style={{ aspectRatio: ratio }} />
            <p className="text-xs text-slate-700">{result.extension === 'mp4' ? ui.mp4Note : ui.webmNote}</p>
            {result.slow > 0 && <Note>{ui.slowNote.replace('{fps}', String(result.slow))}</Note>}
            <SaveResult href={result.url} name={result.name} label={ui.ready} saveLabel={ui.saveVideo} detail={formatBytes(result.size)} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={savePicture} disabled={recording} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40"><ImageIcon className="h-4 w-4" aria-hidden="true" />{ui.makePicture}</button>
          {picture && <div className="w-full"><SaveResult href={picture.url} name={picture.name} label={ui.pictureReady} saveLabel={ui.savePicture} /></div>}
          <ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={reset} disabled={recording} />
        </div>
      </section>
    </div>
  );
};

export default GlobeVideoMaker;
