import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Image as ImageIcon, Music as MusicIcon, Pause, Play, Plus, Trash2, Video } from 'lucide-react';
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
import { loadMorePlaces, searchMore, shardLetter } from '../../../lib/globe/morePlaces';
import { buildPlaces, normalise, parseCoordinates, searchPlaces, shortName, stopFromCoordinates, stopFromPlace, type PlaceEntry } from '../../../lib/globe/places';
import { GLOBE_STYLES, styleById } from '../../../lib/globe/styles';
import { buildPlan, maximumStops, minimumSeconds } from '../../../lib/globe/plan';
import { GLOBE_PRESETS, presetById } from '../../../lib/globe/presets';
import { renderGlobe } from '../../../lib/globe/draw';
import { recordCanvas, recordSupport, videoSize } from '../../../lib/globe/record';
import { canEncodeAac, encodeAac, readMusic, renderMusic, type Music } from '../../../lib/globe/audio';
import { canEncodeOffline, encodeOffline } from '../../../lib/globe/encode';
import type { GlobeOptions, ShapeId, Stop } from '../../../lib/globe/types';

const STORAGE_KEY = 'mdu_globe_video_v1';
const MORE_PLACES = ['Singapore', 'Dubai', 'London', 'Tokyo', 'Paris', 'Sydney', 'Brazil', 'Canada', 'Egypt', 'Kenya', 'Germany', 'Italy', 'Mexico', 'Thailand'];

interface Saved { stops: Stop[]; options: GlobeOptions; shape: ShapeId; quality: 720 | 1080; fps: 30 | 60; mode: 'smooth' | 'quick' }

const DEFAULT_OPTIONS: GlobeOptions = { layout: 'chain', styleId: 'earth', motion: 'fly', line: 'glow', arc: 'lifted', mover: 'plane', pin: 'pin', highlight: true, labels: true, caption: '', seconds: 10, legMovers: [], routeColor: '', distance: 'off', night: false, logoCorner: 'br', logoSize: 'medium' };
const ROUTE_COLOURS = ['#f97316', '#ef4444', '#ec4899', '#a855f7', '#22c55e', '#14b8a6', '#eab308', '#ffffff'];

/** A small copy of a picture for the settings screen, made once so it is not redone on every frame of the preview. */
function thumbnail(source: HTMLCanvasElement): string {
  const scale = Math.min(1, 96 / Math.max(source.width, source.height));
  const small = document.createElement('canvas');
  small.width = Math.max(1, Math.round(source.width * scale)); small.height = Math.max(1, Math.round(source.height * scale));
  small.getContext('2d')!.drawImage(source, 0, 0, small.width, small.height);
  return small.toDataURL('image/png');
}

/** Reads a picture file into a canvas no larger than `max` pixels on its longest side. */
async function readPicture(file: File, max: number): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

const world = decodeWorld(rawWorld as unknown as RawWorld);
const places = buildPlaces(world, rawPlaces as unknown as RawPlaces);
const find = (name: string) => stopFromPlace(searchPlaces(places, name, 1)[0]!);
const defaultSaved = (): Saved => ({ stops: [find('India'), find('United States')], options: { ...DEFAULT_OPTIONS }, shape: 'reel', quality: 720, fps: 30, mode: 'smooth' });
const presetSaved = (id: string): Saved => {
  const preset = presetById(id);
  if (!preset) return defaultSaved();
  return { stops: preset.stops.map(find), options: { ...DEFAULT_OPTIONS, ...preset.options }, shape: preset.shape, quality: 720, fps: 30, mode: 'smooth' };
};

const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));

function load(key: string, preset?: string): Saved {
  const start = preset ? presetSaved(preset) : defaultSaved();
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as Saved | null;
    if (parsed && Array.isArray(parsed.stops) && parsed.stops.length >= 2 && parsed.stops.length <= 12 && parsed.options) {
      return { ...start, ...parsed, options: { ...DEFAULT_OPTIONS, ...parsed.options } };
    }
  } catch { /* storage blocked or damaged: use the defaults */ }
  return start;
}

