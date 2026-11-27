import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EyeOff, Plus, Video } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/videoblur.ui.en.json';
import starters from '../../../locales/packs/videoblur.examples.en.json';
import { fitSize, openVideo, planBitrate, readVideoSound, type OpenedVideo } from '../../../lib/videoedit/source';
import { canWriteSmooth, renderVideo } from '../../../lib/videoedit/render';
import { applyBlur, type Box, type Look, type Rect, type ShapeId, type StrengthId, type StyleId } from '../../../lib/videoblur/boxes';
import type { Voice } from '../../../lib/sequence/voice';
import { canEncodeAac } from '../../../lib/globe/audio';
import { canEncodeOffline } from '../../../lib/globe/encode';
import { recordCanvas, recordSupport } from '../../../lib/globe/record';
import { buttonClass, inputClass } from '../../common/styles';

const STORAGE_KEY = 'mdu_video_blur_v1';
const MAX_FILE_MB = 1000, MAX_SECONDS = 600, MAX_BOXES = 10;
type StarterId = keyof typeof starters;
interface Saved extends Look { short: number; sound: boolean }
const DEFAULTS: Saved = { style: 'blur', shape: 'oval', strength: 'strong', short: 0, sound: true };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, Number.isFinite(v) ? v : low));
const secs = (v: number) => v.toFixed(1);

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.style === 'string') return { ...DEFAULTS, ...raw };
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** A made-up clip: a cartoon face that stays still and a car with a made-up plate that drives across. The boxes that go with it are returned too. */
async function makeSample(): Promise<{ file: File; boxes: Box[] } | null> {
  const W = 640, H = 360, D = 4, face = { x: 0.1, y: 0.2, w: 0.14, h: 0.3 };
  const car = (t: number) => ({ x: 0.12 + (0.48 * t) / D, y: 0.62, w: 0.3, h: 0.2 });
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d')!;
  const done = await recordCanvas({ canvas, duration: D, fps: 24, bitrate: 2_000_000, onProgress: () => undefined, signal: new AbortController().signal, paint: (t) => {
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#bfdbfe'); sky.addColorStop(1, '#fef3c7'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#6b7280'; ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.fillStyle = '#fcd9b6'; ctx.beginPath(); ctx.ellipse((face.x + face.w / 2) * W, (face.y + face.h / 2) * H, face.w * W * 0.45, face.h * H * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111827'; [-0.2, 0.2].forEach((dx) => { ctx.beginPath(); ctx.arc((face.x + face.w / 2 + dx * face.w) * W, (face.y + face.h * 0.42) * H, 5, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc((face.x + face.w / 2) * W, (face.y + face.h * 0.58) * H, face.w * W * 0.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    const c = car(Math.min(t, D)); ctx.fillStyle = '#dc2626'; ctx.fillRect(c.x * W, c.y * H, c.w * W, c.h * H);
    ctx.fillStyle = '#ffffff'; ctx.fillRect((c.x + c.w * 0.25) * W, (c.y + c.h * 0.4) * H, c.w * W * 0.5, c.h * H * 0.32);
    ctx.fillStyle = '#111827'; ctx.font = '700 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('AB 12 CD 3456', (c.x + c.w * 0.5) * W, (c.y + c.h * 0.62) * H);
    ctx.fillStyle = '#111827'; [0.2, 0.8].forEach((fx) => { ctx.beginPath(); ctx.arc((c.x + c.w * fx) * W, (c.y + c.h) * H, 14, 0, Math.PI * 2); ctx.fill(); });
  } });
  if (!done) return null;
  const start = car(0), end = car(D), plate = (r: { x: number; y: number; w: number; h: number }): Rect => ({ x: r.x + r.w * 0.2, y: r.y + r.h * 0.33, w: r.w * 0.6, h: r.h * 0.42 });
  const boxes: Box[] = [
    { id: 1, ...face, moves: false, end: face, from: 0, to: 0 },
    { id: 2, ...plate(start), moves: true, end: plate(end), from: 0, to: 0 },
  ];
  return { file: new File([done.blob], `sample-street.${done.support.extension}`, { type: done.blob.type }), boxes };
}

