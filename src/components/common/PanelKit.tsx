import React from 'react';

export const card = 'rounded-xl border border-slate-200 bg-white p-4';
export const heading = 'text-sm font-bold text-slate-900';

export const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (value: number) => void }> = ({ label, value, min, max, step, unit = 'mm', onChange }) => (
  <label className="block text-xs font-semibold text-slate-700">
    <span className="flex justify-between"><span>{label}</span><span className="font-bold text-slate-900">{Math.round(value * 100) / 100} {unit}</span></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full accent-orange-700" />
  </label>
);

export const Toggle: React.FC<{ label: string; checked: boolean; onChange: (value: boolean) => void; hint?: string }> = ({ label, checked, onChange, hint }) => (
  <label className="flex items-start gap-2 text-xs text-slate-800">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-700" />
    <span><span className="font-semibold">{label}</span>{hint && <span className="block text-[11px] text-slate-500">{hint}</span>}</span>
  </label>
);
