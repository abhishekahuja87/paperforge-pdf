import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Music, Sparkles, Square } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/voiceclean.ui.en.json';
import starters from '../../../locales/packs/voiceclean.examples.en.json';
import { cleanVoice, encodeWav, recordSmallFile, smallAudioType, type CleanResult, type CleanSettings, type SilenceMode } from '../../../lib/voiceclean/process';
import type { NoiseLevel } from '../../../lib/voiceclean/denoise';
import { canRecordVoice, playVoice, readVoiceFile, startVoiceRecording, type Voice, type VoiceRecorder } from '../../../lib/sequence/voice';

const STORAGE_KEY = 'mdu_voice_clean_v1';
const MAX_SECONDS = 900;
type StarterId = keyof typeof starters;

const DEFAULTS: CleanSettings = { noise: 'medium', rumble: true, level: true, louder: true, silence: 'ends' };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const secs = (value: number) => value.toFixed(1);
const db = (value: number) => `${Math.round(value)} dB`;

function load(): CleanSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<CleanSettings> | null;
    if (raw && typeof raw.noise === 'string') return { ...DEFAULTS, ...raw };
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** A short voice-like sound with hum and hiss and quiet gaps, so the tool can be tried without a recording. */
async function sampleSound(): Promise<Voice> {
  const rate = 44100, seconds = 14; const offline = new OfflineAudioContext(1, rate * seconds, rate);
  const hiss = offline.createBuffer(1, rate * seconds, rate); const data = hiss.getChannelData(0); for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.06;
  const noise = offline.createBufferSource(); noise.buffer = hiss; noise.connect(offline.destination); noise.start();
  const hum = offline.createOscillator(); const humGain = offline.createGain(); hum.frequency.value = 50; humGain.gain.value = 0.035; hum.connect(humGain); humGain.connect(offline.destination); hum.start();
  const words: [number, number, number][] = [[1.6, 0.8, 130], [3, 0.6, 150], [4.3, 1, 120], [7.2, 0.7, 160], [8.6, 0.9, 135], [11, 0.8, 145]];
  for (const [at, length, pitch] of words) {
    const gain = offline.createGain(); gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(0.2, at + 0.06); gain.gain.setValueAtTime(0.2, at + length - 0.1); gain.gain.linearRampToValueAtTime(0, at + length); gain.connect(offline.destination);
    for (let h = 1; h <= 12; h += 1) { const osc = offline.createOscillator(); const part = offline.createGain(); osc.frequency.setValueAtTime(pitch * h, at); osc.frequency.linearRampToValueAtTime(pitch * 1.1 * h, at + length); part.gain.value = 1 / (h * 1.4); osc.connect(part); part.connect(gain); osc.start(at); osc.stop(at + length); }
  }
  const buffer = await offline.startRendering();
  return { buffer, name: ui.sampleName, seconds: buffer.duration };
}

