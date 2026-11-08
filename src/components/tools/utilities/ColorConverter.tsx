import React, { useMemo, useState } from 'react';
import { calcCard } from '../../finance/ui';
import { CopyButton, fieldClass } from './common';
import { contrastRatio, hslToRgb, parseHex, rgbToHsl, toHex, type Rgb } from '../../../lib/utilities/dev';

const Result: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
    <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="truncate font-mono text-sm font-bold text-slate-900">{value}</p></div>
    <CopyButton text={value} label="Copy" />
  </div>
);

const Verdict: React.FC<{ label: string; pass: boolean }> = ({ label, pass }) => (
  <li className={`rounded-md px-2 py-1 text-[11px] font-semibold ${pass ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{label}: {pass ? 'Pass' : 'Fail'}</li>
);

export const ColorConverter: React.FC = () => {
  const [hex, setHex] = useState('#ea580c');
  const [background, setBackground] = useState('#ffffff');
  const rgb = useMemo(() => parseHex(hex), [hex]);
  const bg = useMemo(() => parseHex(background), [background]);
  const hsl = rgb ? rgbToHsl(rgb) : null;
  const ratio = rgb && bg ? contrastRatio(rgb, bg) : null;

  const setRgbPart = (key: keyof Rgb, value: string) => {
    if (!rgb) return;
    setHex(toHex({ ...rgb, [key]: Math.max(0, Math.min(255, Number(value) || 0)) }));
  };
  const setHslPart = (key: 'h' | 's' | 'l', value: string) => {
    if (!hsl) return;
    const next = { ...hsl, [key]: Number(value) || 0 };
    setHex(toHex(hslToRgb(Math.max(0, Math.min(360, next.h)), Math.max(0, Math.min(100, next.s)), Math.max(0, Math.min(100, next.l)))));
  };
  const num = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm';

  return (
    <section className={calcCard}>
      <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-[auto_1fr]">
        <label className="block text-xs font-semibold text-slate-700">Pick a colour<input type="color" value={rgb ? toHex(rgb) : '#000000'} onChange={(event) => setHex(event.target.value)} className="mt-1.5 block h-12 w-20 cursor-pointer rounded border border-slate-200 bg-white p-1" /></label>
        <label className="block text-xs font-semibold text-slate-700">HEX code
          <input value={hex} onChange={(event) => setHex(event.target.value)} className={`${fieldClass} font-mono`} aria-invalid={!rgb} />
          {!rgb && <span className="mt-1 block font-normal text-red-700" role="alert">Enter a 3 or 6 digit hex code such as #ea580c.</span>}
        </label>
      </div>
      {rgb && hsl && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <fieldset className="rounded-xl border border-slate-200 p-3"><legend className="px-1 text-xs font-bold text-slate-700">RGB</legend>
              <div className="grid grid-cols-3 gap-2">
                {(['r', 'g', 'b'] as const).map((key) => <label key={key} className="block text-[11px] font-semibold uppercase text-slate-600">{key}<input type="number" min={0} max={255} value={rgb[key]} onChange={(event) => setRgbPart(key, event.target.value)} className={num} /></label>)}
              </div>
            </fieldset>
            <fieldset className="rounded-xl border border-slate-200 p-3"><legend className="px-1 text-xs font-bold text-slate-700">HSL</legend>
              <div className="grid grid-cols-3 gap-2">
                {(['h', 's', 'l'] as const).map((key) => <label key={key} className="block text-[11px] font-semibold uppercase text-slate-600">{key}<input type="number" min={0} max={key === 'h' ? 360 : 100} value={Math.round(hsl[key])} onChange={(event) => setHslPart(key, event.target.value)} className={num} /></label>)}
              </div>
            </fieldset>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Result label="HEX" value={toHex(rgb)} />
            <Result label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} />
            <Result label="HSL" value={`hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`} />
            <Result label="RGB (comma list)" value={`${rgb.r}, ${rgb.g}, ${rgb.b}`} />
          </div>
        </>
      )}
      <div className="mt-6 rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-bold text-slate-900">Text contrast check (WCAG)</h2>
        <p className="mt-1 text-xs text-slate-500">Uses the colour above as the text colour on this background.</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block text-xs font-semibold text-slate-700">Background<input type="color" value={bg ? toHex(bg) : '#ffffff'} onChange={(event) => setBackground(event.target.value)} className="mt-1.5 block h-10 w-16 cursor-pointer rounded border border-slate-200 bg-white p-1" /></label>
          <label className="block text-xs font-semibold text-slate-700">Hex<input value={background} onChange={(event) => setBackground(event.target.value)} className="mt-1.5 w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm" /></label>
        </div>
        {ratio !== null && rgb && bg ? (
          <>
            <div className="mt-3 rounded-lg p-4 text-base font-semibold" style={{ backgroundColor: toHex(bg), color: toHex(rgb) }}>Sample text on this background</div>
            <p className="mt-2 text-sm" aria-live="polite">Contrast ratio: <strong>{ratio.toFixed(2)} : 1</strong></p>
            <ul className="mt-2 flex flex-wrap gap-2">
              <Verdict label="AA normal text (4.5)" pass={ratio >= 4.5} /><Verdict label="AA large text (3)" pass={ratio >= 3} />
              <Verdict label="AAA normal text (7)" pass={ratio >= 7} /><Verdict label="AAA large text (4.5)" pass={ratio >= 4.5} />
            </ul>
          </>
        ) : <p className="mt-3 text-xs text-red-700" role="alert">Enter valid hex codes for both colours.</p>}
      </div>
      <p className="mt-4 text-center text-[10px] text-slate-400">Converted in your browser. Large text means about 24 px, or 19 px bold, and above.</p>
    </section>
  );
};

export default ColorConverter;
