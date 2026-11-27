import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Undo2 } from 'lucide-react';
import { ChoiceButtons, fieldClass } from '../../common/FieldKit';
import { Slider } from '../../common/PanelKit';
import { trimToPng } from '../../../lib/images/canvas';
import type { Logo } from '../../../lib/paper/image';

type Stroke = { color: string; width: number; points: [number, number][] };

const W = 900;
const H = 320;
const INKS = [{ value: '#111111', label: 'Black' }, { value: '#1d3fa8', label: 'Blue' }, { value: '#7a1f1f', label: 'Dark red' }, { value: '#14532d', label: 'Green' }];
const FACES = [
  { value: '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive', label: 'Script' },
  { value: 'italic Georgia, "Times New Roman", serif', label: 'Italic serif' },
  { value: '"Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive', label: 'Handwriting' },
];

/** Draw a signature with a finger or mouse, or type one. The result is a see-through PNG trimmed to the ink. */
export const SignaturePad: React.FC<{ onChange: (sig: Logo | null) => void }> = ({ onChange }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<Stroke | null>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [ink, setInk] = useState('#111111');
  const [thickness, setThickness] = useState(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [typed, setTyped] = useState('');
  const [face, setFace] = useState(FACES[0]!.value);

  const paint = useCallback((list: Stroke[], live?: Stroke | null) => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const s of live ? [...list, live] : list) {
      ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = s.width;
      const [first, ...rest] = s.points;
      if (!first) continue;
      if (rest.length === 0) { ctx.beginPath(); ctx.arc(first[0], first[1], s.width / 2, 0, Math.PI * 2); ctx.fill(); continue; }
      ctx.beginPath(); ctx.moveTo(first[0], first[1]);
      rest.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.stroke();
    }
  }, []);

  const publish = useCallback(() => {
    const el = canvas.current;
    onChange(el ? trimToPng(el) : null);
  }, [onChange]);

  useEffect(() => {
    if (mode === 'draw') { paint(strokes); publish(); return; }
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (typed.trim()) {
      let size = 150;
      ctx.fillStyle = ink; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      ctx.font = `${size}px ${face}`;
      while (size > 30 && ctx.measureText(typed).width > W - 60) { size -= 6; ctx.font = `${size}px ${face}`; }
      ctx.fillText(typed.trim(), W / 2, H / 2);
    }
    publish();
  }, [mode, strokes, typed, face, ink, paint, publish]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [((event.clientX - rect.left) / rect.width) * W, ((event.clientY - rect.top) / rect.height) * H];
  };

  return (
    <div className="space-y-3">
      <ChoiceButtons label="How" value={mode} onChange={(v) => setMode(v as 'draw' | 'type')} options={[{ value: 'draw', label: 'Draw it' }, { value: 'type', label: 'Type it' }]} />
      <div className="relative rounded-xl border border-dashed border-slate-300 bg-white">
        <canvas
          ref={canvas} width={W} height={H} aria-label={mode === 'draw' ? 'Signature drawing area' : 'Typed signature preview'}
          className="block w-full touch-none rounded-xl"
          style={{ aspectRatio: `${W} / ${H}`, cursor: mode === 'draw' ? 'crosshair' : 'default' }}
          onPointerDown={(event) => {
            if (mode !== 'draw') return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drawing.current = { color: ink, width: thickness * 2, points: [point(event)] };
            paint(strokes, drawing.current);
          }}
          onPointerMove={(event) => {
            if (!drawing.current) return;
            drawing.current.points.push(point(event));
            paint(strokes, drawing.current);
          }}
          onPointerUp={() => { const s = drawing.current; drawing.current = null; if (s) setStrokes((all) => [...all, s]); }}
          onPointerCancel={() => { drawing.current = null; paint(strokes); }}
        />
        {mode === 'draw' && strokes.length === 0 && <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-400">Sign here with your finger or mouse</p>}
      </div>
      {mode === 'draw' ? (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={strokes.length === 0} onClick={() => setStrokes((all) => all.slice(0, -1))} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 disabled:opacity-40"><Undo2 className="h-4 w-4" aria-hidden="true" />Undo</button>
          <button type="button" disabled={strokes.length === 0} onClick={() => setStrokes([])} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 disabled:opacity-40"><Eraser className="h-4 w-4" aria-hidden="true" />Clear</button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Your name
            <input type="text" maxLength={40} value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Asha Verma" className={fieldClass} />
          </label>
          <ChoiceButtons label="Style" value={face} onChange={setFace} options={FACES} />
          <p className="text-[11px] text-slate-500">Typed styles use the fonts on your device, so they can look a little different on another phone or computer.</p>
        </div>
      )}
      <ChoiceButtons label="Ink" value={ink} onChange={(value) => { setInk(value); setStrokes((all) => all.map((s) => ({ ...s, color: value }))); }} options={INKS} />
      {mode === 'draw' && <Slider label="Pen thickness" value={thickness} min={1} max={8} step={1} unit="" onChange={setThickness} />}
    </div>
  );
};

