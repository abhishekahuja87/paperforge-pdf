import React from 'react';
import { Check } from 'lucide-react';

export interface Preset { id: string; label: string; blurb: string }

/** Quick-start buttons. The chosen one stays marked "Loaded" so it is clear on a phone that the tap worked. */
export const PresetGrid: React.FC<{ title?: string; hint?: string; presets: Preset[]; active: string | null; onPick: (id: string) => void }> = ({ title = 'Quick start', hint, presets, active, onPick }) => (
  <div className="space-y-2">
    <h2 className="text-sm font-black text-stone-900">{title}</h2>
    {hint && <p className="text-xs text-stone-500">{hint}</p>}
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {presets.map((preset) => (
        <li key={preset.id}>
          <button type="button" aria-pressed={active === preset.id} onClick={() => onPick(preset.id)} className={`h-full w-full rounded-xl border p-3 text-left transition ${active === preset.id ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' : 'border-orange-200 bg-white hover:border-orange-400 hover:bg-orange-50'}`}>
            <span className="flex items-center justify-between gap-2 text-sm font-bold text-stone-900">{preset.label}{active === preset.id && <span className="inline-flex items-center gap-1 rounded-full bg-orange-700 px-2 py-0.5 text-[10px] font-bold text-white"><Check className="h-3 w-3" aria-hidden="true" />Loaded</span>}</span>
            <span className="mt-0.5 block text-[11px] leading-4 text-stone-500">{preset.blurb}</span>
          </button>
        </li>
      ))}
    </ul>
  </div>
);
