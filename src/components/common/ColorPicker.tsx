import React, { useRef, useState } from 'react';
import { Pipette } from 'lucide-react';
import { useDialog } from '../../lib/useDialog';
import { parseHex, toHex } from '../../lib/utilities/dev';
import { SWATCHES, hsvToHex, hsvToRgb, readRecentColors, rememberColor, rgbToHsv, type Hsv } from '../../lib/color/picker';

interface EyeDropperLike { open: () => Promise<{ sRGBHex: string }> }
const eyeDropper = (): EyeDropperLike | null => {
  const ctor = (window as unknown as { EyeDropper?: new () => EyeDropperLike }).EyeDropper;
  return ctor ? new ctor() : null;
};

const toHsv = (hex: string): Hsv => { const rgb = parseHex(hex); return rgb ? rgbToHsv(rgb) : { h: 0, s: 0, v: 0 }; };

const PickerDialog: React.FC<{ value: string; title: string; onChange: (hex: string) => void; onClose: () => void }> = ({ value, title, onChange, onClose }) => {
  const original = useRef(value);
  const [hsv, setHsv] = useState<Hsv>(() => toHsv(value));
  const [typed, setTyped] = useState(value);
  const [recent] = useState(readRecentColors);
  const area = useRef<HTMLDivElement>(null);
  const cancel = () => { onChange(original.current); onClose(); };
  const dialogRef = useDialog<HTMLDivElement>(cancel);
  const hex = hsvToHex(hsv);
  const rgb = hsvToRgb(hsv);

  const apply = (next: Hsv) => { setHsv(next); const nextHex = hsvToHex(next); setTyped(nextHex); onChange(nextHex); };
  const applyHex = (nextHex: string, keepTyped = false) => { const parsed = parseHex(nextHex); if (!parsed) return; const next = rgbToHsv(parsed); setHsv(next); if (!keepTyped) setTyped(toHex(parsed)); onChange(toHex(parsed)); };
  const fromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = area.current?.getBoundingClientRect();
    if (!box) return;
    apply({ h: hsv.h, s: Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)), v: 1 - Math.min(1, Math.max(0, (event.clientY - box.top) / box.height)) });
  };
  const onKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.02;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    apply({ h: hsv.h, s: Math.min(1, Math.max(0, hsv.s + move[0])), v: Math.min(1, Math.max(0, hsv.v + move[1])) });
  };
  const pick = async () => { try { const result = await eyeDropper()?.open(); if (result) applyHex(result.sRGBHex); } catch { /* cancelled */ } };
  const done = () => { rememberColor(hex); onClose(); };
  const hasDropper = eyeDropper() !== null;
  const small = 'w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm';

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 p-3 sm:items-center" role="presentation">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <div
          ref={area}
          role="slider"
          tabIndex={0}
          aria-label="Saturation and brightness. Use the arrow keys."
          aria-valuetext={`Saturation ${Math.round(hsv.s * 100)} percent, brightness ${Math.round(hsv.v * 100)} percent`}
          aria-valuenow={Math.round(hsv.s * 100)}
          onKeyDown={onKey}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); fromPointer(event); }}
          onPointerMove={(event) => { if (event.buttons === 1) fromPointer(event); }}
          className="relative mt-3 h-44 w-full cursor-crosshair touch-none rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
          style={{ backgroundColor: hsvToHex({ h: hsv.h, s: 1, v: 1 }), backgroundImage: 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)' }}
        >
          <span className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hex }} />
        </div>
        <label className="mt-3 block text-[11px] font-semibold text-slate-600">Shade
          <input
            type="range" min={0} max={360} value={Math.round(hsv.h)} onChange={(event) => apply({ ...hsv, h: Number(event.target.value) })}
            className="mt-1 h-3 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-slate-700 [&::-webkit-slider-thumb]:shadow"
            style={{ backgroundImage: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
          />
        </label>
        <div className="mt-3 flex items-end gap-2">
          <span className="h-10 w-10 shrink-0 rounded-lg border border-slate-300" style={{ backgroundColor: hex }} aria-hidden="true" />
          <label className="min-w-0 flex-1 text-[11px] font-semibold text-slate-600">Hex code
            <input value={typed} onChange={(event) => { setTyped(event.target.value); if (/^#?[0-9a-f]{6}$/i.test(event.target.value.trim())) applyHex(event.target.value.trim(), true); }} className={`${small} mt-1 font-mono`} spellCheck={false} />
          </label>
          {hasDropper && <button type="button" onClick={() => void pick()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Pipette className="h-4 w-4" aria-hidden="true" />Pick from screen</button>}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(['r', 'g', 'b'] as const).map((key) => (
            <label key={key} className="text-[11px] font-semibold uppercase text-slate-600">{key}
              <input type="number" min={0} max={255} value={rgb[key]} onChange={(event) => applyHex(toHex({ ...rgb, [key]: Math.max(0, Math.min(255, Number(event.target.value) || 0)) }))} className={`${small} mt-1`} />
            </label>
          ))}
        </div>
        {recent.length > 0 && (
          <div className="mt-3">
            <p className="text-[11px] font-semibold text-slate-600">Recently used</p>
            <div className="mt-1 flex flex-wrap gap-1.5">{recent.map((item) => <button key={item} type="button" aria-label={`Use ${item}`} title={item} onClick={() => applyHex(item)} className="h-8 w-8 rounded-md border border-slate-300" style={{ backgroundColor: item }} />)}</div>
          </div>
        )}
        <div className="mt-3">
          <p className="text-[11px] font-semibold text-slate-600">Ready colours</p>
          <div className="mt-1 grid grid-cols-6 gap-1.5">{SWATCHES.map((item) => <button key={item} type="button" aria-label={`Use ${item}`} title={item} onClick={() => applyHex(item)} className="h-8 rounded-md border border-slate-300" style={{ backgroundColor: item }} />)}</div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={cancel} className="min-h-11 flex-1 rounded-xl bg-stone-100 px-4 text-sm font-bold text-stone-700 hover:bg-stone-200">Cancel</button>
          <button type="button" onClick={done} className="min-h-11 flex-1 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800">Done</button>
        </div>
      </div>
    </div>
  );
};

interface ColorFieldProps {
  /** Colour as #rrggbb. */
  value: string;
  onChange: (hex: string) => void;
  /** What the colour is for, for example "Background colour". Read out to screen readers and shown as the box title. */
  label: string;
  /** Size and shape of the colour box. */
  className?: string;
  disabled?: boolean;
}

/** The one colour picker for the whole site: a colour box that opens a picker with a colour area, shade slider, hex and RGB boxes, ready and recent colours and, where the browser allows, an eyedropper. */
export const ColorField: React.FC<ColorFieldProps> = ({ value, onChange, label, className = 'h-10 w-14', disabled = false }) => {
  const [open, setOpen] = useState(false);
  const safe = parseHex(value) ? toHex(parseHex(value)!) : '#000000';
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={`${label}: ${safe}. Change`}
        title={`${label}: ${safe}`}
        onClick={() => setOpen(true)}
        className={`${className} shrink-0 cursor-pointer rounded-lg border border-slate-300 p-1 shadow-sm outline-none transition hover:border-orange-400 focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span className="block h-full w-full rounded-md" style={{ backgroundColor: safe }} />
      </button>
      {open && <PickerDialog value={safe} title={label} onChange={onChange} onClose={() => setOpen(false)} />}
    </>
  );
};

export default ColorField;