/** Pick a video, put boxes over the faces or number plates, and save a new video with them hidden. Made on your device. */
export const VideoBlur: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const [file, setFile] = useState<File | null>(null);
  const [opened, setOpened] = useState<OpenedVideo | null>(null);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [soundBusy, setSoundBusy] = useState(false);
  const [fileMessage, setFileMessage] = useState('');
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(0);
  const [wasSmooth, setWasSmooth] = useState(false);
  const [message, setMessage] = useState('');
  const [sampling, setSampling] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [encoder, setEncoder] = useState<{ ok: boolean; codec: string }>({ ok: false, codec: '' });
  const [aac, setAac] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const checkCanvas = useRef<HTMLCanvasElement>(null);
  const [checked, setChecked] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const live = useRef<OpenedVideo | null>(null);
  const nextId = useRef(3);
  const boxesSnapshot = useRef<Box[]>([]);
  const support = useMemo(() => recordSupport(false), []);
  const supportWithSound = useMemo(() => recordSupport(true), []);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { abort.current?.abort(); live.current?.release(); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => { let on = true; void canEncodeAac().then((ok) => { if (on) setAac(ok); }); return () => { on = false; }; }, []);

  const look: Look = { style: saved.style, shape: saved.shape, strength: saved.strength };
  const length = opened ? Math.min(opened.duration, MAX_SECONDS) : 0;
  const size = useMemo(() => (opened ? fitSize(opened.width, opened.height, saved.short) : { width: 0, height: 0 }), [opened, saved.short]);
  const useSound = saved.sound && !!voice;
  const fps = 30;
  const plan = useMemo(() => (opened ? planBitrate(size.width, size.height, fps, length, 'high', 0, useSound) : null), [opened, size, length, useSound]);
  useEffect(() => {
    if (!opened) return undefined; let on = true;
    void canEncodeOffline(size.width, size.height, fps).then((found) => { if (on) setEncoder(found); });
    return () => { on = false; };
  }, [opened, size.width, size.height]);

  const reset = () => { setResult(null); setMessage(''); setChecked(false); };
  const change = (patch: Partial<Saved>) => { reset(); setSaved((current) => ({ ...current, ...patch })); };
  const applyStarter = (id: StarterId) => { const s = starters[id]; change({ style: s.style as StyleId, shape: s.shape as ShapeId, strength: s.strength as StrengthId }); };
  const activeStarter = (Object.keys(starters) as StarterId[]).find((id) => { const s = starters[id]; return s.style === saved.style && s.shape === saved.shape && s.strength === saved.strength; }) ?? '';

  const addFile = async (picked: File, withBoxes: Box[] = []) => {
    setFileMessage(''); reset();
    if (picked.size > MAX_FILE_MB * 1048576) { setFileMessage(ui.tooBig.replace('{max}', String(MAX_FILE_MB))); return; }
    try {
      const next = await openVideo(picked);
      live.current?.release(); live.current = next;
      setFile(picked); setOpened(next); setVoice(null); setBoxes(withBoxes); setSelected(withBoxes[0]?.id ?? null);
      setSoundBusy(true);
      void readVideoSound(picked).then((found) => { if (live.current === next) { setVoice(found); setSoundBusy(false); } });
    } catch { setFileMessage(ui.fileFailed); }
  };
  const trySample = async () => {
    setSampling(true); setFileMessage('');
    try { const sample = await makeSample(); if (sample) { setSaved((c) => ({ ...c, style: 'blur', shape: 'rect', strength: 'strong' })); await addFile(sample.file, sample.boxes); } } catch { setFileMessage(ui.fileFailed); } finally { setSampling(false); }
  };

  const patchBox = (id: number, patch: Partial<Box>) => { reset(); setBoxes((current) => current.map((b) => (b.id === id ? { ...b, ...patch } : b))); };
  const addBox = () => {
    if (boxes.length >= MAX_BOXES) return; reset();
    const oval = saved.shape === 'oval', rect: Rect = oval ? { x: 0.4, y: 0.3, w: 0.18, h: 0.3 } : { x: 0.35, y: 0.4, w: 0.3, h: 0.12 };
    const box: Box = { id: nextId.current++, ...rect, moves: false, end: { ...rect }, from: 0, to: 0 };
    setBoxes((current) => [...current, box]); setSelected(box.id);
  };

  /** Dragging a box or its corner on the picture. `target` is the start place or the end place of a moving box. */
  const drag = (event: React.PointerEvent, id: number, target: 'start' | 'end', mode: 'move' | 'size') => {
    event.preventDefault(); event.stopPropagation();
    const area = stage.current?.getBoundingClientRect(), box = boxes.find((b) => b.id === id); if (!area || !box) return;
    setSelected(id);
    const origin: Rect = target === 'start' ? { x: box.x, y: box.y, w: box.w, h: box.h } : { ...box.end }, sx = event.clientX, sy = event.clientY;
    const element = event.currentTarget as HTMLElement; element.setPointerCapture(event.pointerId);
    const move = (e: PointerEvent) => {
      const dx = (e.clientX - sx) / area.width, dy = (e.clientY - sy) / area.height;
      const next: Rect = mode === 'move'
        ? { ...origin, x: clamp(origin.x + dx, 0, 1 - origin.w), y: clamp(origin.y + dy, 0, 1 - origin.h) }
        : { ...origin, w: clamp(origin.w + dx, 0.03, 1 - origin.x), h: clamp(origin.h + dy, 0.03, 1 - origin.y) };
      setResult(null); setChecked(false);
      setBoxes((current) => current.map((b) => (b.id !== id ? b : target === 'start' ? { ...b, ...next, end: b.moves ? b.end : { ...next } } : { ...b, end: next })));
    };
    const up = () => { element.removeEventListener('pointermove', move); element.removeEventListener('pointerup', up); element.removeEventListener('pointercancel', up); };
    element.addEventListener('pointermove', move); element.addEventListener('pointerup', up); element.addEventListener('pointercancel', up);
  };

  const showEffect = () => {
    const video = player.current, canvas = checkCanvas.current; if (!video || !canvas || !opened) return;
    const k = Math.min(1, 720 / Math.max(opened.width, opened.height)); canvas.width = Math.round(opened.width * k); canvas.height = Math.round(opened.height * k);
    const ctx = canvas.getContext('2d')!; ctx.drawImage(video, 0, 0, canvas.width, canvas.height); applyBlur(ctx, boxes, video.currentTime, canvas.width, canvas.height, look, opened.duration); setChecked(true);
  };

  const smoothOk = !!opened && canWriteSmooth({ encoder, aac, sound: useSound ? voice : null });
  const canMake = !!opened && !!plan && boxes.length > 0 && (smoothOk || (useSound ? supportWithSound.ok : support.ok));
  const fileBase = (file?.name ?? 'video').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'video';

  const makeVideo = async () => {
    if (!opened || !plan) return;
    setMessage(''); setResult(null); setProgress(0); setStarted(performance.now()); setWasSmooth(smoothOk); setRecording(true); player.current?.pause();
    const control = new AbortController(); abort.current = control; boxesSnapshot.current = boxes;
    let lock: { release: () => Promise<void> } | null = null;
    try { lock = await (navigator as unknown as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed: carry on */ }
    try {
      const done = await renderVideo({ opened, start: 0, duration: length, width: size.width, height: size.height, fps, bitrate: plan.bitrate, sound: useSound ? voice : null, encoder, aac, onProgress: setProgress, signal: control.signal,
        overlay: (ctx, seconds, w, h) => applyBlur(ctx, boxesSnapshot.current, seconds, w, h, look, opened.duration) });
      if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}-hidden.${done.extension}`, size: done.blob.size });
    } catch { setMessage(ui.failed); }
    finally { void lock?.release().catch(() => undefined); setRecording(false); abort.current = null; }
  };

  const startAgain = () => { abort.current?.abort(); live.current?.release(); live.current = null; setSaved(DEFAULTS); setFile(null); setOpened(null); setVoice(null); setBoxes([]); setSelected(null); setFileMessage(''); reset(); };
  const current = boxes.find((b) => b.id === selected) ?? null;
  const frame = (r: Rect, id: number, target: 'start' | 'end', n: number, active: boolean) => (
    <div key={`${id}${target}`} onPointerDown={(e) => drag(e, id, target, 'move')} style={{ position: 'absolute', left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%`, touchAction: 'none', pointerEvents: 'auto', cursor: 'move', boxSizing: 'border-box', border: `${active ? 3 : 2}px ${target === 'end' ? 'dashed' : 'solid'} #ea580c`, borderRadius: saved.shape === 'oval' ? '50%' : 4, background: target === 'end' ? 'rgba(234,88,12,0.12)' : 'rgba(234,88,12,0.2)' }}>
      <span style={{ position: 'absolute', left: 2, top: 2, fontSize: 11, fontWeight: 700, color: '#fff', background: '#ea580c', borderRadius: 4, padding: '0 4px' }}>{target === 'end' ? `${n} →` : n}</span>
      <span onPointerDown={(e) => drag(e, id, target, 'size')} style={{ position: 'absolute', right: -6, bottom: -6, width: 26, height: 26, background: '#ea580c', borderRadius: 6, touchAction: 'none', cursor: 'nwse-resize', border: '2px solid #fff' }} />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => applyStarter(value as StarterId)} options={(Object.keys(starters) as StarterId[]).map((id) => ({ value: id, label: starters[id].label }))} />
        <p className="text-[11px] text-slate-500">{activeStarter ? starters[activeStarter as StarterId].hint : ui.startersHint}</p>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.pick}</h2>
        <p className="text-[11px] text-slate-500">{ui.pickHint.replace('{max}', String(MAX_FILE_MB))}</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 ${recording || sampling ? 'pointer-events-none opacity-40' : ''}`}><Video className="h-4 w-4" aria-hidden="true" />{opened ? ui.changeVideo : ui.addVideo}
            <input type="file" accept="video/*" className="sr-only" onChange={(event) => { const picked = event.target.files?.[0] ?? null; event.target.value = ''; if (picked) void addFile(picked); }} /></label>
          <button type="button" onClick={() => void trySample()} disabled={recording || sampling} className={buttonClass}>{sampling ? ui.makingSample : ui.trySample}</button>
        </div>
        <p className="text-[11px] text-slate-500">{ui.sampleNote}</p>
        {fileMessage && <Note>{fileMessage}</Note>}
        {opened && file && <p className="text-xs text-slate-800">{ui.info.replace('{name}', file.name).replace('{size}', formatBytes(file.size)).replace('{w}', String(opened.width)).replace('{h}', String(opened.height)).replace('{seconds}', secs(opened.duration))}</p>}
        {opened && opened.duration > MAX_SECONDS && <Note>{ui.tooLong.replace('{max}', String(MAX_SECONDS / 60))}</Note>}
      </section>

      {opened && (
        <section className={`${card} space-y-3`}>
          <h2 className={heading}>{ui.boxesTitle}</h2>
          <p className="text-[11px] text-slate-500">{ui.boxesHint}</p>
          <div ref={stage} style={{ position: 'relative' }} className="mx-auto w-full max-w-md">
            <video ref={player} src={opened.url} controls playsInline preload="metadata" className="block h-auto w-full rounded-lg bg-black" aria-label={ui.previewLabel} />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {boxes.map((b, n) => frame({ x: b.x, y: b.y, w: b.w, h: b.h }, b.id, 'start', n + 1, b.id === selected))}
              {boxes.filter((b) => b.moves).map((b) => frame(b.end, b.id, 'end', boxes.indexOf(b) + 1, b.id === selected))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addBox} disabled={boxes.length >= MAX_BOXES || recording} className={buttonClass}><Plus className="h-4 w-4" aria-hidden="true" />{ui.addBox}</button>
            <button type="button" onClick={showEffect} disabled={boxes.length === 0 || recording} className={buttonClass}><EyeOff className="h-4 w-4" aria-hidden="true" />{ui.check}</button>
          </div>
          <p className="text-[11px] text-slate-500">{boxes.length >= MAX_BOXES ? ui.maxBoxes.replace('{max}', String(MAX_BOXES)) : boxes.length === 0 ? ui.noBoxes : ui.checkHint}</p>
          <canvas ref={checkCanvas} role="img" aria-label={ui.checkLabel} className={`mx-auto h-auto w-full max-w-md rounded-lg bg-black ${checked ? '' : 'hidden'}`} />
          {boxes.length > 0 && (
            <div className="space-y-2">
              <ChoiceButtons label={ui.box.replace('{n}', '')} value={String(selected ?? '')} onChange={(value) => setSelected(Number(value))} options={boxes.map((b, n) => ({ value: String(b.id), label: ui.box.replace('{n}', String(n + 1)) }))} />
              {current && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <Toggle label={ui.moves} hint={ui.movesHint} checked={current.moves} onChange={(value) => patchBox(current.id, { moves: value, end: value ? { x: Math.min(1 - current.w, current.x + 0.2), y: current.y, w: current.w, h: current.h } : { x: current.x, y: current.y, w: current.w, h: current.h } })} />
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold text-slate-700">{ui.showFrom}<input type="number" min={0} max={Math.max(0, length)} step={0.5} value={Math.round(current.from * 10) / 10} onChange={(event) => patchBox(current.id, { from: clamp(Number(event.target.value), 0, length) })} className={inputClass} /></label>
                    <label className="block text-xs font-semibold text-slate-700">{ui.showTo}<input type="number" min={0} max={Math.max(0, length)} step={0.5} value={current.to > 0 ? Math.round(current.to * 10) / 10 : Math.round(length * 10) / 10} onChange={(event) => patchBox(current.id, { to: clamp(Number(event.target.value), 0, length) >= length - 0.05 ? 0 : clamp(Number(event.target.value), 0, length) })} className={inputClass} /></label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => patchBox(current.id, { from: Math.min(player.current?.currentTime ?? 0, length) })} className={buttonClass}>{ui.fromHere}</button>
                    <button type="button" onClick={() => patchBox(current.id, { to: Math.min(player.current?.currentTime ?? 0, length) >= length - 0.05 ? 0 : Math.max(0.1, player.current?.currentTime ?? 0) })} className={buttonClass}>{ui.toHere}</button>
                    <button type="button" onClick={() => patchBox(current.id, { to: 0 })} className={buttonClass}>{ui.toEnd}</button>
                    <button type="button" onClick={() => { reset(); setBoxes((all) => all.filter((b) => b.id !== current.id)); setSelected(null); }} className={buttonClass}>{ui.remove}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className={card}>
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
          <div className="mt-3 space-y-3">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.style}</p><ChoiceButtons label={ui.style} value={saved.style} onChange={(value) => change({ style: value as StyleId })} options={names(ui.styles)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.shape}</p><ChoiceButtons label={ui.shape} value={saved.shape} onChange={(value) => change({ shape: value as ShapeId })} options={names(ui.shapes)} /></div>
            {saved.style !== 'black' && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.strength}</p><ChoiceButtons label={ui.strength} value={saved.strength} onChange={(value) => change({ strength: value as StrengthId })} options={names(ui.strengths)} /><p className="mt-1 text-[11px] text-slate-500">{ui.strengthHint}</p></div>}
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.size}</p><ChoiceButtons label={ui.size} value={String(saved.short)} onChange={(value) => change({ short: Number(value) })} options={names(ui.sizes)} /></div>
            <Toggle label={ui.keepSound} hint={ui.keepSoundHint} checked={saved.sound} onChange={(value) => change({ sound: value })} />
          </div>
        </details>
      </section>

      <section className={`${card} space-y-3`}>
        {opened && !canMake && boxes.length > 0 && <Note>{ui.noMake}</Note>}
        {opened && boxes.length === 0 && <Note>{ui.noBoxesToMake}</Note>}
        {opened && canMake && !smoothOk && <Note>{ui.slowNote}</Note>}
        {recording && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round(progress * 100)}%` }} /></div><p className="text-xs text-slate-700">{wasSmooth ? ui.keepOpenSmooth.replace('{done}', String(Math.round(progress * 100))).replace('{left}', progress > 0.03 ? String(Math.max(1, Math.round(((performance.now() - started) / 1000) * (1 - progress) / progress))) : '…') : ui.keepOpen}</p></>}
        {recording
          ? <button type="button" onClick={() => abort.current?.abort()} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.cancel}</button>
          : <MainActionButton onClick={() => void makeVideo()} disabled={!canMake || soundBusy}><EyeOff className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
        {message && <Note>{message}</Note>}
        {result && (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-3">
            <video src={result.url} controls playsInline className="mx-auto max-h-[60vh] w-full max-w-md rounded-lg bg-black" />
            <p className="text-xs font-semibold text-slate-800">{ui.checkResult}</p>
            <SaveResult href={result.url} name={result.name} label={ui.ready} saveLabel={ui.saveVideo} detail={formatBytes(result.size)} />
          </div>
        )}
        <ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={recording} />
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default VideoBlur;