/** One place picker: search box with suggestions, plus the name shown on the video. */
const StopEditor: React.FC<{ title: string; stop: Stop; onChange: (stop: Stop) => void; onRemove?: () => void; photo: HTMLCanvasElement | null; onPhoto: (file: File | null) => void }> = ({ title, stop, onChange, onRemove, photo, onPhoto }) => {
  const [query, setQuery] = useState('');
  const photoThumb = useMemo(() => (photo ? thumbnail(photo) : ''), [photo]);
  const [open, setOpen] = useState(false);
  const [extra, setExtra] = useState<{ letter: string; list: PlaceEntry[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const letter = shardLetter(query);
  const loaded = extra?.letter === letter;
  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const main = searchPlaces(places, query, 6);
    return loaded ? [...main, ...searchMore(extra!.list, places, query, 6)].slice(0, 10) : main;
  }, [query, loaded, extra]);
  const more = async () => {
    setLoading(true); setFailed(false);
    try { setExtra({ letter, list: await loadMorePlaces(query, world) }); } catch { setFailed(true); } finally { setLoading(false); }
  };
  const countryName = stop.countryId ? world.countries.find((country) => country.id === stop.countryId)?.name : undefined;
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
          {!coords && matches.length === 0 && <li className="px-3 py-2 text-xs text-slate-600">{loaded ? ui.noMatchMore : ui.noMatch}</li>}
          {!loaded && query.trim().length >= 1 && (
            <li className="border-t border-slate-100 p-2">
              <button type="button" onClick={() => void more()} disabled={loading} className="min-h-11 w-full rounded-lg border border-orange-300 px-3 text-xs font-bold text-orange-800 hover:bg-orange-50 disabled:opacity-50">{loading ? ui.searchingMore : ui.searchMore}</button>
              {failed && <p className="mt-1 text-[11px] text-red-700">{ui.moreFailed}</p>}
            </li>
          )}
        </ul>
      )}
      {stop.kind !== 'country' && countryName && <div className="mt-2"><Toggle label={ui.highlightCountryOf.replace('{country}', shortName(countryName))} checked={!!stop.highlight} onChange={(value) => onChange({ ...stop, highlight: value })} /></div>}
      <label className="mt-2 block text-xs font-semibold text-slate-700">{ui.labelOnVideo}
        <input value={stop.label} maxLength={40} onChange={(event) => onChange({ ...stop, label: event.target.value })} className={fieldClass} />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50">
          <ImageIcon className="h-4 w-4" aria-hidden="true" />{photo ? ui.changePhoto : ui.addPhoto}
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) onPhoto(file); }} />
        </label>
        {photo && <>
          <img src={photoThumb} alt="" className="h-11 w-11 rounded-lg border border-slate-200 object-cover" />
          <button type="button" onClick={() => onPhoto(null)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">{ui.removePhoto}</button>
        </>}
      </div>
    </div>
  );
};

