import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Camera, Pause, Play, Square, Video } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import ui from '../../../locales/packs/teleprompter.ui.en.json';
import starters from '../../../locales/packs/teleprompter.examples.en.json';
import { canUseCamera, countWords, openCamera, pickRecorderMime, startTake, stopStream, type Take } from '../../../lib/teleprompter/session';
import { buttonClass } from '../../common/styles';

const STORAGE_KEY = 'mdu_teleprompter_v1';
type SizeId = 'small' | 'medium' | 'large';
type DimId = 'light' | 'medium' | 'strong';
interface Saved { script: string; size: SizeId; speed: number; camera: 'user' | 'environment'; quality: 720 | 1080; voice: boolean; mirror: boolean; dim: DimId; countdown: boolean }
type StarterId = keyof typeof starters;
const STARTER_IDS = Object.keys(starters) as StarterId[];
const SIZE_RATIO: Record<SizeId, number> = { small: 0.07, medium: 0.09, large: 0.115 };
const DIM_ALPHA: Record<DimId, number> = { light: 0.35, medium: 0.55, strong: 0.78 };
const DEFAULTS: Saved = { script: starters.intro.script, size: 'medium', speed: starters.intro.speed, camera: 'user', quality: 720, voice: true, mirror: false, dim: 'medium', countdown: true };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const clock = (seconds: number) => { const total = Math.max(1, Math.round(seconds)); return total < 60 ? `${total} s` : `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, '0')} s`; };

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.script === 'string') return { ...DEFAULTS, ...raw };
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** Scroll a script over the camera picture and record a video of yourself reading it. The script shows only on your screen. */
export const Teleprompter: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { script, size, speed, camera, quality, voice, mirror, dim, countdown } = saved;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [phase, setPhase] = useState<'idle' | 'counting' | 'recording'>('idle');
  const [count, setCount] = useState(3);
  const [scrolling, setScrolling] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const [aspect, setAspect] = useState(() => (typeof window !== 'undefined' && window.innerWidth > window.innerHeight ? 16 / 9 : 9 / 16));
  const [stageWidth, setStageWidth] = useState(360);
  const [stageHeight, setStageHeight] = useState(640);
  const [distance, setDistance] = useState(0);
  const [message, setMessage] = useState('');
  const output = useResultFile();
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const speedRef = useRef(speed);
  const take = useRef<Take | null>(null);
  const lock = useRef<{ release: () => Promise<void> } | null>(null);
  const supported = useMemo(() => canUseCamera(), []);
  const choice = useMemo(() => pickRecorderMime(), []);

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { stopStream(stream); void lock.current?.release().catch(() => undefined); }, [stream]);
  useEffect(() => { if (video.current) video.current.srcObject = stream; }, [stream]);
  useEffect(() => {
    const element = stage.current; if (!element) return undefined;
    const measure = () => { setStageWidth(element.clientWidth || 360); setStageHeight(element.clientHeight || 640); };
    const watch = new ResizeObserver(measure);
    watch.observe(element); measure();
    return () => watch.disconnect();
  }, []);

  const fontPx = Math.round(stageWidth * SIZE_RATIO[size]);
  useLayoutEffect(() => {
    const viewport = stage.current, text = inner.current; if (!viewport || !text) return;
    setDistance(Math.max(0, text.offsetHeight - viewport.clientHeight));
  }, [script, fontPx, stageWidth, stageHeight, aspect]);

  const place = () => { if (inner.current) inner.current.style.transform = `translateY(${-offset.current}px)`; };
  useEffect(() => { offset.current = 0; place(); setAtEnd(false); }, [script, size]);

  const pxPerSecond = (speed * stageWidth) / 360;
  useEffect(() => {
    if (!scrolling) return undefined;
    let raf = 0, last = performance.now();
    const step = (now: number) => {
      const seconds = Math.min(0.1, (now - last) / 1000); last = now;
      const limit = Math.max(0, (inner.current?.offsetHeight ?? 0) - (stage.current?.clientHeight ?? 0));
      offset.current = Math.min(limit, offset.current + ((speedRef.current * (stage.current?.clientWidth ?? 360)) / 360) * seconds);
      place();
      if (offset.current >= limit && limit > 0) { setAtEnd(true); setScrolling(false); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [scrolling]);

  const update = (patch: Partial<Saved>) => { output.clear(); setSaved((current) => ({ ...current, ...patch })); };
  const useStarter = (id: StarterId) => { const s = starters[id]; update({ script: s.script, size: s.size as SizeId, speed: s.speed }); };
  const activeStarter = STARTER_IDS.find((id) => starters[id].script === script) ?? '';
  const words = countWords(script);
  const readTime = pxPerSecond > 0 ? clock(distance / pxPerSecond) : '';

  const rewind = () => { offset.current = 0; place(); setAtEnd(false); };
  const startCamera = async () => {
    setMessage(''); output.clear();
    try {
      const next = await openCamera(camera, quality, voice); setStream(next);
    } catch { setMessage(ui.denied); }
  };
  const cameraOff = () => { stopStream(stream); setStream(null); };

  const beginRecording = async () => {
    if (!stream || !choice) return;
    output.clear(); setMessage(''); rewind();
    if (countdown) { setPhase('counting'); for (let n = 3; n >= 1; n -= 1) { setCount(n); await new Promise<void>((resolve) => setTimeout(resolve, 1000)); } }
    try { lock.current = await (navigator as unknown as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed: carry on */ }
    take.current = startTake(stream, choice); setPhase('recording'); setScrolling(true);
  };
  const stopRecording = async () => {
    const current = take.current; if (!current) return;
    take.current = null; setScrolling(false); setPhase('idle');
    void lock.current?.release().catch(() => undefined); lock.current = null;
    try {
      const done = await current.stop();
      if (done.seconds < 1.5 || done.blob.size === 0) { setMessage(ui.tooShort); return; }
      output.set(done.blob, generateFileName('teleprompter', done.extension), { detail: `${clock(done.seconds)}, ${formatBytes(done.blob.size)}`, key: done.extension });
      cameraOff();
    } catch { setMessage(ui.failed); }
  };
  const startAgain = () => { take.current = null; setScrolling(false); setPhase('idle'); cameraOff(); rewind(); output.clear(); setMessage(''); setSaved(DEFAULTS); };

  const recording = phase === 'recording';
  const busy = phase !== 'idle';
  const fade = DIM_ALPHA[dim];
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {!supported && <Note>{ui.unsupported}</Note>}
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => useStarter(value as StarterId)} options={STARTER_IDS.map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? starters[activeStarter].hint : ui.startersHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.script}</h2>
        <textarea value={script} onChange={(event) => update({ script: event.target.value })} rows={8} maxLength={20000} disabled={busy} placeholder={ui.scriptPlaceholder} aria-label={ui.script}
          className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        <p className="text-[11px] text-slate-500">{ui.scriptHint}</p>
        {words > 0 ? <p className="text-xs font-semibold text-slate-800">{ui.words.replace('{words}', String(words)).replace('{time}', readTime)}</p> : <p className="text-xs text-slate-600">{ui.scriptEmpty}</p>}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.options}</h2>
        <div><label className="block text-xs font-semibold text-slate-700">{ui.speed}: {speed}
            <input type="range" min={10} max={100} step={5} value={speed} onChange={(event) => update({ speed: Number(event.target.value) })} className="mt-1 w-full accent-orange-700" aria-label={ui.speed} /></label>
          <div className="flex justify-between text-[11px] text-slate-500"><span>{ui.slow}</span><span>{ui.fast}</span></div>
          <p className="text-[11px] text-slate-500">{ui.speedHint}</p></div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.size}</p>
          <ChoiceButtons label={ui.size} value={size} onChange={(value) => update({ size: value as SizeId })} options={names(ui.sizes)} /></div>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
          <div className="mt-3 space-y-3">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.camera}</p>
              <ChoiceButtons label={ui.camera} value={camera} onChange={(value) => { update({ camera: value as Saved['camera'] }); if (stream && !busy) cameraOff(); }} options={names(ui.cameras)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
              <ChoiceButtons label={ui.quality} value={String(quality)} onChange={(value) => { update({ quality: value === '1080' ? 1080 : 720 }); if (stream && !busy) cameraOff(); }} options={names(ui.qualities)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.dim}</p>
              <ChoiceButtons label={ui.dim} value={dim} onChange={(value) => update({ dim: value as DimId })} options={names(ui.dims)} /></div>
            <Toggle label={ui.voice} hint={ui.voiceHint} checked={voice} onChange={(value) => { update({ voice: value }); if (stream && !busy) cameraOff(); }} />
            <Toggle label={ui.countdown} checked={countdown} onChange={(value) => update({ countdown: value })} />
            <Toggle label={ui.mirror} hint={ui.mirrorHint} checked={mirror} onChange={(value) => update({ mirror: value })} />
          </div>
        </details>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.stage}</h2>
        <p className="text-[11px] text-slate-500">{ui.stageHint}</p>
        <div ref={stage} className="relative mx-auto overflow-hidden rounded-xl bg-slate-900" style={{ aspectRatio: String(aspect), width: `min(100%, ${75 * aspect}vh)` }}>
          <video ref={video} autoPlay muted playsInline onLoadedMetadata={(event) => { const v = event.currentTarget; if (v.videoWidth && v.videoHeight) setAspect(v.videoWidth / v.videoHeight); }}
            className={`absolute inset-0 h-full w-full object-cover ${stream ? '' : 'hidden'}`} style={{ transform: camera === 'user' ? 'scaleX(-1)' : undefined }} />
          <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${stream ? fade : 0.2})` }} />
          <div className="absolute inset-x-0 overflow-hidden" style={{ top: 0, bottom: 0 }} onClick={() => { if (recording || scrolling) setScrolling((on) => !on); }}>
            <div style={{ transform: mirror ? 'scaleX(-1)' : undefined }}>
              <div ref={inner} className="whitespace-pre-wrap break-words px-[6%] text-center font-semibold text-white" style={{ fontSize: fontPx, lineHeight: 1.35, paddingTop: Math.round(stageHeight * 0.3), paddingBottom: Math.round(stageHeight * 0.7), textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{script || ' '}</div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 border-y-2 border-orange-400/70" style={{ top: Math.round(stageHeight * 0.3 - fontPx * 0.15), height: Math.round(fontPx * 1.6) }} aria-hidden="true" />
          {recording && <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-[11px] font-bold text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />{ui.recordingNow}</div>}
          {phase === 'counting' && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-7xl font-bold text-white" aria-live="assertive">{count}</div>}
          {atEnd && <div className="absolute inset-x-0 bottom-2 text-center text-xs font-bold text-orange-200">{ui.endOfScript}</div>}
        </div>
        {message && <Note>{message}</Note>}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {!stream && !scrolling && <button type="button" onClick={() => void startCamera()} disabled={!supported || busy} className={buttonClass}><Camera className="h-4 w-4" aria-hidden="true" />{ui.startCamera}</button>}
          {stream && !busy && <button type="button" onClick={cameraOff} className={buttonClass}>{ui.cameraOff}</button>}
          {!busy && <button type="button" onClick={() => { rewind(); setScrolling((on) => !on); }} disabled={!script.trim()} className={buttonClass}>{scrolling ? <><Square className="h-4 w-4" aria-hidden="true" />{ui.stopPractice}</> : <><Play className="h-4 w-4" aria-hidden="true" />{ui.practice}</>}</button>}
          {(recording || scrolling) && <>
            <button type="button" onClick={() => setScrolling((on) => !on)} className={buttonClass}>{scrolling ? <><Pause className="h-4 w-4" aria-hidden="true" />{ui.pauseScroll}</> : <><Play className="h-4 w-4" aria-hidden="true" />{ui.resumeScroll}</>}</button>
            <button type="button" onClick={() => { offset.current = Math.max(0, offset.current - fontPx * 4); place(); setAtEnd(false); }} className={buttonClass}>{ui.back}</button>
            <button type="button" onClick={() => update({ speed: Math.max(10, speed - 5) })} className={buttonClass}>{ui.slowerButton}</button>
            <button type="button" onClick={() => update({ speed: Math.min(100, speed + 5) })} className={buttonClass}>{ui.fasterButton}</button>
          </>}
        </div>
        {recording
          ? <MainActionButton onClick={() => void stopRecording()}><Square className="h-5 w-5" aria-hidden="true" />{ui.stopSave}</MainActionButton>
          : <MainActionButton onClick={() => void beginRecording()} disabled={!stream || !script.trim() || busy || scrolling}><Video className="h-5 w-5" aria-hidden="true" />{ui.record}</MainActionButton>}
        {output.result && (
          <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-3">
            <video src={output.result.url} controls playsInline className="mx-auto max-h-[70vh] w-full max-w-sm rounded-lg bg-black" />
            <p className="text-xs text-slate-700">{output.result.key === 'mp4' ? ui.mp4Note : ui.webmNote}</p>
            <SaveResult href={output.result.url} name={output.result.name} label={ui.ready} saveLabel={ui.saveVideo} detail={output.result.detail} />
          </div>
        )}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={busy} /></div>
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default Teleprompter;