/** Add or record a voice and clean it: less background noise, steadier volume, no silence at the ends. Made on your device. */
export const VoiceCleaner: React.FC = () => {
  const [settings, setSettings] = useState<CleanSettings>(load);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [message, setMessage] = useState('');
  const [recording, setRecording] = useState<VoiceRecorder | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<(CleanResult & { wav: { url: string; size: number } }) | null>(null);
  const [failed, setFailed] = useState('');
  const [playing, setPlaying] = useState<'original' | 'cleaned' | null>(null);
  const [small, setSmall] = useState<{ url: string; name: string; size: number } | null>(null);
  const [smallBusy, setSmallBusy] = useState(false);
  const [smallProgress, setSmallProgress] = useState(0);
  const heard = useRef<{ stop: () => void } | null>(null);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const recordingRef = useRef<VoiceRecorder | null>(null);
  const smallType = useMemo(() => smallAudioType(), []);
  const canRecord = useMemo(() => canRecordVoice(), []);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* storage blocked */ } }, [settings]);
  useEffect(() => () => { abort.current?.abort(); heard.current?.stop(); recordingRef.current?.cancel(); if (endTimer.current) clearTimeout(endTimer.current); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.wav.url); }, [result]);
  useEffect(() => () => { if (small) URL.revokeObjectURL(small.url); }, [small]);
  useEffect(() => { if (!recording) return undefined; const id = setInterval(() => setElapsed(recording.elapsed()), 200); return () => clearInterval(id); }, [recording]);

  const stopPlaying = () => { heard.current?.stop(); heard.current = null; if (endTimer.current) clearTimeout(endTimer.current); setPlaying(null); };
  const play = (which: 'original' | 'cleaned') => {
    stopPlaying();
    const source = which === 'original' ? voice : result ? { buffer: result.buffer, name: 'Cleaned', seconds: result.buffer.duration } : null; if (!source) return;
    heard.current = playVoice(source, 0); setPlaying(which); endTimer.current = setTimeout(() => setPlaying(null), source.seconds * 1000 + 200);
  };
  const reset = () => { stopPlaying(); setResult(null); setSmall(null); setFailed(''); };
  const change = (patch: Partial<CleanSettings>) => { reset(); setSettings((current) => ({ ...current, ...patch })); };
  const useStarter = (id: StarterId) => { const s = starters[id]; change({ noise: s.noise as NoiseLevel, rumble: s.rumble, level: s.level, louder: s.louder, silence: s.silence as SilenceMode }); };
  const activeStarter = (Object.keys(starters) as StarterId[]).find((id) => { const s = starters[id]; return s.noise === settings.noise && s.rumble === settings.rumble && s.level === settings.level && s.louder === settings.louder && s.silence === settings.silence; }) ?? '';

  const take = (next: Voice) => { reset(); if (next.seconds > MAX_SECONDS) { setMessage(ui.tooLong.replace('{max}', String(MAX_SECONDS / 60))); setVoice(null); return; } setMessage(''); setVoice(next); };
  const addFile = async (file: File) => { setMessage(''); try { take(await readVoiceFile(file)); } catch { setMessage(ui.fileFailed); } };
  const addSample = async () => { setMessage(''); try { take(await sampleSound()); } catch { setMessage(ui.fileFailed); } };
  const startRecord = async () => {
    setMessage(''); reset();
    try { const next = await startVoiceRecording(); recordingRef.current = next; setRecording(next); setElapsed(0); } catch { setMessage(ui.micBlocked); }
  };
  const stopRecord = async () => {
    const active = recording; if (!active) return; setRecording(null); recordingRef.current = null;
    try { take(await active.stop()); } catch { setMessage(ui.fileFailed); }
  };

  const clean = async () => {
    if (!voice) return; stopPlaying(); setFailed(''); setResult(null); setSmall(null); setProgress(0); setWorking(true);
    const control = new AbortController(); abort.current = control;
    try {
      const done = await cleanVoice(voice.buffer, settings, setProgress, control.signal);
      if (done) { const blob = encodeWav(done.buffer); setResult({ ...done, wav: { url: URL.createObjectURL(blob), size: blob.size } }); }
    } catch { setFailed(ui.failed); }
    finally { setWorking(false); abort.current = null; }
  };

  const makeSmall = async () => {
    if (!result) return; stopPlaying(); setSmall(null); setSmallProgress(0); setSmallBusy(true);
    const control = new AbortController(); abort.current = control;
    try { const blob = await recordSmallFile(result.buffer, setSmallProgress, control.signal); if (blob && smallType) setSmall({ url: URL.createObjectURL(blob), name: `${fileBase}-clean.${smallType.extension}`, size: blob.size }); }
    catch { setFailed(ui.smallFailed); }
    finally { setSmallBusy(false); abort.current = null; }
  };

  const fileBase = (voice?.name ?? 'voice').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'voice';
  const startAgain = () => { abort.current?.abort(); recordingRef.current?.cancel(); recordingRef.current = null; setRecording(null); setSettings(DEFAULTS); setVoice(null); setMessage(''); reset(); };
  const clearer = result ? Math.round((result.after.voiceDb - result.after.floorDb) - (result.before.voiceDb - result.before.floorDb)) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => useStarter(value as StarterId)} options={(Object.keys(starters) as StarterId[]).map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? starters[activeStarter as StarterId].hint : ui.startersHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.sound}</h2>
        <p className="text-[11px] text-slate-500">{ui.soundHint.replace('{max}', String(MAX_SECONDS / 60))}</p>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 ${working || recording ? 'pointer-events-none opacity-40' : ''}`}><Music className="h-4 w-4" aria-hidden="true" />{voice ? ui.changeAudio : ui.addAudio}
            <input type="file" accept="audio/*,video/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addFile(file); }} /></label>
          {canRecord && (recording
            ? <button type="button" onClick={() => void stopRecord()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 text-sm font-bold text-red-800 hover:bg-red-100"><Square className="h-4 w-4" aria-hidden="true" />{ui.stopRecord.replace('{seconds}', String(Math.floor(elapsed)))}</button>
            : <button type="button" onClick={() => void startRecord()} disabled={working} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40"><Mic className="h-4 w-4" aria-hidden="true" />{ui.record}</button>)}
          <button type="button" onClick={() => void addSample()} disabled={working || !!recording} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{ui.useSample}</button>
        </div>
        {message && <Note>{message}</Note>}
        {voice && <p className="text-xs text-slate-800">{ui.added.replace('{name}', voice.name).replace('{seconds}', secs(voice.seconds)).replace('{channels}', voice.buffer.numberOfChannels === 1 ? ui.mono : ui.stereo)}</p>}
        {voice && <button type="button" onClick={() => (playing === 'original' ? stopPlaying() : play('original'))} disabled={working} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40">{playing === 'original' ? ui.stop : ui.playOriginal}</button>}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.finish}</h2>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.more}</summary>
          <div className="mt-3 space-y-4">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.noise}</p>
              <ChoiceButtons label={ui.noise} value={settings.noise} onChange={(value) => change({ noise: value as NoiseLevel })} options={names(ui.noises)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.noiseHint}</p></div>
            <Toggle label={ui.rumble} checked={settings.rumble} onChange={(value) => change({ rumble: value })} hint={ui.rumbleHint} />
            <Toggle label={ui.level} checked={settings.level} onChange={(value) => change({ level: value })} hint={ui.levelHint} />
            <Toggle label={ui.louder} checked={settings.louder} onChange={(value) => change({ louder: value })} hint={ui.louderHint} />
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.silence}</p>
              <ChoiceButtons label={ui.silence} value={settings.silence} onChange={(value) => change({ silence: value as SilenceMode })} options={names(ui.silences)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.silenceHint}</p></div>
          </div>
        </details>
        <p className="text-[11px] text-slate-500">{ui.tip}</p>
      </section>

      <section className={`${card} space-y-3`}>
        {working && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round(progress * 100)}%` }} /></div><p className="text-xs text-slate-700">{ui.working.replace('{done}', String(Math.round(progress * 100)))}</p></>}
        {working
          ? <button type="button" onClick={() => abort.current?.abort()} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.cancel}</button>
          : <MainActionButton onClick={() => void clean()} disabled={!voice || !!recording}><Sparkles className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
        {failed && <Note>{failed}</Note>}
        {result && (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-3">
            <p className="text-sm font-bold text-slate-900">{ui.ready}</p>
            <ul className="space-y-1 text-xs text-slate-800">
              <li>{ui.noiseResult.replace('{from}', String(Math.round(result.before.voiceDb - result.before.floorDb))).replace('{to}', String(Math.round(result.after.voiceDb - result.after.floorDb)))}</li>
              <li>{ui.lengthResult.replace('{from}', secs(result.before.seconds)).replace('{to}', secs(result.after.seconds))}</li>
              <li>{ui.peakResult.replace('{from}', db(result.before.peakDb)).replace('{to}', db(result.after.peakDb))}</li>
            </ul>
            {clearer < 3 && settings.noise !== 'off' && <Note>{ui.littleChange}</Note>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => (playing === 'original' ? stopPlaying() : play('original'))} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{playing === 'original' ? ui.stop : ui.playOriginal}</button>
              <button type="button" onClick={() => (playing === 'cleaned' ? stopPlaying() : play('cleaned'))} className="min-h-11 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800">{playing === 'cleaned' ? ui.stop : ui.playCleaned}</button>
            </div>
            <p className="text-[11px] text-slate-600">{ui.headphones}</p>
            <SaveResult href={result.wav.url} name={`${fileBase}-clean.wav`} label={ui.wavReady} saveLabel={ui.saveWav} detail={formatBytes(result.wav.size)} />
            <p className="text-[11px] text-slate-600">{ui.wavNote}</p>
            {smallType && (small
              ? <SaveResult href={small.url} name={small.name} label={ui.smallReady} saveLabel={ui.saveSmall} detail={formatBytes(small.size)} />
              : smallBusy
                ? <div className="space-y-1"><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round(smallProgress * 100)}%` }} /></div><p className="text-xs text-slate-700">{ui.smallWorking}</p><button type="button" onClick={() => abort.current?.abort()} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.cancel}</button></div>
                : <div><button type="button" onClick={() => void makeSmall()} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.makeSmall}</button><p className="mt-1 text-[11px] text-slate-600">{ui.smallNote}</p></div>)}
          </div>
        )}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={working} /></div>
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default VoiceCleaner;
