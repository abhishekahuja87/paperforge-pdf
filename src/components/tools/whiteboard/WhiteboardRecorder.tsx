import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Square, Undo2, Video } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import ui from '../../../locales/packs/whiteboardrec.ui.en.json';
import starters from '../../../locales/packs/whiteboardrec.examples.en.json';
import { Board, BOARD_SIZE, PEN_ROLES, PEN_WIDTH, penColor, sampleStrokes, type BoardId, type PenRole, type ShapeId, type ToolId, type WidthId } from '../../../lib/whiteboard/board';
import { pickRecorderMime, startTake, stopStream, type Take } from '../../../lib/teleprompter/session';
import { buttonClass } from '../../common/styles';

const STORAGE_KEY = 'mdu_whiteboard_rec_v1';
interface Saved { board: BoardId; shape: ShapeId; width: WidthId; voice: boolean }
type StarterId = keyof typeof starters;
const STARTER_IDS = Object.keys(starters) as StarterId[];
const DEFAULTS: Saved = { board: 'white', shape: 'wide', width: 'medium', voice: true };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.board === 'string') return { ...DEFAULTS, ...raw };
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** Draw on a board with your finger or a pen while you talk, and save a video of the drawing with your voice. */
export const WhiteboardRecorder: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { board: look, shape, width, voice } = saved;
  const size = BOARD_SIZE[shape];
  const canvas = useRef<HTMLCanvasElement>(null);
  const board = useMemo(() => new Board(size.width, size.height), [size.width, size.height]);
  const [tool, setTool] = useState<ToolId>('main');
  const [strokes, setStrokes] = useState(0);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState('');
  const output = useResultFile();
  const take = useRef<Take | null>(null);
  const mic = useRef<MediaStream | null>(null);
  const clockStart = useRef(0);
  const clockBase = useRef(0);
  const drawing = useRef(false);
  const choice = useMemo(() => pickRecorderMime(), []);
  const supported = choice !== null && typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype;

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  const repaint = () => { const ctx = canvas.current?.getContext('2d'); if (ctx) board.compose(ctx, look); };
  useEffect(() => { board.setTheme(look); repaint(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, look, shape]);
  useEffect(() => { if (!recording) return undefined; const timer = window.setInterval(repaint, 40); return () => window.clearInterval(timer); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, board, look]);
  useEffect(() => { if (!recording || paused) return undefined; const timer = window.setInterval(() => setSeconds(clockBase.current + (performance.now() - clockStart.current) / 1000), 250); return () => window.clearInterval(timer); }, [recording, paused]);
  useEffect(() => () => { void take.current?.stop(); stopStream(mic.current); }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [((event.clientX - rect.left) / rect.width) * board.width, ((event.clientY - rect.top) / rect.height) * board.height];
  };
  const down = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.button > 0) return;
    event.currentTarget.setPointerCapture(event.pointerId); drawing.current = true; output.clear();
    const [x, y] = point(event); board.begin(tool, PEN_WIDTH[width], x, y); repaint();
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const events = (event.nativeEvent as PointerEvent).getCoalescedEvents?.() ?? [];
    const rect = event.currentTarget.getBoundingClientRect();
    for (const item of events.length > 0 ? events : [event.nativeEvent as PointerEvent]) board.extend(((item.clientX - rect.left) / rect.width) * board.width, ((item.clientY - rect.top) / rect.height) * board.height);
    repaint();
  };
  const up = () => { if (!drawing.current) return; drawing.current = false; board.finish(); setStrokes(board.strokes.length); repaint(); };

  const change = (patch: Partial<Saved>) => { output.clear(); setSaved((current) => ({ ...current, ...patch })); };
  const applyStarter = (id: StarterId) => { const s = starters[id]; const next: Saved = { board: s.board as BoardId, shape: s.shape as ShapeId, width: s.width as WidthId, voice: s.voice }; if (next.shape !== shape) setStrokes(0); change(next); };
  const activeStarter = STARTER_IDS.find((id) => (['board', 'shape', 'width', 'voice'] as const).every((field) => starters[id][field] === saved[field])) ?? '';
  const undo = () => { if (board.undo()) { setStrokes(board.strokes.length); repaint(); } };
  const clear = () => { board.clear(); setStrokes(0); repaint(); };
  const addSample = () => { board.add(sampleStrokes(board.width, board.height)); setStrokes(board.strokes.length); repaint(); };

  const begin = async () => {
    const element = canvas.current; if (!element || !choice) return;
    setMessage(''); output.clear();
    let sound: MediaStream | null = null;
    if (voice) { try { sound = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch { setMessage(ui.denied); return; } }
    mic.current = sound; repaint();
    const picture = element.captureStream(30);
    const mixed = new MediaStream([...picture.getVideoTracks(), ...(sound?.getAudioTracks() ?? [])]);
    take.current = startTake(mixed, choice);
    clockBase.current = 0; clockStart.current = performance.now(); setSeconds(0); setPaused(false); setRecording(true);
  };
  const pause = () => { if (paused) { take.current?.resume(); clockStart.current = performance.now(); setPaused(false); } else { take.current?.pause(); clockBase.current += (performance.now() - clockStart.current) / 1000; setPaused(true); } };
  const stop = async () => {
    const current = take.current; if (!current) return;
    take.current = null; setRecording(false); setPaused(false);
    try {
      const done = await current.stop(); stopStream(mic.current); mic.current = null;
      if (done.seconds < 1.5 || done.blob.size === 0) { setMessage(ui.tooShort); return; }
      output.set(done.blob, generateFileName('whiteboard', done.extension), { detail: `${clock(done.seconds)}, ${formatBytes(done.blob.size)}`, key: done.extension });
    } catch { setMessage(ui.failed); }
  };
  const startAgain = () => { board.clear(); setStrokes(0); setTool('main'); output.clear(); setMessage(''); setSaved(DEFAULTS); repaint(); };

  const dark = look === 'chalk' || look === 'black';
  const swatch = (role: PenRole) => penColor(look, role);
  const aspect = size.width / size.height;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {!supported && <Note>{ui.unsupported}</Note>}
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => applyStarter(value as StarterId)} options={STARTER_IDS.map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? starters[activeStarter].hint : ui.startersHint}</p></div>
        <button type="button" onClick={addSample} disabled={recording} className={buttonClass}>{ui.sample}</button>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.board}</h2>
        <p className="text-[11px] text-slate-500">{ui.boardHint}</p>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={ui.pen}>
          {PEN_ROLES.map((role) => (
            <button key={role} type="button" aria-pressed={tool === role} aria-label={ui.pens[role]} title={ui.pens[role]} onClick={() => setTool(role)}
              className={`h-11 w-11 rounded-full border-2 ${tool === role ? 'border-orange-600 ring-2 ring-orange-200' : dark ? 'border-slate-300' : 'border-slate-200'}`} style={{ background: swatch(role) }} />
          ))}
          <button type="button" aria-pressed={tool === 'eraser'} onClick={() => setTool('eraser')} className={`min-h-11 rounded-xl border px-3 text-xs font-bold ${tool === 'eraser' ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700'}`}>{ui.eraser}</button>
        </div>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.thickness}</p>
          <ChoiceButtons label={ui.thickness} value={width} onChange={(value) => change({ width: value as WidthId })} options={names(ui.widths)} /></div>
        <div className="mx-auto" style={{ width: `min(100%, ${70 * aspect}vh)` }}>
          <canvas ref={canvas} width={size.width} height={size.height} role="img" aria-label={ui.boardLabel} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
            className="block h-auto w-full touch-none rounded-xl border border-slate-300" style={{ aspectRatio: `${size.width} / ${size.height}`, cursor: 'crosshair', touchAction: 'none' }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={undo} disabled={strokes === 0} className={buttonClass}><Undo2 className="h-4 w-4" aria-hidden="true" />{ui.undo}</button>
          <ConfirmButton label={ui.clear} confirmLabel={ui.clearConfirm} onConfirm={clear} disabled={strokes === 0} />
        </div>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
          <div className="mt-3 space-y-3">
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.background}</p>
              <ChoiceButtons label={ui.background} value={look} onChange={(value) => change({ board: value as BoardId })} options={names(ui.boards)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.shape}</p>
              <ChoiceButtons label={ui.shape} value={shape} onChange={(value) => { if (recording || value === shape) return; board.clear(); setStrokes(0); change({ shape: value as ShapeId }); }} options={names(ui.shapes)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.shapeHint}</p></div>
            <Toggle label={ui.voice} hint={ui.voiceHint} checked={voice} onChange={(value) => { if (!recording) change({ voice: value }); }} />
          </div>
        </details>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.record}</h2>
        <p className="text-[11px] text-slate-500">{ui.recordHint}</p>
        {message && <Note>{message}</Note>}
        {recording && <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><span className={`h-2.5 w-2.5 rounded-full bg-red-500 ${paused ? '' : 'animate-pulse'}`} />{paused ? ui.paused : ui.recording} {clock(seconds)}</p>}
        {recording
          ? <div className="space-y-2"><button type="button" onClick={pause} className={`${buttonClass} w-full`}>{paused ? <><Play className="h-4 w-4" aria-hidden="true" />{ui.resume}</> : <><Pause className="h-4 w-4" aria-hidden="true" />{ui.pause}</>}</button>
            <MainActionButton onClick={() => void stop()}><Square className="h-5 w-5" aria-hidden="true" />{ui.stopSave}</MainActionButton></div>
          : <MainActionButton onClick={() => void begin()} disabled={!supported}><Video className="h-5 w-5" aria-hidden="true" />{ui.begin}</MainActionButton>}
        {output.result && (
          <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-3">
            <video src={output.result.url} controls playsInline className="mx-auto max-h-[70vh] w-full max-w-md rounded-lg bg-black" style={{ aspectRatio: `${size.width} / ${size.height}` }} />
            <p className="text-xs text-slate-700">{output.result.key === 'mp4' ? ui.mp4Note : ui.webmNote}</p>
            <SaveResult href={output.result.url} name={output.result.name} label={ui.ready} saveLabel={ui.saveVideo} detail={output.result.detail} />
          </div>
        )}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={recording} /></div>
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default WhiteboardRecorder;
