import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Monitor, Pause, Play, Square } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/screenrec.ui.en.json';
import starters from '../../../locales/packs/screenrec.examples.en.json';
import { prepareSession, screenRecordingSupported, StartError, type BubbleShapeId, type BubbleSizeId, type CornerId, type Session, type SessionOptions } from '../../../lib/screenrec/session';

const STORAGE_KEY = 'mdu_screen_rec_v1';
type StarterId = keyof typeof starters;
type Phase = 'idle' | 'preparing' | 'countdown' | 'recording' | 'paused' | 'saving';
interface Saved extends SessionOptions { countdown: boolean }

const DEFAULTS: Saved = { bubble: { show: true, corner: 'bl', size: 'medium', shape: 'circle', mirror: true }, mic: true, systemSound: false, quality: 1080, countdown: true };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && raw.bubble) return { ...DEFAULTS, ...raw, bubble: { ...DEFAULTS.bubble, ...raw.bubble } };
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** Record your screen with your face in a small bubble and your voice. Made on your device. */
export const ScreenRecorder: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { bubble, mic, systemSound, quality, countdown } = saved;
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; size: number; seconds: number; extension: string } | null>(null);
  const session = useRef<Session | null>(null);
  const view = useRef<HTMLDivElement>(null);
  const supported = useMemo(() => screenRecordingSupported(), []);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { session.current?.cancel(); }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => { if (phase !== 'recording' && phase !== 'paused') return undefined; const id = setInterval(() => setElapsed(session.current?.elapsed() ?? 0), 250); return () => clearInterval(id); }, [phase]);

  const setOptions = (patch: Partial<Saved>) => setSaved((current) => ({ ...current, ...patch }));
  const setBubble = (patch: Partial<Saved['bubble']>) => setSaved((current) => ({ ...current, bubble: { ...current.bubble, ...patch } }));
  const applyStarter = (id: StarterId) => { const s = starters[id]; setSaved((current) => ({ ...current, bubble: { ...current.bubble, show: s.show, corner: s.corner as CornerId, size: s.size as BubbleSizeId, shape: s.shape as BubbleShapeId }, mic: s.mic })); };
  const activeStarter = (Object.keys(starters) as StarterId[]).find((id) => { const s = starters[id]; return s.show === bubble.show && s.corner === bubble.corner && s.size === bubble.size && s.shape === bubble.shape && s.mic === mic; }) ?? '';

  const attachCanvas = (next: Session) => { const host = view.current; if (!host) return; host.innerHTML = ''; next.canvas.className = 'block h-auto w-full'; host.appendChild(next.canvas); };

  const finish = async () => {
    const active = session.current; if (!active) return; setPhase('saving');
    try { const done = await active.finish(); session.current = null; if (view.current) view.current.innerHTML = ''; setResult({ url: URL.createObjectURL(done.blob), name: `screen-recording.${done.extension}`, size: done.blob.size, seconds: done.seconds, extension: done.extension }); }
    catch { setMessage(ui.failed); }
    finally { session.current = null; setPhase('idle'); }
  };

  const start = async () => {
    setMessage(''); setResult(null); setPhase('preparing');
    try {
      const next = await prepareSession({ bubble, mic, systemSound, quality }); session.current = next; attachCanvas(next); next.onShareEnded(() => { void finish(); });
      if (countdown) { setPhase('countdown'); for (let n = 3; n >= 1; n -= 1) { setCount(n); await new Promise<void>((resolve) => setTimeout(resolve, 1000)); if (session.current !== next) return; } }
      next.begin(); setElapsed(0); setPhase('recording');
    } catch (error) {
      session.current?.cancel(); session.current = null; setPhase('idle');
      const reason = error instanceof StartError ? error.reason : 'screen';
      setMessage(reason === 'camera' ? ui.cameraBlocked : reason === 'mic' ? ui.micBlocked : reason === 'unsupported' ? ui.unsupported : ui.screenBlocked);
    }
  };

  const cancel = () => { session.current?.cancel(); session.current = null; if (view.current) view.current.innerHTML = ''; setPhase('idle'); };
  const startAgain = () => { cancel(); setSaved(DEFAULTS); setResult(null); setMessage(''); };
  const busy = phase !== 'idle';

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {!supported && <Note>{ui.unsupported}</Note>}
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => applyStarter(value as StarterId)} options={(Object.keys(starters) as StarterId[]).map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? starters[activeStarter as StarterId].hint : ui.startersHint}</p></div>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.options}</h2>
        <Toggle label={ui.mic} checked={mic} onChange={(value) => setOptions({ mic: value })} hint={ui.micHint} />
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.more}</summary>
          <div className="mt-3 space-y-4">
            <Toggle label={ui.face} checked={bubble.show} onChange={(value) => setBubble({ show: value })} hint={ui.faceHint} />
            {bubble.show && <>
              <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.corner}</p>
                <ChoiceButtons label={ui.corner} value={bubble.corner} onChange={(value) => setBubble({ corner: value as CornerId })} options={names(ui.corners)} /></div>
              <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.bubbleSize}</p>
                <ChoiceButtons label={ui.bubbleSize} value={bubble.size} onChange={(value) => setBubble({ size: value as BubbleSizeId })} options={names(ui.sizes)} /></div>
              <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.shape}</p>
                <ChoiceButtons label={ui.shape} value={bubble.shape} onChange={(value) => setBubble({ shape: value as BubbleShapeId })} options={names(ui.shapes)} /></div>
              <Toggle label={ui.mirror} checked={bubble.mirror} onChange={(value) => setBubble({ mirror: value })} hint={ui.mirrorHint} />
            </>}
            <Toggle label={ui.systemSound} checked={systemSound} onChange={(value) => setOptions({ systemSound: value })} hint={ui.systemSoundHint} />
            <Toggle label={ui.countdown} checked={countdown} onChange={(value) => setOptions({ countdown: value })} />
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.quality}</p>
              <ChoiceButtons label={ui.quality} value={String(quality)} onChange={(value) => setOptions({ quality: value === '720' ? 720 : 1080 })} options={names(ui.qualities)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.qualityHint}</p></div>
          </div>
        </details>
        <p className="text-[11px] text-slate-500">{ui.howItWorks}</p>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.record}</h2>
        <div ref={view} className={`mx-auto max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-slate-900 ${busy ? '' : 'hidden'}`} />
        {phase === 'countdown' && <p className="text-center text-4xl font-bold text-orange-700" role="status" aria-live="polite">{count}</p>}
        {phase === 'countdown' && <p className="text-center text-xs text-slate-700">{ui.countdownHint}</p>}
        {(phase === 'recording' || phase === 'paused') && <p className="text-center text-sm font-bold text-slate-900" role="timer">{phase === 'paused' ? ui.paused : ui.recording} {clock(elapsed)}</p>}
        {phase === 'idle' && <button type="button" onClick={() => void start()} disabled={!supported} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-40"><Monitor className="h-5 w-5" aria-hidden="true" />{ui.startRecording}</button>}
        {phase === 'preparing' && <p className="text-center text-xs text-slate-700">{ui.preparing}</p>}
        {(phase === 'recording' || phase === 'paused') && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void finish()} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800"><Square className="h-4 w-4" aria-hidden="true" />{ui.stop}</button>
            {phase === 'recording'
              ? <button type="button" onClick={() => { session.current?.pause(); setPhase('paused'); }} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50"><Pause className="h-4 w-4" aria-hidden="true" />{ui.pause}</button>
              : <button type="button" onClick={() => { session.current?.resume(); setPhase('recording'); }} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50"><Play className="h-4 w-4" aria-hidden="true" />{ui.resume}</button>}
          </div>
        )}
        {(phase === 'countdown' || phase === 'preparing') && <button type="button" onClick={cancel} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.cancel}</button>}
        {(phase === 'recording' || phase === 'paused') && <p className="text-[11px] text-slate-500">{ui.whileRecording}</p>}
        {phase === 'saving' && <p className="text-center text-xs text-slate-700">{ui.saving}</p>}
        {message && <Note>{message}</Note>}
        {result && (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-3">
            <video src={result.url} controls playsInline className="mx-auto max-h-[60vh] w-full max-w-xl rounded-lg bg-black" />
            <SaveResult href={result.url} name={result.name} label={ui.ready.replace('{time}', clock(result.seconds))} saveLabel={ui.saveVideo} detail={formatBytes(result.size)} />
            <p className="text-[11px] text-slate-600">{result.extension === 'mp4' ? ui.mp4Note : ui.webmNote}</p>
            <p className="text-[11px] text-slate-600">{ui.nextStep}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={busy} /></div>
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default ScreenRecorder;
