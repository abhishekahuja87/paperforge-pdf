import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Scissors, Video } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/videocompress.ui.en.json';
import starters from '../../../locales/packs/videocompress.examples.en.json';
import { fitSize, openVideo, planBitrate, readVideoSound, type OpenedVideo, type QualityId } from '../../../lib/videoedit/source';
import { canWriteSmooth, renderVideo } from '../../../lib/videoedit/render';
import type { Voice } from '../../../lib/sequence/voice';
import { canEncodeAac } from '../../../lib/globe/audio';
import { canEncodeOffline } from '../../../lib/globe/encode';
import { recordSupport } from '../../../lib/globe/record';
import { inputClass } from '../../common/styles';

const STORAGE_KEY = 'mdu_video_compress_v1';
const MAX_FILE_MB = 1000;
const MAX_SECONDS = 600;
interface Saved { limitMb: number; short: number; fps: 30 | 24 | 15; quality: QualityId; sound: boolean }
type StarterId = keyof typeof starters;

const DEFAULTS: Saved = { limitMb: 15, short: 720, fps: 30, quality: 'medium', sound: true };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const secs = (value: number) => value.toFixed(1);
const mb = (bytes: number) => `${(bytes / 1048576).toFixed(bytes < 10485760 ? 1 : 0)} MB`;

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.short === 'number') return { ...DEFAULTS, ...raw } as Saved;
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** Pick a video, choose the part to keep and how small it should be, and save a new video. Made on your device. */
export const VideoCompressor: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { limitMb, short, fps, quality, sound } = saved;
  const [file, setFile] = useState<File | null>(null);
  const [opened, setOpened] = useState<OpenedVideo | null>(null);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [soundBusy, setSoundBusy] = useState(false);
  const [fileMessage, setFileMessage] = useState('');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(0);
  const [wasSmooth, setWasSmooth] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; size: number; extension: string } | null>(null);
  const [encoder, setEncoder] = useState<{ ok: boolean; codec: string }>({ ok: false, codec: '' });
  const [aac, setAac] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const abort = useRef<AbortController | null>(null);
  const live = useRef<OpenedVideo | null>(null);
  const supportWithSound = useMemo(() => recordSupport(true), []);
  const support = useMemo(() => recordSupport(false), []);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { abort.current?.abort(); live.current?.release(); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => { let on = true; void canEncodeAac().then((ok) => { if (on) setAac(ok); }); return () => { on = false; }; }, []);

  const start = Math.max(0, Math.min(trimStart, (opened?.duration ?? 0) - 0.5));
  const endAt = opened ? Math.min(opened.duration, trimEnd > start + 0.5 ? trimEnd : opened.duration, start + MAX_SECONDS) : 0;
  const duration = opened ? Math.max(0.5, endAt - start) : 0;
  const size = useMemo(() => (opened ? fitSize(opened.width, opened.height, short) : { width: 0, height: 0 }), [opened, short]);
  const useSound = sound && !!voice;
  const plan = useMemo(() => (opened ? planBitrate(size.width, size.height, fps, duration, quality, limitMb, useSound) : null), [opened, size, fps, duration, quality, limitMb, useSound]);

  useEffect(() => {
    if (!opened) return undefined;
    let on = true;
    void canEncodeOffline(size.width, size.height, fps).then((found) => { if (on) setEncoder(found); });
    return () => { on = false; };
  }, [opened, size.width, size.height, fps]);

  const reset = () => { setResult(null); setMessage(''); };
  const change = (patch: Partial<Saved>) => { reset(); setSaved((current) => ({ ...current, ...patch })); };
  const useStarter = (id: StarterId) => { const s = starters[id]; change({ limitMb: s.limitMb, short: s.short, fps: s.fps as 30 | 24 | 15, quality: s.quality as QualityId }); };
  const activeStarter = (Object.keys(starters) as StarterId[]).find((id) => { const s = starters[id]; return s.limitMb === limitMb && s.short === short && s.fps === fps && s.quality === quality; }) ?? '';

  const addFile = async (picked: File) => {
    setFileMessage(''); reset();
    if (picked.size > MAX_FILE_MB * 1048576) { setFileMessage(ui.tooBig.replace('{max}', String(MAX_FILE_MB))); return; }
    try {
      const next = await openVideo(picked);
      live.current?.release(); live.current = next;
      setFile(picked); setOpened(next); setVoice(null); setTrimStart(0); setTrimEnd(0);
      setSoundBusy(true);
      void readVideoSound(picked).then((found) => {
        if (live.current !== next) return;
        setVoice(found); setSoundBusy(false);
        if (!found) setFileMessage(ui.noSoundFound);
      });
    } catch { setFileMessage(ui.fileFailed); }
  };

  const grab = (which: 'start' | 'end') => {
    const at = player.current?.currentTime ?? 0; reset();
    if (which === 'start') { setTrimStart(Math.max(0, at)); if (trimEnd > 0 && trimEnd <= at + 0.5) setTrimEnd(0); } else setTrimEnd(Math.max(0, at));
  };

  const smoothOk = !!opened && canWriteSmooth({ encoder, aac, sound: useSound ? voice : null });
  const canMake = !!opened && !!plan && (smoothOk || (useSound ? supportWithSound.ok : support.ok));
  const fileBase = (file?.name ?? 'video').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'video';

  const makeVideo = async () => {
    if (!opened || !plan) return;
    setMessage(''); setResult(null); setProgress(0); setStarted(performance.now()); setWasSmooth(smoothOk); setRecording(true); player.current?.pause();
    const control = new AbortController(); abort.current = control;
    let lock: { release: () => Promise<void> } | null = null;
    try { lock = await (navigator as unknown as { wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* not allowed: carry on */ }
    try {
      const done = await renderVideo({ opened, start, duration, width: size.width, height: size.height, fps, bitrate: plan.bitrate, sound: useSound ? voice : null, encoder, aac, onProgress: setProgress, signal: control.signal });
      if (done) setResult({ url: URL.createObjectURL(done.blob), name: `${fileBase}-smaller.${done.extension}`, size: done.blob.size, extension: done.extension });
    } catch { setMessage(ui.failed); }
    finally { void lock?.release().catch(() => undefined); setRecording(false); abort.current = null; }
  };

  const startAgain = () => { abort.current?.abort(); live.current?.release(); live.current = null; setSaved(DEFAULTS); setFile(null); setOpened(null); setVoice(null); setTrimStart(0); setTrimEnd(0); setFileMessage(''); reset(); };
  const trimmed = !!opened && (start > 0.05 || endAt < opened.duration - 0.05);
  const longVideo = !!opened && opened.duration - start > MAX_SECONDS;
  const shrunk = result && file ? 1 - result.size / file.size : 0;

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
            <video ref={player} src={opened.url} controls playsInline preload="metadata" className="mx-auto max-h-[60vh] w-full max-w-md rounded-lg bg-black" aria-label={ui.previewLabel} />
            <p className="text-xs text-slate-800">{ui.info.replace('{name}', file.name).replace('{size}', formatBytes(file.size)).replace('{w}', String(opened.width)).replace('{h}', String(opened.height)).replace('{seconds}', secs(opened.duration))}</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-800"><Scissors className="h-4 w-4" aria-hidden="true" />{ui.trim}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => grab('start')} disabled={recording} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.startHere}</button>
                <button type="button" onClick={() => grab('end')} disabled={recording} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.endHere}</button>
                {trimmed && <button type="button" onClick={() => { setTrimStart(0); setTrimEnd(0); reset(); }} disabled={recording} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.keepAll}</button>}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-slate-700">{ui.trimStart}
                  <input type="number" min={0} max={Math.max(0, opened.duration - 1)} step={0.5} value={Math.round(start * 10) / 10} disabled={recording} onChange={(event) => { const v = Number(event.target.value); if (Number.isFinite(v)) { setTrimStart(Math.max(0, v)); reset(); } }} className={inputClass} /></label>
                <label className="block text-xs font-semibold text-slate-700">{ui.trimEnd}
                  <input type="number" min={0} max={opened.duration} step={0.5} value={Math.round(endAt * 10) / 10} disabled={recording} onChange={(event) => { const v = Number(event.target.value); if (Number.isFinite(v)) { setTrimEnd(Math.max(0, v)); reset(); } }} className={inputClass} /></label>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{ui.trimHint.replace('{seconds}', secs(duration))}</p>
              {longVideo && <Note>{ui.tooLong.replace('{max}', String(MAX_SECONDS / 60))}</Note>}
            </div>
            {soundBusy && <p className="text-xs text-slate-600">{ui.readingSound}</p>}
          </>
        )}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.finish}</h2>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.more}</summary>
          <div className="mt-3 space-y-4">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.limit}</p>
              <ChoiceButtons label={ui.limit} value={String(limitMb)} onChange={(value) => change({ limitMb: Number(value) })} options={names(ui.limits)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.limitHint}</p></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.pictureSize}</p>
              <ChoiceButtons label={ui.pictureSize} value={String(short)} onChange={(value) => change({ short: Number(value) })} options={names(ui.sizes)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.sizeHint}</p></div>
            {limitMb === 0 && <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
              <ChoiceButtons label={ui.quality} value={quality} onChange={(value) => change({ quality: value as QualityId })} options={names(ui.qualities)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.qualityHint}</p></div>}
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.smooth}</p>
              <ChoiceButtons label={ui.smooth} value={String(fps)} onChange={(value) => change({ fps: Number(value) as 30 | 24 | 15 })} options={names(ui.rates)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.smoothHint}</p></div>
            <Toggle label={ui.keepSound} checked={sound} onChange={(value) => change({ sound: value })} hint={ui.keepSoundHint} />
          </div>
        </details>
        {opened && plan && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800">
            <p className="font-semibold">{ui.estimate.replace('{size}', mb(plan.bytes)).replace('{w}', String(size.width)).replace('{h}', String(size.height)).replace('{fps}', String(fps)).replace('{seconds}', secs(duration))}</p>
            {plan.tooSmall && <p className="mt-1 text-amber-800">{ui.tooSmall}</p>}
            {file && plan.bytes > file.size * 0.98 && !trimmed && <p className="mt-1 text-amber-800">{ui.alreadySmall}</p>}
            {useSound === false && sound && !soundBusy && !voice && <p className="mt-1 text-slate-600">{ui.silent}</p>}
          </div>
        )}
      </section>

      <section className={`${card} space-y-3`}>
        {opened && !canMake && <Note>{ui.noMake}</Note>}
        {opened && canMake && !smoothOk && <Note>{ui.slowNote}</Note>}
        {recording && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round(progress * 100)}%` }} /></div><p className="text-xs text-slate-700">{wasSmooth ? ui.keepOpenSmooth.replace('{done}', String(Math.round(progress * 100))).replace('{left}', progress > 0.03 ? String(Math.max(1, Math.round(((performance.now() - started) / 1000) * (1 - progress) / progress))) : '…') : ui.keepOpen}</p></>}
        {recording
          ? <button type="button" onClick={() => abort.current?.abort()} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.cancel}</button>
          : <MainActionButton onClick={() => void makeVideo()} disabled={!canMake || soundBusy}><Video className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
        {message && <Note>{message}</Note>}
        {result && file && (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-3">
            <video src={result.url} controls playsInline className="mx-auto max-h-[60vh] w-full max-w-md rounded-lg bg-black" />
            <p className="text-xs font-semibold text-slate-800">{shrunk > 0 ? ui.smaller.replace('{from}', mb(file.size)).replace('{to}', mb(result.size)).replace('{percent}', String(Math.round(shrunk * 100))) : ui.notSmaller.replace('{from}', mb(file.size)).replace('{to}', mb(result.size))}</p>
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

export default VideoCompressor;
