import React from 'react';
import { WORD_DESIGNS, tint } from '../../../lib/docs/designs';

/** A grid of design cards for the Word makers. Each card shows the colours and the name; choosing one sets the colours, font, title style and headings. */
export const DesignPicker: React.FC<{ label: string; hint: string; value: string; names: Record<string, string>; onChange: (id: string) => void }> = ({ label, hint, value, names, onChange }) => (
  <div>
    <p className="mb-1 text-xs font-semibold text-slate-700">{label}</p>
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {WORD_DESIGNS.map((d) => {
        const on = d.id === value;
        return (
          <button key={d.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(d.id)} className={`flex min-h-11 flex-col gap-1 rounded-xl border p-2 text-left text-[11px] font-semibold text-slate-700 ${on ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-300' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <span aria-hidden="true" className="flex h-8 w-full overflow-hidden rounded-md border border-slate-200">
              <span className="w-1/2" style={{ background: `#${d.accent}` }} />
              <span className="w-1/4" style={{ background: `#${d.accent2}` }} />
              <span className="w-1/4" style={{ background: `#${tint(d.accent, 0.88)}` }} />
            </span>
            <span style={{ fontFamily: `${d.font}, sans-serif` }}>{names[d.id] ?? d.id}</span>
          </button>
        );
      })}
    </div>
    <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
  </div>
);
