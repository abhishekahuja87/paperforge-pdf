import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Video } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/subtitleburn.ui.en.json';
import starters from '../../../locales/packs/subtitleburn.examples.en.json';
import '../shops/posterFonts.css';
import { fitSize, openVideo, planBitrate, readVideoSound, type OpenedVideo, type QualityId } from '../../../lib/videoedit/source';
import { canWriteSmooth, renderVideo } from '../../../lib/videoedit/render';
import { parseSubtitles, sampleCues, toSrtText } from '../../../lib/captions/import';
import { makeBurnOverlay, type BurnLookId, type BurnOptions, type BurnPositionId, type BurnSizeId } from '../../../lib/captions/burn';
import type { FontId } from '../../../lib/sequence/scene';
import type { Voice } from '../../../lib/sequence/voice';
import { canEncodeAac } from '../../../lib/globe/audio';
import { canEncodeOffline } from '../../../lib/globe/encode';
import { recordSupport } from '../../../lib/globe/record';
import { inputClass } from '../../common/styles';

const STORAGE_KEY = 'mdu_subtitle_burn_v1';
const MAX_FILE_MB = 1000;
const MAX_SECONDS = 600;
const MAX_TEXT = 400_000;
interface Saved { options: BurnOptions; short: number; quality: QualityId }
type StarterId = keyof typeof starters;