/** Small picture of one look, drawn once when the page opens. */
const StyleThumb: React.FC<{ id: string; chosen: boolean; onPick: () => void }> = ({ id, chosen, onPick }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    renderGlobe(ctx, { width: 96, height: 96, frame: { lon: 20, lat: 20, zoom: 1.05, routes: [], pins: [], glow: [], photos: [], heads: [], caption: 0, time: 0 }, stops: [], world, style: styleById(id), options: { line: 'solid', arc: 'lifted', mover: 'none', pin: 'pin', highlight: false, labels: false, caption: '' }, overlay: false });
  }, [id]);
  return (
    <button type="button" aria-pressed={chosen} onClick={onPick} className={`rounded-xl border p-1.5 text-center ${chosen ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
      <canvas ref={ref} width={96} height={96} className="mx-auto h-16 w-16 rounded-lg" aria-hidden="true" />
      <span className="mt-1 block text-[11px] font-semibold text-slate-800">{(ui.styles as Record<string, string>)[id]}</span>
    </button>
  );
};

/** Make a video of a globe that flies from one place to another. Drawn and recorded on your device. */
export const GlobeVideoMaker: React.FC<{ preset?: string }> = ({ preset }) => {
  const storageKey = preset ? `${STORAGE_KEY}_${preset}` : STORAGE_KEY;
  const [saved, setSaved] = useState<Saved>(() => load(storageKey, preset));
  const { stops, options, shape, quality, fps, mode } = saved;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; size: number; slow: number; extension: string } | null>(null);
  const [picture, setPicture] = useState<{ url: string; name: string } | null>(null);
  const photoStore = useRef(new Map<number, HTMLCanvasElement>());
  const nextPhoto = useRef(1);
  const [logo, setLogo] = useState<HTMLCanvasElement | null>(null);
  const logoThumb = useMemo(() => (logo ? thumbnail(logo) : ''), [logo]);
  const [music, setMusic] = useState<Music | null>(null);
  const [volume, setVolume] = useState(70);
  const [aac, setAac] = useState(false);
  const [notice, setNotice] = useState('');
  const abort = useRef<AbortController | null>(null);
  const support = useMemo(() => recordSupport(!!music), [music]);
  const [smooth, setSmooth] = useState<{ ok: boolean; codec: string }>({ ok: false, codec: '' });
  const [started, setStarted] = useState(0);
  const [wasSmooth, setWasSmooth] = useState(false);

  useEffect(() => { void canEncodeAac().then(setAac); }, []);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { abort.current?.abort(); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { if (picture) URL.revokeObjectURL(picture.url); }, [picture]);

  const update = (patch: Partial<GlobeOptions>) => { setPicture(null); setSaved((current) => ({ ...current, options: { ...current.options, ...patch } })); setResult(null); };
  const setStops = (next: Stop[]) => { setPicture(null); setSaved((current) => ({ ...current, stops: next })); setResult(null); setTime(0); };
  const setStop = (index: number, stop: Stop) => setStops(stops.map((item, i) => (i === index ? { ...stop, photoId: item.photoId } : item)));
  const photoOf = (stop: Stop) => (stop.photoId ? photoStore.current.get(stop.photoId) ?? null : null);
  const setPhoto = async (index: number, file: File | null) => {
    setNotice('');
    if (!file) { setStops(stops.map((item, i) => (i === index ? { ...item, photoId: undefined } : item))); return; }
    try {
      const picture = await readPicture(file, 900);
      const id = nextPhoto.current++; photoStore.current.set(id, picture);
      setStops(stops.map((item, i) => (i === index ? { ...item, photoId: id } : item)));
    } catch { setNotice(ui.photoFailed); }
  };
  const addLogo = async (file: File | null) => {
    setNotice(''); setResult(null); setPicture(null);
    if (!file) { setLogo(null); return; }
    try { setLogo(await readPicture(file, 500)); } catch { setNotice(ui.photoFailed); }
  };
  const addMusic = async (file: File | null) => {
    setNotice(''); setResult(null);
    if (!file) { setMusic(null); return; }
    try { setMusic(await readMusic(file)); } catch { setNotice(ui.musicFailed); }
  };
  const hops = stops.length - 1;
  const legMovers = Array.from({ length: hops }, (_, i) => options.legMovers[i] ?? 'same');
  const setLeg = (index: number, value: string) => update({ legMovers: legMovers.map((item, i) => (i === index ? (value as GlobeOptions['mover'] | 'same') : item)) });

  // Each stop needs a few seconds to be shown well, so more stops means a longer minimum.
  const layout = options.layout;
  const maxStops = maximumStops(layout);
  const minSeconds = minimumSeconds(layout, stops.length);
  const seconds = Math.min(30, Math.max(options.seconds, minSeconds));
  const photoStops = stops.map((stop) => !!photoOf(stop));
  const photoKey = photoStops.join();
  const timeline = useMemo(() => buildPlan(stops, { ...options, seconds, photoStops }), [stops, options, seconds, photoKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const near = (a: Stop, b: Stop) => Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01;
  const same = layout === 'chain' ? stops.some((a, i) => i > 0 && near(a, stops[i - 1]!)) : stops.some((a, i) => stops.some((b, j) => j > i && near(a, b)));

  // Preview size: short side 480 pixels.
  const full = videoSize(shape, quality);
  useEffect(() => { let live = true; void canEncodeOffline(full.width, full.height, fps).then((found) => { if (live) setSmooth(found); }); return () => { live = false; }; }, [full.width, full.height, fps]);
  const previewScale = 480 / Math.min(full.width, full.height);
  const previewW = Math.round(full.width * previewScale), previewH = Math.round(full.height * previewScale);

  const paint = useCallback((target: HTMLCanvasElement, seconds: number) => {
    const ctx = target.getContext('2d');
    if (!ctx) return;
    renderGlobe(ctx, { width: target.width, height: target.height, frame: timeline.frameAt(seconds), stops, world, style: styleById(options.styleId), options: { ...options, legMovers }, photos: stops.map(photoOf), logo });
  }, [timeline, stops, options, logo, photoKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const fileBase = normalise(layout === 'chain' ? `globe-${stops[0]!.label}-to-${stops[stops.length - 1]!.label}` : layout === 'fan' ? `globe-${stops[0]!.label}-to-${stops.length - 1}-places` : `globe-${stops.length}-places-visited`).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const useSmooth = mode === 'smooth' && smooth.ok && (!music || aac);
  const musicFallsBack = !!music && mode === 'smooth' && smooth.ok && !aac;
  const canMake = support.ok || smooth.ok;

  const makeVideo = async () => {
    setPlaying(false); setMessage(''); setResult(null); setProgress(0); setStarted(performance.now()); setWasSmooth(useSmooth); setRecording(true);
    const target = document.createElement('canvas'); target.width = full.width; target.height = full.height;
    const control = new AbortController(); abort.current = control;
    let lock: { release: () => Promise<void> } | null = null;
    try { lock = await (navigator as unknown as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed: carry on */ }
    try {
      if (useSmooth) {
        const sound = music ? await encodeAac(await renderMusic(music, timeline.duration, volume / 100)) : undefined;
        const done = await encodeOffline({ canvas: target, codec: smooth.codec, duration: timeline.duration, fps, paint: (seconds) => paint(target, seconds), onProgress: setProgress, signal: control.signal, audio: sound });
        if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}.mp4`, size: done.blob.size, extension: 'mp4', slow: 0 });
        return;
      }
      const done = await recordCanvas({ canvas: target, duration: timeline.duration, fps: 30, paint: (seconds) => paint(target, seconds), onProgress: setProgress, signal: control.signal, music: music ? { buffer: music.buffer, volume: volume / 100 } : undefined });
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

  const addStop = () => {
    if (stops.length >= maxStops) return;
    const unused = find(MORE_PLACES.find((name) => !stops.some((stop) => stop.label.toLowerCase() === name.toLowerCase())) ?? 'Dubai');
    setStops(layout === 'chain' ? [...stops.slice(0, -1), unused, stops[stops.length - 1]!] : [...stops, unused]);
  };
  const changeLayout = (value: GlobeOptions['layout']) => {
    const limit = maximumStops(value);
    setPicture(null); setResult(null); setTime(0);
    setSaved((current) => ({ ...current, options: { ...current.options, layout: value }, stops: current.stops.length > limit ? [...current.stops.slice(0, limit - 1), current.stops[current.stops.length - 1]!] : current.stops }));
  };
  const applyPreset = (id: string) => { const next = presetSaved(id); photoStore.current.clear(); setPicture(null); setResult(null); setTime(0); setMessage(''); setSaved((current) => ({ ...next, fps: current.fps, mode: current.mode, quality: current.quality })); };
  const titleFor = (index: number) => (layout === 'chain' ? (index === 0 ? ui.stopA : index === stops.length - 1 ? ui.stopB : ui.stopMid) : layout === 'fan' ? (index === 0 ? ui.fanFrom : `${ui.fanTo} ${index}`) : `${ui.placeN} ${index + 1}`);
  const removable = (index: number) => (layout === 'chain' ? index > 0 && index < stops.length - 1 : index > 0 && stops.length > 2);
  const swap = () => setStops([...stops].reverse());
  const reset = () => { try { localStorage.removeItem(storageKey); } catch { /* storage blocked */ } setSaved(preset ? presetSaved(preset) : defaultSaved()); setResult(null); setTime(0); setMessage(''); setNotice(''); setLogo(null); setMusic(null); photoStore.current.clear(); };
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
        {!preset && (
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.startFrom}</p>
            <div role="group" aria-label={ui.startFrom} className="flex flex-wrap gap-2">
              {GLOBE_PRESETS.map((item) => <button key={item.id} type="button" onClick={() => applyPreset(item.id)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50">{(ui.presets as Record<string, string>)[item.id]}</button>)}
            </div></div>
        )}
        <h2 className={heading}>{ui.places}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.layout}</p>
          <ChoiceButtons label={ui.layout} value={layout} onChange={(value) => changeLayout(value as GlobeOptions['layout'])} options={names(ui.layouts)} />
          <p className="mt-1 text-[11px] text-slate-500">{(ui.layoutHints as Record<string, string>)[layout]}</p></div>
        <p className="text-xs text-slate-600">{layout === 'chain' ? ui.placesHint : ui.placesHintMany}</p>
        {stops.map((stop, index) => (
          <StopEditor key={index} title={titleFor(index)} stop={stop} onChange={(next) => setStop(index, next)} onRemove={removable(index) ? () => setStops(stops.filter((_, i) => i !== index)) : undefined} photo={photoOf(stop)} onPhoto={(file) => void setPhoto(index, file)} />
        ))}
        <div className="flex flex-wrap gap-2">
          {layout === 'chain' && <button type="button" onClick={swap} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50"><ArrowUp className="h-4 w-4" aria-hidden="true" /><ArrowDown className="-ml-3 h-4 w-4" aria-hidden="true" />{ui.swap}</button>}
          {stops.length < maxStops && <button type="button" onClick={addStop} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50"><Plus className="h-4 w-4" aria-hidden="true" />{layout === 'chain' ? ui.addStop : ui.addPlace}</button>}
        </div>
        {same && <Note>{ui.sameStops}</Note>}
        {notice && <Note>{notice}</Note>}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.look}</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {GLOBE_STYLES.map((style) => <StyleThumb key={style.id} id={style.id} chosen={options.styleId === style.id} onPick={() => update({ styleId: style.id })} />)}
        </div>
        <div className="space-y-3">
          {layout === 'chain' && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.motion}</p><ChoiceButtons label={ui.motion} value={options.motion} onChange={(value) => update({ motion: value as GlobeOptions['motion'] })} options={names(ui.motions)} /></div>}
          {layout !== 'visited' && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.line}</p><ChoiceButtons label={ui.line} value={options.line} onChange={(value) => update({ line: value as GlobeOptions['line'] })} options={names(ui.lines)} /></div>}
          {layout !== 'visited' && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.arc}</p><ChoiceButtons label={ui.arc} value={options.arc} onChange={(value) => update({ arc: value as GlobeOptions['arc'] })} options={names(ui.arcs)} /></div>}
          {layout !== 'visited' && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.mover}</p><ChoiceButtons label={ui.mover} value={options.mover} onChange={(value) => update({ mover: value as GlobeOptions['mover'], ...(value === 'plane' ? { arc: 'lifted' as const } : value === 'dot' || value === 'none' ? {} : { arc: 'flat' as const }) })} options={names(ui.movers)} />{['train', 'car', 'bus', 'ship'].includes(options.mover) && <p className="mt-1 text-[11px] text-slate-500">{ui.moverNote}</p>}</div>}
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.pin}</p><ChoiceButtons label={ui.pin} value={options.pin} onChange={(value) => update({ pin: value as GlobeOptions['pin'] })} options={names(ui.pins)} /></div>
          {layout === 'chain' && stops.length > 2 && (
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.perLeg}</p>
              <div className="space-y-2">{legMovers.map((leg, i) => (
                <div key={i}><p className="text-[11px] font-semibold text-slate-600">{stops[i]!.label} → {stops[i + 1]!.label}</p>
                  <ChoiceButtons label={`${ui.perLeg} ${i + 1}`} value={leg} onChange={(value) => setLeg(i, value)} options={[{ value: 'same', label: ui.sameVehicle }, ...names(ui.movers).filter((item) => item.value !== 'none')]} /></div>
              ))}</div></div>
          )}
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.routeColour}</p>
            <div role="group" aria-label={ui.routeColour} className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={!options.routeColor} onClick={() => update({ routeColor: '' })} className={`min-h-10 rounded-lg border px-3 text-xs font-semibold ${!options.routeColor ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700'}`}>{ui.lookColour}</button>
              {ROUTE_COLOURS.map((colour) => <button key={colour} type="button" aria-label={colour} aria-pressed={options.routeColor === colour} onClick={() => update({ routeColor: colour })} style={{ background: colour }} className={`h-10 w-10 rounded-full border-2 ${options.routeColor === colour ? 'border-slate-900' : 'border-slate-200'}`} />)}
            </div></div>
          {layout !== 'visited' && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.distance}</p><ChoiceButtons label={ui.distance} value={options.distance} onChange={(value) => update({ distance: value as GlobeOptions['distance'] })} options={names(ui.distances)} /></div>}
          <Toggle label={ui.night} hint={ui.nightHint} checked={options.night} onChange={(value) => update({ night: value })} />
          <Toggle label={ui.highlight} hint={ui.highlightHint} checked={options.highlight} onChange={(value) => update({ highlight: value })} />
          <Toggle label={ui.labels} checked={options.labels} onChange={(value) => update({ labels: value })} />
          <label className="block text-xs font-semibold text-slate-700">{ui.caption}
            <input value={options.caption} maxLength={60} placeholder={ui.captionPlaceholder} onChange={(event) => update({ caption: event.target.value })} className={fieldClass} />
          </label>
        </div>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.brandMusic}</h2>
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-700">{ui.logo}</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50"><ImageIcon className="h-4 w-4" aria-hidden="true" />{logo ? ui.changeLogo : ui.addLogo}
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addLogo(file); }} /></label>
            {logo && <><img src={logoThumb} alt="" className="h-11 max-w-[5rem] rounded-lg border border-slate-200 bg-slate-100 object-contain" /><button type="button" onClick={() => void addLogo(null)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">{ui.removeLogo}</button></>}
          </div>
          {logo && <div className="mt-2 space-y-2"><ChoiceButtons label={ui.logoCorner} value={options.logoCorner} onChange={(value) => update({ logoCorner: value as GlobeOptions['logoCorner'] })} options={names(ui.corners)} /><ChoiceButtons label={ui.logoSize} value={options.logoSize} onChange={(value) => update({ logoSize: value as GlobeOptions['logoSize'] })} options={names(ui.logoSizes)} /></div>}
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-700">{ui.music}</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50"><MusicIcon className="h-4 w-4" aria-hidden="true" />{music ? ui.changeMusic : ui.addMusic}
              <input type="file" accept="audio/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addMusic(file); }} /></label>
            {music && <><span className="max-w-[12rem] truncate text-xs text-slate-700" title={music.name}>{music.name}</span><button type="button" onClick={() => void addMusic(null)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">{ui.removeMusic}</button></>}
          </div>
          {music && <label className="mt-2 block text-xs font-semibold text-slate-700"><span className="flex justify-between"><span>{ui.volume}</span><span className="font-bold text-slate-900">{volume}%</span></span><input type="range" min={0} max={100} step={5} value={volume} onChange={(event) => { setVolume(Number(event.target.value)); setResult(null); }} className="mt-1 w-full accent-orange-700" /></label>}
          <p className="mt-1 text-[11px] text-slate-500">{ui.musicHint}</p>
          {musicFallsBack && <Note>{ui.musicQuick}</Note>}
        </div>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.shape}</h2>
        <ChoiceButtons label={ui.shape} value={shape} onChange={(value) => { setSaved({ ...saved, shape: value as ShapeId }); setResult(null); setPicture(null); }} options={names(ui.shapes)} />
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
          <ChoiceButtons label={ui.quality} value={String(quality)} onChange={(value) => { setSaved({ ...saved, quality: value === '1080' ? 1080 : 720 }); setResult(null); setPicture(null); }} options={names(ui.qualities)} /></div>
        {smooth.ok && (
          <>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.mode}</p>
              <ChoiceButtons label={ui.mode} value={mode} onChange={(value) => { setSaved({ ...saved, mode: value === 'quick' ? 'quick' : 'smooth' }); setResult(null); }} options={names(ui.modes)} />
              <p className="mt-1 text-[11px] text-slate-500">{mode === 'smooth' ? ui.smoothHint : ui.quickHint}</p></div>
            {mode === 'smooth' && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.frameRate}</p>
              <ChoiceButtons label={ui.frameRate} value={String(fps)} onChange={(value) => { setSaved({ ...saved, fps: value === '60' ? 60 : 30 }); setResult(null); }} options={names(ui.frameRates)} /></div>}
          </>
        )}
        <label className="block text-xs font-semibold text-slate-700"><span className="flex justify-between"><span>{ui.seconds}</span><span className="font-bold text-slate-900">{seconds} s</span></span>
          <input type="range" min={minSeconds} max={30} step={1} value={seconds} onChange={(event) => update({ seconds: Number(event.target.value) })} className="mt-1 w-full accent-orange-700" />
        </label>
        <p className="text-[11px] text-slate-500">{useSmooth ? ui.fpsSmooth.replace('{fps}', String(fps)) : ui.fps}</p>
        <p className="text-[11px] text-slate-500">{ui.credit}</p>
      </section>

      <section className={`${card} space-y-3`}>
        {!canMake && <Note>{ui.noRecord}</Note>}
        {recording && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round(progress * 100)}%` }} /></div><p className="text-xs text-slate-700">{wasSmooth ? ui.keepOpenSmooth.replace('{done}', String(Math.round(progress * 100))).replace('{left}', progress > 0.05 ? String(Math.max(1, Math.round(((performance.now() - started) / 1000) * (1 - progress) / progress))) : '…') : ui.keepOpen}</p></>}
        {recording
          ? <button type="button" onClick={() => abort.current?.abort()} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.cancel}</button>
          : <MainActionButton onClick={() => void makeVideo()} disabled={!canMake || same}><Video className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
        {message && <Note>{message}</Note>}
        {result && (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-3">
            <video src={result.url} controls playsInline className="mx-auto max-h-[70vh] w-full max-w-md rounded-lg bg-black" style={{ aspectRatio: ratio }} />
            <p className="text-xs text-slate-700">{result.extension === 'mp4' ? (wasSmooth ? ui.smoothNote.replace('{fps}', String(fps)) : ui.mp4Note) : ui.webmNote}</p>
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