const DEFAULTS: Saved = { options: { look: 'white', position: 'bottom', size: 'medium', font: 'clean' }, short: 0, quality: 'high' };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const secs = (value: number) => value.toFixed(1);
const mb = (bytes: number) => `${(bytes / 1048576).toFixed(bytes < 10485760 ? 1 : 0)} MB`;

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && raw.options) return { ...DEFAULTS, ...raw, options: { ...DEFAULTS.options, ...raw.options } } as Saved;
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** Add a video and a subtitle file (SRT or WebVTT) and save a new video with the captions drawn on it. Made on your device. */
export const SubtitleBurner: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { options, short, quality } = saved;
  const [file, setFile] = useState<File | null>(null);
  const [opened, setOpened] = useState<OpenedVideo | null>(null);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [soundBusy, setSoundBusy] = useState(false);
  const [fileMessage, setFileMessage] = useState('');
  const [srt, setSrt] = useState('');
  const [shift, setShift] = useState(0);
  const [textMessage, setTextMessage] = useState('');
  const [fontTick, setFontTick] = useState(0);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(0);
  const [wasSmooth, setWasSmooth] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; size: number; extension: string } | null>(null);
  const [encoder, setEncoder] = useState<{ ok: boolean; codec: string }>({ ok: false, codec: '' });
  const [aac, setAac] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const abort = useRef<AbortController | null>(null);
  const live = useRef<OpenedVideo | null>(null);
  const supportWithSound = useMemo(() => recordSupport(true), []);
  const support = useMemo(() => recordSupport(false), []);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { abort.current?.abort(); live.current?.release(); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => { let on = true; void canEncodeAac().then((ok) => { if (on) setAac(ok); }); return () => { on = false; }; }, []);
  useEffect(() => { let on = true; void Promise.all(['700 30px Poppins', '700 30px Fredoka'].map((font) => document.fonts.load(font, 'AaBb'))).catch(() => undefined).then(() => { if (on) setFontTick((tick) => tick + 1); }); return () => { on = false; }; }, []);

  const parsed = useMemo(() => parseSubtitles(srt), [srt]);
  const cues = useMemo(() => (shift ? parsed.cues.map((cue) => ({ ...cue, start: Math.max(0, cue.start + shift), end: Math.max(0.1, cue.end + shift) })) : parsed.cues), [parsed, shift]);
  const duration = opened ? Math.min(opened.duration, MAX_SECONDS) : 0;
  const size = useMemo(() => (opened ? fitSize(opened.width, opened.height, short) : { width: 0, height: 0 }), [opened, short]);
  const useSound = !!voice;
  const plan = useMemo(() => (opened ? planBitrate(size.width, size.height, 30, duration, quality, 0, useSound) : null), [opened, size, duration, quality, useSound]);
  const previewW = opened ? Math.min(640, opened.width) : 0, previewH = opened ? Math.round((previewW * opened.height) / opened.width) : 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const previewOverlay = useMemo(() => (opened ? makeBurnOverlay(cues, options, previewW, previewH) : null), [opened, cues, options, previewW, previewH, fontTick]);

  useEffect(() => {
    if (!previewOverlay) return undefined;
    let raf = 0;
    const draw = () => {
      const ctx = overlay.current?.getContext('2d'); const video = player.current;
      if (ctx && video) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, previewW, previewH); previewOverlay(ctx, video.currentTime); }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [previewOverlay, previewW, previewH]);

  useEffect(() => {
    if (!opened) return undefined;
    let on = true;
    void canEncodeOffline(size.width, size.height, 30).then((found) => { if (on) setEncoder(found); });
    return () => { on = false; };
  }, [opened, size.width, size.height]);

  const reset = () => { setResult(null); setMessage(''); };
  const change = (patch: Partial<BurnOptions>) => { reset(); setSaved((current) => ({ ...current, options: { ...current.options, ...patch } })); };
  const useStarter = (id: StarterId) => { const s = starters[id]; change({ look: s.look as BurnLookId, position: s.position as BurnPositionId, size: s.size as BurnSizeId, font: s.font as FontId }); };
  const activeStarter = (Object.keys(starters) as StarterId[]).find((id) => { const s = starters[id]; return s.look === options.look && s.position === options.position && s.size === options.size && s.font === options.font; }) ?? '';

  const addFile = async (picked: File) => {
    setFileMessage(''); reset();
    if (picked.size > MAX_FILE_MB * 1048576) { setFileMessage(ui.tooBig.replace('{max}', String(MAX_FILE_MB))); return; }
    try {
      const next = await openVideo(picked);
      live.current?.release(); live.current = next;
      setFile(picked); setOpened(next); setVoice(null); setSoundBusy(true);
      void readVideoSound(picked).then((found) => { if (live.current !== next) return; setVoice(found); setSoundBusy(false); if (!found) setFileMessage(ui.noSoundFound); });
    } catch { setFileMessage(ui.fileFailed); }
  };
  const addSubtitles = async (picked: File) => {
    setTextMessage(''); reset();
    try { const text = (await picked.text()).slice(0, MAX_TEXT); setSrt(text); if (!parseSubtitles(text).cues.length) setTextMessage(ui.noCues); } catch { setTextMessage(ui.subtitleFailed); }
  };
  const useSample = () => { if (!opened) return; reset(); setTextMessage(''); setSrt(toSrtText(sampleCues(duration, ui.sampleLines))); };

  const smoothOk = !!opened && canWriteSmooth({ encoder, aac, sound: useSound ? voice : null });
  const canMake = !!opened && !!plan && cues.length > 0 && (smoothOk || (useSound ? supportWithSound.ok : support.ok));
  const fileBase = (file?.name ?? 'video').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'video';
  const beyond = cues.filter((cue) => cue.start >= duration).length;

  const makeVideo = async () => {
    if (!opened || !plan) return;
    setMessage(''); setResult(null); setProgress(0); setStarted(performance.now()); setWasSmooth(smoothOk); setRecording(true); player.current?.pause();
    const control = new AbortController(); abort.current = control;
    let lock: { release: () => Promise<void> } | null = null;
    try { lock = await (navigator as unknown as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed: carry on */ }
    try {
      const paint = makeBurnOverlay(cues, options, size.width, size.height);
      const done = await renderVideo({ opened, start: 0, duration, width: size.width, height: size.height, fps: 30, bitrate: plan.bitrate, sound: voice, overlay: (ctx, seconds) => paint(ctx, seconds), encoder, aac, onProgress: setProgress, signal: control.signal });
      if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}-captions.${done.extension}`, size: done.blob.size, extension: done.extension });
    } catch { setMessage(ui.failed); }
    finally { void lock?.release().catch(() => undefined); setRecording(false); abort.current = null; }
  };

  const startAgain = () => { abort.current?.abort(); live.current?.release(); live.current = null; setSaved(DEFAULTS); setFile(null); setOpened(null); setVoice(null); setSrt(''); setShift(0); setFileMessage(''); setTextMessage(''); reset(); };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => useStarter(value as StarterId)} options={(Object.keys(starters) as StarterId[]).map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? starters[activeStarter as StarterId].hint : ui.startersHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.pick}</h2>
        <p className="text-[11px] text-slate-500">{ui.pickHint.replace('{max}', String(MAX_FILE_MB))}</p>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 ${recording ? 'pointer-events-none opacity-40' : ''}`}><Video className="h-4 w-4" aria-hidden="true" />{opened ? ui.changeVideo : ui.addVideo}
            <input type="file" accept="video/*" className="sr-only" onChange={(event) => { const picked = event.target.files?.[0] ?? null; event.target.value = ''; if (picked) void addFile(picked); }} /></label>
        </div>
        {fileMessage && <Note>{fileMessage}</Note>}
        {opened && file && (
          <>
            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-lg bg-black" style={{ aspectRatio: `${opened.width} / ${opened.height}` }}>
              <video ref={player} src={opened.url} controls playsInline preload="metadata" className="absolute inset-0 h-full w-full" aria-label={ui.previewLabel} />
              <canvas ref={overlay} width={previewW} height={previewH} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
            </div>
            <p className="text-xs text-slate-800">{ui.info.replace('{name}', file.name).replace('{size}', formatBytes(file.size)).replace('{w}', String(opened.width)).replace('{h}', String(opened.height)).replace('{seconds}', secs(opened.duration))}</p>
            {opened.duration > MAX_SECONDS && <Note>{ui.tooLong.replace('{max}', String(MAX_SECONDS / 60))}</Note>}
            {soundBusy && <p className="text-xs text-slate-600">{ui.readingSound}</p>}
          </>
        )}
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.words}</h2>
        <p className="text-[11px] text-slate-500">{ui.wordsHint}</p>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 ${recording ? 'pointer-events-none opacity-40' : ''}`}><FileText className="h-4 w-4" aria-hidden="true" />{ui.addSubtitles}
            <input type="file" accept=".srt,.vtt,text/vtt,text/plain,application/x-subrip" className="sr-only" onChange={(event) => { const picked = event.target.files?.[0] ?? null; event.target.value = ''; if (picked) void addSubtitles(picked); }} /></label>
          <button type="button" onClick={useSample} disabled={!opened || recording} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.useSample}</button>
        </div>
        <label className="block text-xs font-semibold text-slate-700">{ui.textLabel}
          <textarea value={srt} rows={6} spellCheck={false} placeholder={ui.textPlaceholder} disabled={recording} onChange={(event) => { reset(); setTextMessage(''); setSrt(event.target.value.slice(0, MAX_TEXT)); }} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs leading-5 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
        </label>
        {textMessage && <Note>{textMessage}</Note>}
        {srt.trim() && <p className="text-xs text-slate-800">{ui.found.replace('{count}', String(cues.length))}{parsed.skipped > 0 ? ` ${ui.skipped.replace('{count}', String(parsed.skipped))}` : ''}</p>}
        {beyond > 0 && <Note>{ui.beyond.replace('{count}', String(beyond))}</Note>}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.finish}</h2>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.more}</summary>
          <div className="mt-3 space-y-4">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.look}</p>
              <ChoiceButtons label={ui.look} value={options.look} onChange={(value) => change({ look: value as BurnLookId })} options={names(ui.looks)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.position}</p>
              <ChoiceButtons label={ui.position} value={options.position} onChange={(value) => change({ position: value as BurnPositionId })} options={names(ui.positions)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.positionHint}</p></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.textSize}</p>
              <ChoiceButtons label={ui.textSize} value={options.size} onChange={(value) => change({ size: value as BurnSizeId })} options={names(ui.sizes)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.font}</p>
              <ChoiceButtons label={ui.font} value={options.font} onChange={(value) => change({ font: value as FontId })} options={names(ui.fonts)} /></div>
            <label className="block text-xs font-semibold text-slate-700">{ui.shift}
              <input type="number" step={0.1} min={-30} max={30} value={shift} disabled={recording} onChange={(event) => { const v = Number(event.target.value); if (Number.isFinite(v)) { setShift(Math.max(-30, Math.min(30, v))); reset(); } }} className={inputClass} /></label>
            <p className="-mt-2 text-[11px] text-slate-500">{ui.shiftHint}</p>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.pictureSize}</p>
              <ChoiceButtons label={ui.pictureSize} value={String(short)} onChange={(value) => { reset(); setSaved((current) => ({ ...current, short: Number(value) })); }} options={names(ui.pictureSizes)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.pictureSizeHint}</p></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
              <ChoiceButtons label={ui.quality} value={quality} onChange={(value) => { reset(); setSaved((current) => ({ ...current, quality: value as QualityId })); }} options={names(ui.qualities)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.qualityHint}</p></div>
          </div>
        </details>
        {opened && plan && <p className="rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-800">{ui.estimate.replace('{size}', mb(plan.bytes)).replace('{w}', String(size.width)).replace('{h}', String(size.height)).replace('{seconds}', secs(duration))}</p>}
      </section>

      <section className={`${card} space-y-3`}>
        {opened && !canMake && cues.length > 0 && <Note>{ui.noMake}</Note>}
        {opened && cues.length === 0 && <p className="text-xs text-slate-600">{ui.needCaptions}</p>}
        {opened && canMake && !smoothOk && <Note>{ui.slowNote}</Note>}
        {recording && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round(progress * 100)}%` }} /></div><p className="text-xs text-slate-700">{wasSmooth ? ui.keepOpenSmooth.replace('{done}', String(Math.round(progress * 100))).replace('{left}', progress > 0.03 ? String(Math.max(1, Math.round(((performance.now() - started) / 1000) * (1 - progress) / progress))) : '…') : ui.keepOpen}</p></>}
        {recording
          ? <button type="button" onClick={() => abort.current?.abort()} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.cancel}</button>
          : <MainActionButton onClick={() => void makeVideo()} disabled={!canMake || soundBusy}><Video className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
        {message && <Note>{message}</Note>}
        {result && (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-3">
            <video src={result.url} controls playsInline className="mx-auto max-h-[60vh] w-full max-w-md rounded-lg bg-black" />
            <p className="text-xs text-slate-700">{result.extension === 'mp4' ? (wasSmooth ? ui.smoothNote : ui.mp4Note) : ui.webmNote}</p>
            <SaveResult href={result.url} name={result.name} label={ui.ready} saveLabel={ui.saveVideo} detail={formatBytes(result.size)} />
          </div>
        )}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={recording} /></div>
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default SubtitleBurner;
